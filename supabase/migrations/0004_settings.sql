-- Buildon CMS — settings only an editor may see.
--
-- One row so far: the Netlify build hook, the URL that starts a deploy.
--
-- Why not an environment variable. The admin panel is a browser app, so a
-- value it uses has to reach the browser, and the only variables Next puts
-- there are the NEXT_PUBLIC_ ones — which are inlined into the bundle and
-- readable by every visitor. A build hook in there is a button anyone can
-- press, as many times as they like, against your build minutes.
--
-- Here it is fetched at the moment it is used, by someone who has signed in,
-- and the policy below is what decides whether they get it. The publishable
-- key alone returns nothing.
--
-- This is not the place for anything that would be damaging rather than
-- annoying in the wrong hands: an editor's session can read every row, and a
-- browser is not a vault. A build hook is the right size of secret for it —
-- the worst case is a wasted deploy.

create table if not exists public.settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.settings is
  'Admin-only configuration. Readable by editors, writable by super admins.';

alter table public.settings enable row level security;

-- No anon policy at all, which is the point: the publishable key in every
-- visitor's bundle gets nothing from this table.
drop policy if exists "editors read settings" on public.settings;
create policy "editors read settings"
  on public.settings for select
  to authenticated
  using (public.is_editor());

-- Writing is a super admin's. Changing where Publish points is changing what
-- the button does for everyone.
drop policy if exists "super admins write settings" on public.settings;
create policy "super admins write settings"
  on public.settings for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Stamp the author rather than trusting the browser to send one.
create or replace function public.settings_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists settings_stamp on public.settings;
create trigger settings_stamp
  before insert or update on public.settings
  for each row execute function public.settings_stamp();
