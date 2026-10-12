-- Buildon CMS — enquiries from the public forms.
--
-- Why this table exists at all: the site had no store for its own leads. A
-- submission opened the visitor's mail client, or went to Netlify Forms, and
-- both of those are somebody else's system. Netlify Forms in particular only
-- works on Netlify — move the site to any other host and every enquiry stops
-- arriving, silently, with nothing in the build to say so.
--
-- A row here is written by the browser, with the publishable key, from
-- wherever the site happens to be served. That is the whole point: the form
-- works on localhost, on Netlify, and on whatever the site is moved to next,
-- because the thing receiving it is the database rather than the host.

create table if not exists public.enquiries (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),

  name         text not null,
  email        text not null,
  phone        text not null,
  message      text not null,

  -- Only the quote dialog's longer form asks for these.
  company      text,
  enquiry_type text,

  -- Which form, and which page it sat on. Three places on the site send the
  -- same shape of enquiry and the desk answering them should not have to guess.
  source       text,
  page         text,

  -- Worked through, or not. Deliberately not an enum: "what we do with an
  -- enquiry" is a process that will change, and a text column with a check is
  -- one migration to widen instead of a type to alter.
  handled      boolean not null default false,
  handled_at   timestamptz,
  handled_by   uuid references auth.users (id) on delete set null,
  note         text
);

comment on table public.enquiries is
  'Submissions from the public enquiry forms. Written by anonymous visitors, read by editors.';

create index if not exists enquiries_created_at_idx
  on public.enquiries (created_at desc);

-- Unhandled first is the only list anyone opens this for.
create index if not exists enquiries_handled_idx
  on public.enquiries (handled, created_at desc);

alter table public.enquiries enable row level security;

-- Anyone may write one. That is what a public contact form is, and there is no
-- server in front of it to do the writing instead.
--
-- The limits that matter are in the column constraints below, not in the
-- policy: a policy cannot tell a visitor from a script, and pretending
-- otherwise would be the kind of check that feels like security and is not.
drop policy if exists "anyone may leave an enquiry" on public.enquiries;
create policy "anyone may leave an enquiry"
  on public.enquiries for insert
  to anon, authenticated
  with check (
    -- Length caps, so a loop cannot fill the table a megabyte at a time.
    length(name) between 2 and 120
    and length(email) between 5 and 200
    and length(phone) between 6 and 40
    and length(message) between 10 and 5000
    and (company is null or length(company) <= 200)
    and (enquiry_type is null or length(enquiry_type) <= 100)
    and (source is null or length(source) <= 60)
    and (page is null or length(page) <= 300)
    -- An insert may not arrive pre-marked as dealt with.
    and handled = false
    and handled_at is null
    and handled_by is null
    and note is null
  );

-- Nobody may read them back but an editor. Without this the publishable key
-- would hand every lead the company has to anyone who opens devtools.
drop policy if exists "editors read enquiries" on public.enquiries;
create policy "editors read enquiries"
  on public.enquiries for select
  to authenticated
  using (public.is_editor());

drop policy if exists "editors update enquiries" on public.enquiries;
create policy "editors update enquiries"
  on public.enquiries for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Deleting is a super admin's call. An enquiry is a record of someone asking
-- for something, and an editor clearing the list is how that record is lost.
drop policy if exists "super admins delete enquiries" on public.enquiries;
create policy "super admins delete enquiries"
  on public.enquiries for delete
  to authenticated
  using (public.is_super_admin());

-- Stamp who dealt with it, rather than trusting the browser to say.
create or replace function public.enquiry_mark_handled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.handled is distinct from old.handled then
    new.handled_at := case when new.handled then now() else null end;
    new.handled_by := case when new.handled then auth.uid() else null end;
  end if;
  return new;
end;
$$;

drop trigger if exists enquiries_mark_handled on public.enquiries;
create trigger enquiries_mark_handled
  before update on public.enquiries
  for each row execute function public.enquiry_mark_handled();
