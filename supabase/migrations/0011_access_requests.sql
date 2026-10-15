-- Buildon CMS — asking for an account.
--
-- Replaces pre-authorising. Pre-authorising was the super admin guessing: they
-- wrote an address into a list and hoped the person turned up and signed
-- themselves up. It also depended on a sign-up route that does not exist on
-- the login screen, so the list could never be consumed.
--
-- This turns it around. Somebody who needs access asks from the login screen,
-- says which team they are on, and a super admin approves or declines. Nobody
-- is guessed at, nothing waits on a sign-up that may never happen, and the
-- super admin decides the role at the moment they decide the person.

create table if not exists public.access_requests (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),

  email        text not null,
  name         text not null,
  -- What they asked to be. A request, not a grant: the super admin chooses the
  -- real role on approval, which is why nothing here is ever read as one.
  requested_role text not null,
  note         text,

  status       text not null default 'pending',
  decided_at   timestamptz,
  decided_by   uuid references auth.users (id) on delete set null
);

alter table public.access_requests drop constraint if exists access_requests_status_check;
alter table public.access_requests add constraint access_requests_status_check
  check (status in ('pending', 'approved', 'declined'));

-- One open request per address. Asking twice is somebody being unsure whether
-- the first one worked, not two requests to answer.
create unique index if not exists access_requests_one_pending
  on public.access_requests (lower(email))
  where status = 'pending';

comment on table public.access_requests is
  'Requests for a panel account, from the login screen. Approved by a super admin.';

alter table public.access_requests enable row level security;

-- Anyone may ask. That is what the form is, and there is no server in front of
-- it to do the asking instead. The caps are what stop a loop filling the
-- table; a policy cannot tell a person from a script.
drop policy if exists "anyone may ask for access" on public.access_requests;
create policy "anyone may ask for access"
  on public.access_requests for insert
  to anon, authenticated
  with check (
    length(email) between 5 and 200
    and length(name) between 2 and 120
    and length(requested_role) between 2 and 40
    and (note is null or length(note) <= 500)
    -- A request may not arrive already approved.
    and status = 'pending'
    and decided_at is null
    and decided_by is null
  );

-- Nobody reads them back but a super admin. Without this the publishable key
-- would hand every request — names and addresses — to anyone who asks.
drop policy if exists "super admins read access requests" on public.access_requests;
create policy "super admins read access requests"
  on public.access_requests for select
  to authenticated
  using (public.is_super_admin());

drop policy if exists "super admins decide access requests" on public.access_requests;
create policy "super admins decide access requests"
  on public.access_requests for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Stamp who decided, rather than trusting the browser to say.
create or replace function public.access_request_decide()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status <> 'pending' then
    new.decided_at := now();
    new.decided_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists access_requests_decide on public.access_requests;
create trigger access_requests_decide
  before update on public.access_requests
  for each row execute function public.access_request_decide();

-- ------------------------------------------------------------- the invites
--
-- admin_invites is left in place and unused. Dropping a table that may hold a
-- row somebody is still waiting on is not something a migration should decide;
-- the one row in it is for an address with a typo in the domain, which is its
-- own argument for why guessing addresses was the wrong shape.
comment on table public.admin_invites is
  'SUPERSEDED by access_requests. Kept so nothing that still reads it breaks.';
