-- Buildon CMS — the presales tracker.
--
-- Presales watches and advises. It sees every assignment across every place,
-- and it does not move anybody's lead: the integrity of a status belongs to
-- whoever owns the lead, because they are the one who spoke to the customer.
--
-- What presales does own is the qualification in front of the sale — "verify
-- budget", "flag to marketing" — and that needed somewhere to live. A note
-- could not hold it: a task has a due date and a state, and a note is a
-- sentence in a thread.

-- ------------------------------------------------------------- updated_at
--
-- The tracker's "Updated" column, and the thing a live subscription has to
-- order by. The row knew when it arrived and never when it last moved.

alter table public.enquiries
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_enquiry()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists enquiries_touch on public.enquiries;
create trigger enquiries_touch
  before update on public.enquiries
  for each row execute function public.touch_enquiry();

create index if not exists enquiries_updated_idx on public.enquiries (updated_at desc);

/* Existing rows: the last thing that happened to them, or when they arrived.
   Better than stamping them all with now(), which would make a year of leads
   look like they changed this morning.

   Guarded on lead_events existing, because this file should not fail when it
   is run before 0012 — depending on a sibling having been run already is a
   trap, and the fallback (the arrival time) is correct on its own. */
do $$
begin
  if to_regclass('public.lead_events') is not null then
    execute $q$
      update public.enquiries e
      set updated_at = coalesce(
        (select max(v.created_at) from public.lead_events v where v.enquiry_id = e.id),
        e.created_at
      )
      where e.updated_at = e.created_at
    $q$;
  else
    update public.enquiries set updated_at = created_at where updated_at <> created_at;
  end if;
end
$$;

-- ------------------------------------------------------------------ tasks

create table if not exists public.lead_tasks (
  id          bigint generated always as identity primary key,
  enquiry_id  bigint not null references public.enquiries (id) on delete cascade,

  -- What has to happen next, in somebody's own words.
  action      text not null,
  -- Date, not timestamp: "today" and "tomorrow" is the resolution anybody
  -- works at here, and a time would be a false promise.
  due_on      date,

  done        boolean not null default false,
  done_at     timestamptz,
  done_by     uuid references auth.users (id) on delete set null,

  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

comment on table public.lead_tasks is
  'Qualification and follow-up, owned by presales. The one place presales writes.';

create index if not exists lead_tasks_open_idx
  on public.lead_tasks (done, due_on);
create index if not exists lead_tasks_lead_idx
  on public.lead_tasks (enquiry_id, created_at desc);

alter table public.lead_tasks enable row level security;

-- Visible where the lead is visible: presales and marketing see all of them,
-- and a salesperson sees the ones on leads they hold — which is the point of
-- presales writing them at all.
drop policy if exists "staff read tasks" on public.lead_tasks;
create policy "staff read tasks"
  on public.lead_tasks for select
  to authenticated
  using (
    public.can_see_all_leads()
    or exists (
      select 1 from public.enquiries e
      where e.id = enquiry_id and e.assigned_to = auth.uid()
    )
  );

-- Written by whoever can see every lead — presales, marketing, super admins.
-- Not by sales: a task is somebody else asking for something, and a list you
-- can write your own entries into is a list, not a request.
drop policy if exists "presales write tasks" on public.lead_tasks;
create policy "presales write tasks"
  on public.lead_tasks for insert
  to authenticated
  with check (public.can_see_all_leads() and created_by = auth.uid());

-- Ticking one off is the other half, and that IS sales's to do: the person who
-- did the thing is the person who says it is done.
drop policy if exists "staff complete tasks" on public.lead_tasks;
create policy "staff complete tasks"
  on public.lead_tasks for update
  to authenticated
  using (
    public.can_see_all_leads()
    or exists (
      select 1 from public.enquiries e
      where e.id = enquiry_id and e.assigned_to = auth.uid()
    )
  )
  with check (
    public.can_see_all_leads()
    or exists (
      select 1 from public.enquiries e
      where e.id = enquiry_id and e.assigned_to = auth.uid()
    )
  );

drop policy if exists "super admins delete tasks" on public.lead_tasks;
create policy "super admins delete tasks"
  on public.lead_tasks for delete
  to authenticated
  using (public.is_super_admin());

create or replace function public.task_mark_done()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.done is distinct from old.done then
    new.done_at := case when new.done then now() else null end;
    new.done_by := case when new.done then auth.uid() else null end;
  end if;
  return new;
end;
$$;

drop trigger if exists lead_tasks_mark_done on public.lead_tasks;
create trigger lead_tasks_mark_done
  before update on public.lead_tasks
  for each row execute function public.task_mark_done();

-- --------------------------------------------------------------- realtime
--
-- What makes the tracker say LIVE rather than needing a refresh. Supabase
-- streams changes from the tables in this publication, and applies the same
-- policies to the stream as to a query — so presales receives every
-- assignment and a salesperson receives only their own, without either being
-- asked for.
--
-- Wrapped: adding a table that is already published is an error, and this file
-- has to survive being run twice.

do $$
begin
  alter publication supabase_realtime add table public.enquiries;
exception when duplicate_object or others then
  null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.lead_tasks;
exception when duplicate_object or others then
  null;
end
$$;

-- An update tells a subscriber what changed only if the row carries its old
-- values too. Without this, "assigned to nobody -> assigned to A. Khan"
-- arrives as a row with no memory of having been unassigned.
alter table public.enquiries replica identity full;
alter table public.lead_tasks replica identity full;
