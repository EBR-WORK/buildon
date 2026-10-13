-- Buildon CMS — email the office when an enquiry arrives.
--
-- The trigger below posts each new row to the `enquiry-email` Edge Function,
-- which sends it on over Gmail SMTP. See supabase/functions/enquiry-email.
--
-- Why a trigger rather than the form posting an email itself: the site is a
-- static export with no server, and a browser cannot speak SMTP — and must
-- never hold the credentials to try. The row is the trigger, which also means
-- the enquiry is stored before any mail is attempted, so a failed send loses a
-- notification and never a lead.
--
-- ---------------------------------------------------------------------------
-- BEFORE RUNNING THIS, replace the two placeholders below:
--
--   <PROJECT_REF>      your project ref, from the Supabase URL
--   <PUBLISHABLE_KEY>  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from .env.local
--   <WEBHOOK_SECRET>   the same value you set as the function's WEBHOOK_SECRET
--
-- Keep the edited copy out of git — the secret is what stops anyone who finds
-- the function URL posting straight into the office's inbox. Running it from
-- the SQL editor is the intended route; nothing needs to be committed.
--
-- The dashboard's Database → Webhooks screen does exactly this and stores the
-- header for you. Either is fine; this is here so the behaviour is written
-- down rather than living only in a UI nobody thinks to look at.
-- ---------------------------------------------------------------------------

-- pg_net makes the HTTP call. It is asynchronous: the insert returns without
-- waiting for the request, so a slow mail server cannot hold up a visitor
-- pressing Send.
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_enquiry()
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
      -- Supabase verifies a JWT on every function call before the function
      -- itself runs, so without this the webhook is refused with 401 and the
      -- function never sees it. The publishable key is enough to pass that
      -- check and is public anyway; it is not what protects this endpoint.
      'Authorization',    'Bearer sb_publishable_qU22AHMaARicjxbK4-_1CQ_DsoBzE1Z',
      -- This is. The function compares it against its own WEBHOOK_SECRET and
      -- refuses anything else, so knowing the URL is not enough to post an
      -- enquiry into the office's inbox.
      'x-webhook-secret', 'hJ37NW5Ylx_Pk6TiESNreQpWdfjlefWM'
    ),
    body    := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

comment on function public.notify_enquiry is
  'Posts a new enquiry to the enquiry-email function. Failures are invisible here by design — see pg_net.';

drop trigger if exists enquiries_notify on public.enquiries;
create trigger enquiries_notify
  after insert on public.enquiries
  for each row execute function public.notify_enquiry();

-- Sent requests and their responses land in net._http_response. That is the
-- only place a failed send shows up, so it is where to look when an enquiry
-- is in the panel and not in the inbox:
--
--   select created, status_code, content
--   from net._http_response
--   order by created desc
--   limit 10;
