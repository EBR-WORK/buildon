-- Buildon CMS — the translation cache.
--
-- Editors only ever write English. Every other language is produced from it at
-- build time and kept here, keyed by a hash of the English string. That hash
-- is the whole mechanism:
--
--   change one headline  ->  one hash changes  ->  one string is re-translated
--   change nothing       ->  every hash matches -> nothing is sent anywhere
--
-- So a deploy costs the sentences that changed, and the other sixty-nine
-- thousand words are free forever. It also means a provider can be swapped
-- without reprocessing anything: the key is the English text, not who
-- translated it.
--
-- `reviewed` is the other half. A machine translation someone has corrected is
-- never overwritten by the machine again, which is what makes "fix the twenty
-- strings that matter and leave the rest" a workable position.

create table if not exists public.translations (
  -- sha256 of the source text, hex. Not the text itself as the key: a primary
  -- key has to be indexable, and some of these strings are whole paragraphs.
  source_hash text not null,
  locale      text not null,

  -- Kept for the review screen, which has to show what was translated, and so
  -- a stale row can be recognised rather than merely missed.
  source      text not null,
  translated  text not null,

  -- A human corrected it. Protected from the machine from then on.
  reviewed    boolean not null default false,
  reviewed_by uuid references auth.users (id) on delete set null,

  -- Which model produced it, so a bad batch can be found and re-run.
  provider    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  primary key (source_hash, locale)
);

comment on table public.translations is
  'English string -> translation, keyed by hash. Written by the build, corrected by editors.';

-- The review screen lists what has not been checked yet.
create index if not exists translations_unreviewed_idx
  on public.translations (locale, reviewed, updated_at desc);

alter table public.translations enable row level security;

-- Public read, like `content`. These strings are the website; they are about
-- to be rendered into pages anyone can view, so there is nothing to protect —
-- and the build reads them with the publishable key, so it needs no privileged
-- credential to produce a deploy.
drop policy if exists "translations are readable by anyone" on public.translations;
create policy "translations are readable by anyone"
  on public.translations for select
  using (true);

-- Writing is an editor's. The build writes with the secret key, which bypasses
-- this; the panel writes as whoever is signed in.
drop policy if exists "editors write translations" on public.translations;
create policy "editors write translations"
  on public.translations for all
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Stamp the reviewer rather than trusting the browser to send one, and keep
-- `reviewed_by` honest: clearing the flag clears who set it.
create or replace function public.translation_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();

  if tg_op = 'UPDATE' and new.reviewed is distinct from old.reviewed then
    new.reviewed_by := case when new.reviewed then auth.uid() else null end;
  elsif tg_op = 'INSERT' and new.reviewed then
    new.reviewed_by := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists translations_stamp on public.translations;
create trigger translations_stamp
  before insert or update on public.translations
  for each row execute function public.translation_stamp();
