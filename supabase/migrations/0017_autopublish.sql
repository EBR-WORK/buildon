-- Buildon CMS — the site publishes itself when the content changes.
--
-- WHY THERE IS NO LONGER A BUTTON
--
-- The site is a static export, so a save and a publish were two different
-- things and the panel carried a Publish button to bridge them. That button
-- was a question put to every editor — "is this the moment?" — and it appeared
-- for roles that cannot edit anything at all. People pressed it to find out
-- what it did.
--
-- So the bridge moves here. An edit to the content asks for a rebuild, and the
-- rebuild happens a few minutes later without anybody deciding.
--
-- WHAT STOPS IT BUILDING ALL DAY
--
-- An editor working through a page saves repeatedly, and each save is a row
-- update. Without a cooldown that is a build per save: Netlify's free tier
-- gives 300 build minutes a month and a build here takes about three, so a
-- busy afternoon would exhaust the month.
--
-- The cooldown is a timestamp in `settings`. A request inside the window does
-- nothing, because a build already on its way will pick up whatever has been
-- saved since — the build reads the content at the moment it runs, not at the
-- moment it was asked for. Ten minutes is the compromise: slow enough to
-- batch an editing session, fast enough that an editor who wants to see their
-- change does not go and do something else first.
--
-- WHAT THIS DOES NOT DO
--
-- It does not decide whether work is ready. Anything an editor does not want
-- public yet is marked not-live on the item itself, which is the control that
-- already exists and the one that belongs to the content rather than to the
-- clock.

-- -------------------------------------------------------------- the cooldown

insert into public.settings (key, value)
values ('autopublish_cooldown_minutes', '10')
on conflict (key) do nothing;

insert into public.settings (key, value)
values ('autopublish_last_request', '1970-01-01T00:00:00Z')
on conflict (key) do nothing;

-- ----------------------------------------------------------------- the ask

create or replace function public.request_publish()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, extensions
as $$
declare
  hook text;
  last_at timestamptz;
  cooldown integer;
begin
  -- No hook means nobody has connected a host yet. Nothing to call, and not
  -- an error: the panel works perfectly well without one.
  select value into hook from public.settings where key = 'netlify_build_hook';
  if hook is null or hook = '' then
    return null;
  end if;

  select coalesce(value::timestamptz, '1970-01-01Z')
    into last_at from public.settings where key = 'autopublish_last_request';

  select coalesce(value::integer, 10)
    into cooldown from public.settings where key = 'autopublish_cooldown_minutes';

  if now() < last_at + make_interval(mins => cooldown) then
    -- Already asked recently. The build that is coming reads the content when
    -- it runs, so this save is included in it regardless.
    return null;
  end if;

  update public.settings
    set value = to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    where key = 'autopublish_last_request';

  -- Asynchronous, like the enquiry notification: the editor's save must not
  -- wait on an HTTP call to a third party, and must not fail because of one.
  perform net.http_post(
    url := hook,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('trigger', 'content-changed')
  );

  return null;
end;
$$;

comment on function public.request_publish() is
  'Asks the host to rebuild, at most once per cooldown. Failures are invisible by design — see pg_net.';

-- --------------------------------------------------------------- the trigger

drop trigger if exists content_autopublish on public.content;

create trigger content_autopublish
  after insert or update on public.content
  for each statement
  execute function public.request_publish();

-- `for each statement`, not `for each row`: saving a page is one statement
-- whether it touches one row or several, and the rebuild is the same either
-- way.

-- ------------------------------------------------------------------- to tune
--
--   update public.settings set value = '20'
--   where key = 'autopublish_cooldown_minutes';
--
-- To turn it off entirely, clear the hook — the Publish setting on the Team
-- screen — and nothing is called.
--
-- To see when the last request went:
--
--   select value from public.settings where key = 'autopublish_last_request';
