-- Buildon CRM — dismissing one notification rather than all of them.
--
-- 0018 stores one timestamp per person per stream: when they last looked.
-- That answers "mark all read" exactly and cannot answer "mark this one
-- read" at all — a timestamp cannot say "everything before this except the
-- third one".
--
-- So the exceptions are stored, and only the exceptions. A row here means
-- "this person has dealt with this item"; everything else is still judged by
-- the timestamp.
--
-- WHY THIS DOES NOT GROW WITHOUT END
--
-- Marking all read moves the timestamp past everything, which makes every
-- dismissal before it redundant — those rows are deleted at the same moment
-- (see markSeen in src/lib/cms/notifications.ts). What remains is at most the
-- handful of items a person has dismissed individually since they last
-- cleared the lot.

create table if not exists public.notification_dismissed (
  user_id uuid not null references auth.users (id) on delete cascade,
  /* Matches notification_reads.stream — 'leads', 'unassigned',
     'applications'. The same string in both places on purpose: they are two
     halves of one answer. */
  stream text not null,
  /* The enquiry or application. Not a foreign key: the row it points at may
     be deleted, and a dismissal outliving its subject is harmless — it simply
     matches nothing. A cascade here would mean a delete on enquiries taking a
     lock on this table for no gain. */
  item_id bigint not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, stream, item_id)
);

comment on table public.notification_dismissed is
  'Items a person has dismissed one at a time. The bulk case is a timestamp in notification_reads.';

alter table public.notification_dismissed enable row level security;

/* Own rows only. Nothing here is worth seeing about anybody else, and
   dismissing your own notification is the whole of the write. */
drop policy if exists "own dismissals" on public.notification_dismissed;

create policy "own dismissals"
  on public.notification_dismissed for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

/* Asked on every load: "which of these has this person already dealt with".
   The primary key covers (user_id, stream, item_id), which serves a lookup by
   (user_id, stream) as its prefix — so no second index is needed. */
