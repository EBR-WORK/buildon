-- Buildon CMS — six roles, places, and leads that belong to someone.
--
-- Until now there were two roles and one question: may this account edit the
-- site? That was right while everyone who signed in was an editor. It stops
-- being right the moment a salesperson has a login, because the thing they
-- must not see is not the CMS — it is each other's leads.
--
-- So the model changes shape. Instead of one `is_editor()` gate in front of
-- everything, each table is governed by what its own work is:
--
--   content, media        content editors and super admins
--   job postings          HR and super admins
--   applications          HR and super admins
--   leads, all of them    marketing and presales (presales read-only)
--   leads, mine           sales, and only the ones assigned to them
--   places, team, settings super admins
--
-- `is_editor()` keeps its old meaning — "has a profile at all" — because a
-- dozen policies already depend on it and quietly redefining it would hand
-- every salesperson the CMS. What it gates narrows instead: see the content
-- policies at the end.

-- ------------------------------------------------------------------- roles
--
-- The enum becomes a text column with a check.
--
-- Not a preference. Postgres refuses to let a new enum value be used in the
-- same transaction that added it — "unsafe use of new value" — and the SQL
-- editor runs a whole file as one transaction. So `alter type ... add value`
-- followed by anything that mentions the new value fails, every time, and the
-- workarounds are all worse than the problem: splitting this into two files
-- somebody must run in the right order, or casting every comparison to text
-- while the column stays an enum nobody can safely extend.
--
-- A check constraint says exactly what the enum said. Adding a seventh role
-- later is one line here instead of a migration that cannot be run in one go.
-- It is the same choice already made for lead status, three sections down.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'role' and data_type <> 'text'
  ) then
    alter table public.profiles  alter column role drop default;
    alter table public.profiles  alter column role type text using role::text;
    alter table public.profiles  alter column role set default 'content_editor';

    alter table public.admin_invites alter column role drop default;
    alter table public.admin_invites alter column role type text using role::text;
    alter table public.admin_invites alter column role set default 'content_editor';
  end if;
end
$$;

-- 'admin' is the original role, kept so existing rows stay valid. It means
-- what content_editor means and the application treats it that way.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('super_admin', 'content_editor', 'hr', 'marketing', 'sales', 'presales', 'admin'));

alter table public.admin_invites drop constraint if exists admin_invites_role_check;
alter table public.admin_invites add constraint admin_invites_role_check
  check (role in ('super_admin', 'content_editor', 'hr', 'marketing', 'sales', 'presales', 'admin'));

-- Returned text now, so it no longer depends on the type being there.
--
-- Dropped first: `create or replace` cannot change a function's return type,
-- and this one returned the enum. The same goes for has_role below, which an
-- earlier attempt at this file may have created taking admin_role[].
drop function if exists public.current_admin_role();
drop function if exists public.has_role(text[]);

/* Only if the type is still there. Naming admin_role in a plain `drop
   function` statement is itself an error once the type is gone, which would
   make this file fail the second time it is run. */
do $$
begin
  if exists (select 1 from pg_type where typname = 'admin_role') then
    execute 'drop function if exists public.has_role(public.admin_role[])';
  end if;
end
$$;

create function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Nothing refers to the type once both columns are text. Left in place if
-- anything still does — an unused type costs nothing, and failing here would
-- roll back the whole file.
do $$
begin
  if not exists (
    select 1 from pg_depend d
    join pg_type t on t.oid = d.refobjid
    where t.typname = 'admin_role' and d.deptype <> 'p'
  ) then
    drop type if exists public.admin_role;
  end if;
exception when others then
  null;
end
$$;

-- ------------------------------------------------------------------ places
--
-- A branch, and the thing a salesperson belongs to. Leads are assigned within
-- a place, which is the only reason this exists: "assign to a salesperson of
-- that place" needs both ends to know which place they mean.

