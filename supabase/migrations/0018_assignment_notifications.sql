-- Buildon CRM — tell each role what has arrived for them.
--
-- Work arrives in this panel and nobody is told. A lead is assigned and the
-- salesperson learns of it by opening the Leads screen and noticing. A CV
-- arrives and HR finds it on their next visit. A lead comes in unassigned and
-- sits there until marketing happens to look. A lead nobody notices is a lead
-- nobody rings.
--
-- WHAT IS AND IS NOT STORED
--
-- No notification rows. The work IS the notification: `enquiries` already
-- records assigned_to and assigned_at, `applications` records created_at. So
-- "what is new for me" is a question about tables that already exist, and a
-- second copy of those facts in a notifications table would be two records of
-- one thing, kept in step by hand until the day they disagree.
--
-- The only thing missing is "since I last looked", which is one timestamp per
-- person per kind of work.
--
-- WHY A STREAM COLUMN RATHER THAN A COLUMN PER KIND
--
-- The first version of this file had `leads_seen_at`, and was applied before
-- the second kind of work existed. Adding applications would have meant
-- `applications_seen_at` beside it, then a third column, each one a migration
-- and each call site having to know which column it wanted. A row per
-- (person, stream) adds a stream by writing a string.
--
-- This file upgrades that first shape rather than replacing it, so it is safe
-- to run whether or not the earlier version was applied, and safe to run
-- twice.
--
-- WHY ITS OWN TABLE RATHER THAN A COLUMN ON profiles
--
-- profiles is where roles live, and it is written by super admins — that is
-- what granting a role IS. Putting this there would mean every user needs
-- permission to update their own profile row, and a policy that allows "your
-- own row, but only this column" is one careless edit away from "your own
-- row, including your role". This table cannot grant anything, so the worst a
-- bad write can do is mark your own notifications as read.

create table if not exists public.notification_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  stream text not null default 'leads',
  seen_at timestamptz not null default '1970-01-01T00:00:00Z',
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------- upgrade the first shape

do $$
begin
  -- The new columns, if this is the table the earlier version created.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notification_reads'
      and column_name = 'stream'
  ) then
    alter table public.notification_reads add column stream text not null default 'leads';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notification_reads'
      and column_name = 'seen_at'
  ) then
    alter table public.notification_reads
      add column seen_at timestamptz not null default '1970-01-01T00:00:00Z';
  end if;

  -- Carry over whatever the old column held, then retire it. Anybody who had
  -- dismissed their leads keeps having dismissed them.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notification_reads'
      and column_name = 'leads_seen_at'
  ) then
    update public.notification_reads
      set seen_at = leads_seen_at, stream = 'leads'
      where stream = 'leads';
    alter table public.notification_reads drop column leads_seen_at;
  end if;

  -- The key becomes (person, stream): one person now has a row per kind of
  -- work, where before they had exactly one.
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.notification_reads'::regclass
      and contype = 'p'
      and pg_get_constraintdef(oid) = 'PRIMARY KEY (user_id)'
  ) then
    alter table public.notification_reads drop constraint notification_reads_pkey;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.notification_reads'::regclass and contype = 'p'
  ) then
    alter table public.notification_reads
      add primary key (user_id, stream);
  end if;
end
$$;

comment on table public.notification_reads is
  'One row per person per stream: when they last looked at that kind of work.';

comment on column public.notification_reads.stream is
  'leads, unassigned, applications — the list that matters is in src/lib/cms/notifications.ts. Deliberately not an enum: adding a stream should not need a migration, and an unknown value simply matches nothing.';

comment on column public.notification_reads.seen_at is
  'Defaults to the epoch, so somebody who has never looked sees everything rather than nothing.';

alter table public.notification_reads enable row level security;

/* Own rows only, for reading and writing both. There is nothing here worth
   seeing about anybody else, and marking your own notifications read is the
   whole of the write.

   Dropped first so this file can be run again — the earlier version created a
   policy of the same name, and `create policy` has no `if not exists`. */
drop policy if exists "own notification state" on public.notification_reads;

create policy "own notification state"
  on public.notification_reads for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------- what is new
--
-- The queries live in the panel rather than in views here, because what counts
-- as "mine" is a question about roles, and roles are already expressed in
-- src/lib/cms/roles.ts. A view would be a second place to state the same rule.
--
-- Rows appear the first time somebody dismisses something. Until then the
-- default applies and everything counts as new.
