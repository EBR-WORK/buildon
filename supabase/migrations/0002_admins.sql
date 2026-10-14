-- Buildon CMS — who may edit, and who may say who may edit.
--
-- RECONSTRUCTED. The original file was committed empty (a34b33c, 1 byte), so
-- this schema existed only in the live database. Every object below was
-- verified against it before this was written: the `profiles` columns, the
-- `admin_invites` columns, the two roles in use, and that all three functions
-- exist and are callable. It is `create ... if not exists` and `create or
-- replace` throughout, so running it against the live project changes nothing
-- and running it on a fresh one rebuilds what is there.
--
-- Two roles, not a permission matrix. An editor changes the site; a super
-- admin also decides who the editors are. Anything finer would be a system to
-- maintain for a team of three.
--
-- The important part is that none of this is enforced in the browser. The
-- admin panel is a static bundle anyone can read and step around; what stops
-- an outsider is the policies here, which Postgres applies to every request
-- whatever sent it.

-- ------------------------------------------------------------------- roles

do $$
begin
  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum ('admin', 'super_admin');
  end if;
end
$$;

-- One row per person who may use the panel.
--
-- Keyed to auth.users rather than holding its own credentials: Supabase Auth
-- owns passwords, sessions and resets, and a second store of who-is-who is a
-- second thing to keep in step. No row here means an account can sign in and
-- do nothing, which is exactly what an uninvited sign-up should be able to do.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       public.admin_role not null default 'admin',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

comment on table public.profiles is
  'Who may edit the site. A row here is what access means; auth.users alone is not.';

-- An address a super admin has named but who has not signed up yet.
create table if not exists public.admin_invites (
  email       text primary key,
  role        public.admin_role not null default 'admin',
  invited_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);

comment on table public.admin_invites is
  'Addresses invited to the panel. Consumed by handle_new_user when they sign up.';

-- --------------------------------------------------------------- functions
--
-- security definer, because a policy on `profiles` that reads `profiles`
-- recurses: the read is itself subject to the policy. Running as the owner
-- steps outside that. `set search_path` is what makes that safe — without it,
-- a caller could put their own `profiles` earlier on the path and have this
-- read theirs instead.

create or replace function public.current_admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

comment on function public.current_admin_role is
  'The signed-in account''s role, or null for anyone without a profile.';

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

comment on function public.is_editor is
  'Having a profile at all is what editing means.';

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- ---------------------------------------------------------------- policies

alter table public.profiles enable row level security;
alter table public.admin_invites enable row level security;

-- Editors see the team; the panel lists it. There is nothing sensitive in a
-- row — an address and a role — and hiding colleagues from each other would
-- make "who can fix this?" unanswerable.
drop policy if exists "editors read profiles" on public.profiles;
create policy "editors read profiles"
  on public.profiles for select
  to authenticated
  using (public.is_editor());

drop policy if exists "super admins write profiles" on public.profiles;
create policy "super admins write profiles"
  on public.profiles for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "super admins manage invites" on public.admin_invites;
create policy "super admins manage invites"
  on public.admin_invites for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ----------------------------------------------------------------- signup
--
-- A new account gets a profile only if its address was invited. This is what
-- makes sign-up safe to leave open: anyone may create an account, and without
-- an invitation it can do nothing at all.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.admin_invites;
begin
  select * into invite
  from public.admin_invites
  where lower(email) = lower(new.email) and accepted_at is null;

  if found then
    insert into public.profiles (id, email, role, created_by)
    values (new.id, new.email, invite.role, invite.invited_by)
    on conflict (id) do nothing;

    update public.admin_invites
    set accepted_at = now()
    where email = invite.email;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------- last resort
--
-- A project with no super admin cannot appoint one: the only role that may
-- write `profiles` is the one that no longer exists. Recovering from that
-- means the service key and a SQL editor, so it is refused here instead.

create or replace function public.guard_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE' and old.role = 'super_admin')
     or (tg_op = 'UPDATE' and old.role = 'super_admin' and new.role <> 'super_admin')
  then
    if (select count(*) from public.profiles where role = 'super_admin') <= 1 then
      raise exception 'There must be at least one super admin.';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists profiles_guard_last_super_admin on public.profiles;
create trigger profiles_guard_last_super_admin
  before update or delete on public.profiles
  for each row execute function public.guard_last_super_admin();

-- ------------------------------------------------- content, tightened
--
-- 0001 allowed any signed-in account to write content, which was right only
-- while every signed-in account was an editor. With sign-up open, it is not.

drop policy if exists "media is writable by signed-in users" on storage.objects;
drop policy if exists "content is writable by signed-in users" on public.content;

drop policy if exists "editors write content" on public.content;
create policy "editors write content"
  on public.content for all
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

drop policy if exists "editors write media" on storage.objects;
create policy "editors write media"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'media' and public.is_editor())
  with check (bucket_id = 'media' and public.is_editor());

drop policy if exists "editors read versions" on public.content_versions;
create policy "editors read versions"
  on public.content_versions for select
  to authenticated
  using (public.is_editor());