create table if not exists public.places (
  id         bigint generated always as identity primary key,
  name       text not null unique,
  -- Deactivated rather than deleted: a closed branch still has leads and
  -- people pointing at it, and deleting it would orphan both.
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.places is 'Branches. A salesperson belongs to one; a lead is assigned within one.';

alter table public.profiles
  add column if not exists place_id bigint references public.places (id) on delete set null;

comment on column public.profiles.place_id is
  'Which branch this person belongs to. Null for roles that are not tied to one.';

alter table public.places enable row level security;

-- Everyone signed in reads them: marketing assigns across all of them, and a
-- salesperson's own branch is on their dashboard.
drop policy if exists "staff read places" on public.places;
create policy "staff read places"
  on public.places for select
  to authenticated
  using (public.is_editor());

drop policy if exists "super admins write places" on public.places;
create policy "super admins write places"
  on public.places for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ------------------------------------------------------- role predicates
--
-- One function per question the policies actually ask, rather than per role.
-- A policy that reads `can_assign_leads()` keeps saying what it means when the
-- roles change; one that reads `role = 'marketing'` has to be found and edited.

-- Plain text in, plain text out: the column is text and the check above is
-- what keeps it honest.
create function public.has_role(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any(roles)
  );
$$;

create or replace function public.can_edit_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- 'admin' is the original role and meant exactly this.
  select public.has_role(array['super_admin', 'content_editor', 'admin']);
$$;

create or replace function public.can_manage_jobs()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(array['super_admin', 'hr']);
$$;

create or replace function public.can_see_all_leads()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(array['super_admin', 'marketing', 'presales']);
$$;

create or replace function public.can_assign_leads()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(array['super_admin', 'marketing']);
$$;

-- ------------------------------------------------------------------ leads

alter table public.enquiries
  add column if not exists place_id    bigint references public.places (id) on delete set null,
  add column if not exists assigned_to uuid   references auth.users (id) on delete set null,
  add column if not exists assigned_by uuid   references auth.users (id) on delete set null,
  add column if not exists assigned_at timestamptz,
  add column if not exists status      text not null default 'new';

-- Text with a check, not an enum: a sales process changes, and widening a
-- check is one migration where altering a type is several.
alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries add constraint enquiries_status_check
  check (status in ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost'));

create index if not exists enquiries_assigned_idx on public.enquiries (assigned_to, status);
create index if not exists enquiries_place_idx    on public.enquiries (place_id, status);

-- Stamp who assigned and when, rather than trusting the browser to say.
create or replace function public.enquiry_mark_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_to is distinct from old.assigned_to then
    new.assigned_at := case when new.assigned_to is null then null else now() end;
    new.assigned_by := case when new.assigned_to is null then null else auth.uid() end;
  end if;
  return new;
end;
$$;

drop trigger if exists enquiries_mark_assigned on public.enquiries;
create trigger enquiries_mark_assigned
  before update on public.enquiries
  for each row execute function public.enquiry_mark_assigned();

-- A lead's history, not one field that each person overwrites. Sales and
-- presales both write here, and both need to see what the other said.
create table if not exists public.enquiry_notes (
  id          bigint generated always as identity primary key,
  enquiry_id  bigint not null references public.enquiries (id) on delete cascade,
  author_id   uuid references auth.users (id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists enquiry_notes_enquiry_idx
  on public.enquiry_notes (enquiry_id, created_at desc);

alter table public.enquiry_notes enable row level security;

-- ---------------------------------------------------------- lead policies

drop policy if exists "editors read enquiries" on public.enquiries;
drop policy if exists "editors update enquiries" on public.enquiries;

-- Marketing and presales see every lead; sales sees the ones given to them and
-- nothing else. That last clause is the whole point of this migration.
drop policy if exists "staff read leads" on public.enquiries;
create policy "staff read leads"
  on public.enquiries for select
  to authenticated
  using (
    public.can_see_all_leads()
    or assigned_to = auth.uid()
  );

-- Marketing assigns. Sales may change a lead that is already theirs, which is
-- why `using` and `with check` differ: the row they may touch is one already
-- assigned to them, and they may not hand it to somebody else.
drop policy if exists "marketing assigns leads" on public.enquiries;
create policy "marketing assigns leads"
  on public.enquiries for update
  to authenticated
  using (public.can_assign_leads())
  with check (public.can_assign_leads());

drop policy if exists "sales update own leads" on public.enquiries;
create policy "sales update own leads"
  on public.enquiries for update
  to authenticated
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

-- Presales is read-only on the lead itself and writes in the notes instead.
drop policy if exists "staff read notes" on public.enquiry_notes;
create policy "staff read notes"
  on public.enquiry_notes for select
  to authenticated
  using (
    public.can_see_all_leads()
    or exists (
      select 1 from public.enquiries e
      where e.id = enquiry_id and e.assigned_to = auth.uid()
    )
  );

drop policy if exists "staff write notes" on public.enquiry_notes;
create policy "staff write notes"
  on public.enquiry_notes for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (
      public.can_see_all_leads()
      or exists (
        select 1 from public.enquiries e
        where e.id = enquiry_id and e.assigned_to = auth.uid()
      )
    )
  );

-- A note is a record of what was said. Editing one is not a correction, it is
-- a rewrite of the history, so only super admins may remove one.
drop policy if exists "super admins delete notes" on public.enquiry_notes;
create policy "super admins delete notes"
  on public.enquiry_notes for delete
  to authenticated
  using (public.is_super_admin());

-- --------------------------------------------------- applications are HR's

drop policy if exists "editors read applications" on public.applications;
create policy "editors read applications"
  on public.applications for select
  to authenticated
  using (public.can_manage_jobs());

drop policy if exists "editors update applications" on public.applications;
create policy "editors update applications"
  on public.applications for update
  to authenticated
  using (public.can_manage_jobs())
  with check (public.can_manage_jobs());

-- ------------------------------------------- content is the editors' alone
--
-- Narrowed from is_editor() — "anybody with a profile" — now that a profile
-- can belong to a salesperson.

drop policy if exists "editors write content" on public.content;
create policy "editors write content"
  on public.content for all
  to authenticated
  using (public.can_edit_content())
  with check (public.can_edit_content());

drop policy if exists "editors write media" on storage.objects;
create policy "editors write media"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'media' and public.can_edit_content())
  with check (bucket_id = 'media' and public.can_edit_content());

drop policy if exists "editors write translations" on public.translations;
create policy "editors write translations"
  on public.translations for all
  to authenticated
  using (public.can_edit_content())
  with check (public.can_edit_content());

-- CVs are HR's, not every editor's.
drop policy if exists "editors read cvs" on storage.objects;
create policy "editors read cvs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'applications' and public.can_manage_jobs());
