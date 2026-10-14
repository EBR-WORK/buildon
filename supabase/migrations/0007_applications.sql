-- Buildon CMS — job applications from the careers pages.
--
-- Separate from `enquiries` on purpose. An enquiry is somebody asking about a
-- product; an application is a person's name, salary and CV. They are
-- different shapes, they are read by different people, and one of them is
-- personal data that must never be publicly readable. Folding them into one
-- table would mean one policy governing both.
--
-- Until now an application opened the applicant's mail client and asked them
-- to attach their own CV — so the ones who did not were lost, and the ones who
-- did arrived in whichever inbox the mail client was signed in to.

create table if not exists public.applications (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),

  -- Which opening. Stored as text rather than a reference to the job: an
  -- application is a record of what somebody applied for, and it should not
  -- change or vanish when the opening is edited or taken down.
  job            text not null,

  first_name     text not null,
  last_name      text not null,
  email          text not null,
  phone          text not null,

  qualification  text,
  experience     text,
  ctc            text,
  preference     text,

  -- Path inside the private `applications` bucket. Null when the applicant
  -- sent no CV, which the form allows.
  cv_path        text,
  cv_name        text,

  handled        boolean not null default false,
  handled_at     timestamptz,
  handled_by     uuid references auth.users (id) on delete set null,
  note           text
);

comment on table public.applications is
  'Job applications. Written by anonymous visitors, readable only by editors.';

create index if not exists applications_created_at_idx
  on public.applications (created_at desc);

alter table public.applications enable row level security;

-- Anyone may apply. The caps are what stop a script filling the table; a
-- policy cannot tell a person from a loop.
drop policy if exists "anyone may apply" on public.applications;
create policy "anyone may apply"
  on public.applications for insert
  to anon, authenticated
  with check (
    length(job) between 2 and 200
    and length(first_name) between 1 and 80
    and length(last_name) between 1 and 80
    and length(email) between 5 and 200
    and length(phone) between 6 and 40
    and (qualification is null or length(qualification) <= 120)
    and (experience is null or length(experience) <= 120)
    and (ctc is null or length(ctc) <= 120)
    and (preference is null or length(preference) <= 120)
    and (cv_path is null or length(cv_path) <= 400)
    and (cv_name is null or length(cv_name) <= 260)
    and handled = false
    and handled_at is null
    and handled_by is null
    and note is null
  );

-- No anon select, at all. This table holds names, phone numbers and salaries;
-- the publishable key is in every visitor's browser.
drop policy if exists "editors read applications" on public.applications;
create policy "editors read applications"
  on public.applications for select
  to authenticated
  using (public.is_editor());

drop policy if exists "editors update applications" on public.applications;
create policy "editors update applications"
  on public.applications for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

drop policy if exists "super admins delete applications" on public.applications;
create policy "super admins delete applications"
  on public.applications for delete
  to authenticated
  using (public.is_super_admin());

create or replace function public.application_mark_handled()
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

drop trigger if exists applications_mark_handled on public.applications;
create trigger applications_mark_handled
  before update on public.applications
  for each row execute function public.application_mark_handled();

-- ------------------------------------------------------------------ storage
--
-- A PRIVATE bucket, unlike `media`. A CV is somebody's address, their career
-- and often their salary history; `media` is public because the site serves
-- from it, and a CV in there would be one guessed URL away from anyone.
--
-- Editors read it through a signed link that expires. Nothing is served
-- directly.

insert into storage.buckets (id, name, public)
values ('applications', 'applications', false)
on conflict (id) do nothing;

-- Upload only. An applicant can put a file in and can never list, read or
-- replace anything — including their own, which is the point: a policy that
-- let them read back what they uploaded would let anyone read every CV.
drop policy if exists "anyone may upload a cv" on storage.objects;
create policy "anyone may upload a cv"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'applications');

drop policy if exists "editors read cvs" on storage.objects;
create policy "editors read cvs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'applications' and public.is_editor());

drop policy if exists "super admins delete cvs" on storage.objects;
create policy "super admins delete cvs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'applications' and public.is_super_admin());

-- ------------------------------------------------------- email notification
--
-- The same function the enquiries trigger uses. It tells the two apart by
-- shape — an application carries a job and a first name — and signs a link to
-- the CV so the office can read it from the email.
--
-- Replace the three placeholders exactly as in 0006_enquiry_notify.sql, and
-- keep the edited copy out of git.

create or replace function public.notify_application()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url     := 'https://shhzbxaqbxgpqhgrhksf.supabase.co/functions/v1/enquiry-email',
    headers := jsonb_build_object(
      'Content-Type',     'application/json',
      'Authorization',    'Bearer sb_publishable_qU22AHMaARicjxbK4-_1CQ_DsoBzE1Z',
      'x-webhook-secret', 'hJ37NW5Ylx_Pk6TiESNreQpWdfjlefWM'
    ),
    body    := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

drop trigger if exists applications_notify on public.applications;
create trigger applications_notify
  after insert on public.applications
  for each row execute function public.notify_application();
