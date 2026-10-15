-- Buildon CMS — assignment, priority, and a record of what happened.
--
-- Four rules, taken from how the team actually works:
--
--   1. A lead belongs to a place before it belongs to a person. Assigning is
--      choosing a salesperson OF THAT PLACE, so the place is decided first and
--      then locked — which is what stops a Mumbai lead landing in Surat.
--   2. Assigning moves the status by itself. "Assigned" is not a thing
--      somebody remembers to set; it is what assigning means.
--   3. Priority is the salesperson's queue order, and marketing sets it while
--      it still has the context to.
--   4. Everything above leaves a trace. Until now the lead held only its
--      current state, so "who moved this to Contacted, and when" had no
--      answer — which is also why the dashboard's activity feed could show
--      arrivals and assignments but never a status change.

-- ----------------------------------------------------------------- status
--
-- 'assigned' sits between new and contacted: given to somebody, not yet
-- spoken to. Widening a check is one line; this is why status was never an
-- enum.

alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries add constraint enquiries_status_check
  check (status in ('new', 'assigned', 'contacted', 'qualified', 'quoted', 'won', 'lost'));

-- --------------------------------------------------------------- priority

alter table public.enquiries
  add column if not exists priority text not null default 'normal';

alter table public.enquiries drop constraint if exists enquiries_priority_check;
alter table public.enquiries add constraint enquiries_priority_check
  check (priority in ('high', 'normal', 'low'));

comment on column public.enquiries.priority is
  'Queue order for whoever owns it. Set by marketing at assignment.';

create index if not exists enquiries_priority_idx
  on public.enquiries (priority, created_at desc);

-- ------------------------------------------------------------------ events
--
-- What happened to a lead, in order. Append-only by design: an event is a
-- record of a thing that occurred, and editing one is not a correction.

create table if not exists public.lead_events (
  id         bigint generated always as identity primary key,
  enquiry_id bigint not null references public.enquiries (id) on delete cascade,
  actor_id   uuid references auth.users (id) on delete set null,
  kind       text not null,
  -- The shape differs per kind, and a column per possible field would be
  -- mostly nulls. What reads this only ever renders it as a sentence.
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.lead_events drop constraint if exists lead_events_kind_check;
alter table public.lead_events add constraint lead_events_kind_check
  check (kind in ('created', 'assigned', 'unassigned', 'status', 'priority', 'place'));

create index if not exists lead_events_lead_idx
  on public.lead_events (enquiry_id, created_at desc);
create index if not exists lead_events_recent_idx
  on public.lead_events (created_at desc);

alter table public.lead_events enable row level security;

-- Visible exactly where the lead is visible. Written by the triggers below,
-- which run as the definer and so are not subject to this.
drop policy if exists "staff read lead events" on public.lead_events;
create policy "staff read lead events"
  on public.lead_events for select
  to authenticated
  using (
    public.can_see_all_leads()
    or exists (
      select 1 from public.enquiries e
      where e.id = enquiry_id and e.assigned_to = auth.uid()
    )
  );

-- Nobody writes these by hand. No insert or update policy exists, so a browser
-- cannot forge history however it asks.

-- ------------------------------------------------------------- the trigger
--
-- One trigger, every change. Doing this in the application would mean every
-- future caller remembering to log, and the first one that forgets leaves a
-- gap nobody notices until they go looking.

create or replace function public.log_lead_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.lead_events (enquiry_id, actor_id, kind, detail)
    values (new.id, actor, 'created',
            jsonb_build_object('name', new.name, 'source', new.source, 'product', new.product));
    return new;
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    insert into public.lead_events (enquiry_id, actor_id, kind, detail)
    values (
      new.id, actor,
      case when new.assigned_to is null then 'unassigned' else 'assigned' end,
      jsonb_build_object('to', new.assigned_to, 'from', old.assigned_to, 'place', new.place_id)
    );
  end if;

  if new.status is distinct from old.status then
    insert into public.lead_events (enquiry_id, actor_id, kind, detail)
    values (new.id, actor, 'status',
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;

  if new.priority is distinct from old.priority then
    insert into public.lead_events (enquiry_id, actor_id, kind, detail)
    values (new.id, actor, 'priority',
            jsonb_build_object('from', old.priority, 'to', new.priority));
  end if;

  if new.place_id is distinct from old.place_id then
    insert into public.lead_events (enquiry_id, actor_id, kind, detail)
    values (new.id, actor, 'place',
            jsonb_build_object('from', old.place_id, 'to', new.place_id));
  end if;

  return new;
end;
$$;

drop trigger if exists enquiries_log_changes on public.enquiries;
create trigger enquiries_log_changes
  after insert or update on public.enquiries
  for each row execute function public.log_lead_change();

-- ------------------------------------------------- assigning sets the status
--
-- Before the row is written, so the event above records one change rather than
-- the application making two round trips and the history showing two moments.
--
-- Only from 'new': a lead that has been contacted and is then reassigned keeps
-- the progress it made. Dropping it back to 'assigned' would lose the one
-- thing the status is for.

create or replace function public.lead_assignment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_to is distinct from old.assigned_to
     and new.assigned_to is not null
     and new.status = 'new'
  then
    new.status := 'assigned';
  end if;

  -- Handing it back puts it in the unassigned pile where marketing looks.
  if new.assigned_to is null and old.assigned_to is not null and new.status = 'assigned' then
    new.status := 'new';
  end if;

  return new;
end;
$$;

drop trigger if exists enquiries_assignment_status on public.enquiries;
create trigger enquiries_assignment_status
  before update on public.enquiries
  for each row execute function public.lead_assignment_status();

-- ------------------------------------------------- a salesperson of a place
--
-- The rule the assign screen enforces, enforced where it cannot be stepped
-- around: the person a lead is given to must belong to the lead's place.
--
-- Super admins and marketing accounts have no branch of their own, so they are
-- exempt — somebody has to be able to hold a lead that has not been placed
-- yet, and that is the pile they work from.

create or replace function public.check_lead_assignee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assignee_place bigint;
  assignee_role  text;
begin
  if new.assigned_to is null or new.assigned_to is not distinct from old.assigned_to then
    return new;
  end if;

  select place_id, role into assignee_place, assignee_role
  from public.profiles where id = new.assigned_to;

  if assignee_role is null then
    raise exception 'That account cannot hold leads.';
  end if;

  if assignee_role in ('super_admin', 'marketing') then
    return new;
  end if;

  if new.place_id is not null and assignee_place is distinct from new.place_id then
    raise exception 'That person works in a different place from this lead.';
  end if;

  -- A lead with no place takes the place of whoever is given it, which is how
  -- the first assignment decides a branch without anyone typing one.
  if new.place_id is null then
    new.place_id := assignee_place;
  end if;

  return new;
end;
$$;

drop trigger if exists enquiries_check_assignee on public.enquiries;
create trigger enquiries_check_assignee
  before update on public.enquiries
  for each row execute function public.check_lead_assignee();

-- ----------------------------------------------------------- backfill
--
-- The leads already in the table predate all of this, so they have no history
-- at all. One 'created' event each, stamped with when they actually arrived,
-- so the activity feed does not begin with a cliff.

insert into public.lead_events (enquiry_id, kind, detail, created_at)
select e.id, 'created',
       jsonb_build_object('name', e.name, 'source', e.source, 'product', e.product),
       e.created_at
from public.enquiries e
where not exists (
  select 1 from public.lead_events v where v.enquiry_id = e.id and v.kind = 'created'
);
