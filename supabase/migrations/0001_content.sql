-- Buildon CMS — the content store.
--
-- One row per editable section, with the section's content as jsonb. The admin
-- saves a whole section at a time (SiteContent in src/lib/cms/schema.ts), so a
-- row matches a save exactly: one write, no partial state, nothing to
-- reconcile between tables.
--
-- Why jsonb rather than a table per section: the shapes are deep and keep
-- changing — a paragraph is RichRun[], each run carrying its own bold flag and
-- optional href, and a post's body is a list of five different block kinds.
-- Modelling that relationally means six tables and a join per paragraph, for
-- content that is only ever read whole. The trade is that Postgres will not
-- enforce the shape; src/lib/cms/published.ts validates on read instead, and
-- falls back to what the repo ships rather than rendering a hole.

create table if not exists public.content (
  key        text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.content is
  'One row per editable section: home, products, projects, blog, faq, career.';

-- Every write keeps the version it replaced, so a bad edit is one insert away
-- from being undone. Cheap at this scale: six rows changed by hand, rarely.
create table if not exists public.content_versions (
  id         bigint generated always as identity primary key,
  key        text not null,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists content_versions_key_created_at_idx
  on public.content_versions (key, created_at desc);

-- The trigger writes history, and stamps updated_at/updated_by on the server.
-- Doing it here rather than in the client means a row cannot claim it was
-- saved by someone it was not, or at a time it was not.
create or replace function public.content_record_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    insert into public.content_versions (key, data, created_by)
    values (old.key, old.data, old.updated_by);
  end if;

  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists content_version_trigger on public.content;
create trigger content_version_trigger
  before insert or update on public.content
  for each row execute function public.content_record_version();

-- ---------------------------------------------------------------- security
--
-- The publishable key ships in the browser bundle, so these policies are the
-- only thing standing between the site's content and anyone who views source.
-- Read is open because the site itself reads with that key; writing requires a
-- signed-in user.

alter table public.content enable row level security;
alter table public.content_versions enable row level security;

drop policy if exists "content is readable by anyone" on public.content;
create policy "content is readable by anyone"
  on public.content for select
  using (true);

drop policy if exists "content is writable by signed-in users" on public.content;
create policy "content is writable by signed-in users"
  on public.content for all
  to authenticated
  using (true)
  with check (true);

-- History is for editors, not for visitors: it would otherwise expose drafts
-- and wording that was deliberately replaced.
drop policy if exists "versions are readable by signed-in users" on public.content_versions;
create policy "versions are readable by signed-in users"
  on public.content_versions for select
  to authenticated
  using (true);

-- No insert policy: rows arrive only through the trigger, which is
-- security definer and so bypasses RLS. Nothing should write here directly.

-- ----------------------------------------------------------------- storage
--
-- Uploaded images and videos. Public read because the site serves them to
-- anyone; writes restricted to signed-in users.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media is readable by anyone" on storage.objects;
create policy "media is readable by anyone"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "media is writable by signed-in users" on storage.objects;
create policy "media is writable by signed-in users"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');
