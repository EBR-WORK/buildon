-- Buildon CMS — archiving a lead, and taking one by hand.
--
-- Archiving is not deleting and not losing. A lead that went nowhere should
-- leave the list without leaving the record: the enquiry still happened, the
-- notes still explain why it stopped, and a year from now "how many did we
-- get" has to count it.
--
-- So a flag rather than a delete, and every list filters on it by default.

alter table public.enquiries
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users (id) on delete set null;

comment on column public.enquiries.archived is
  'Out of the working lists, still in the record. Never deleted by archiving.';

-- The index every list uses: not archived, newest first.
create index if not exists enquiries_live_idx
  on public.enquiries (archived, created_at desc);

create or replace function public.enquiry_mark_archived()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.archived is distinct from old.archived then
    new.archived_at := case when new.archived then now() else null end;
    new.archived_by := case when new.archived then auth.uid() else null end;
  end if;
  return new;
end;
$$;

drop trigger if exists enquiries_mark_archived on public.enquiries;
create trigger enquiries_mark_archived
  before update on public.enquiries
  for each row execute function public.enquiry_mark_archived();

-- Archiving joins the history the same way everything else does.
alter table public.lead_events drop constraint if exists lead_events_kind_check;
alter table public.lead_events add constraint lead_events_kind_check
  check (kind in ('created', 'assigned', 'unassigned', 'status', 'priority', 'place', 'archived'));

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
    values (new.id, actor, 'status', jsonb_build_object('from', old.status, 'to', new.status));
  end if;

  if new.priority is distinct from old.priority then
    insert into public.lead_events (enquiry_id, actor_id, kind, detail)
    values (new.id, actor, 'priority', jsonb_build_object('from', old.priority, 'to', new.priority));
  end if;

  if new.place_id is distinct from old.place_id then
    insert into public.lead_events (enquiry_id, actor_id, kind, detail)
    values (new.id, actor, 'place', jsonb_build_object('from', old.place_id, 'to', new.place_id));
  end if;

  if new.archived is distinct from old.archived then
    insert into public.lead_events (enquiry_id, actor_id, kind, detail)
    values (new.id, actor, 'archived', jsonb_build_object('to', new.archived));
  end if;

  return new;
end;
$$;

-- --------------------------------------------------------- taking one by hand
--
-- A lead that arrives by phone or at the counter is the same shape as one from
-- the website, so it is the same table and the same insert policy. What that
-- policy requires of the website — a message of at least ten characters — is
-- the only thing that gets in the way, and loosening it for everyone to suit
-- the panel would weaken the public form.
--
-- So the panel passes whatever was said, and where nothing was, it writes what
-- actually happened: that somebody rang. Honest, and over ten characters.

comment on table public.enquiries is
  'Enquiries from the website and leads taken by hand. source says which.';
