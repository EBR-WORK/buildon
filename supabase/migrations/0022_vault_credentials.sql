-- Move the edge function's credentials out of the function bodies and into Vault.
--
-- THE PROBLEM THIS FIXES
--
-- Four triggers call the enquiry-email function, and all four carry the
-- project's publishable key and the function's webhook secret typed into their
-- own source. That has three costs:
--
--   * The values are in git. 0006 and 0007 were committed with them in place,
--     so they are in the history whatever the working tree says now.
--   * They are readable by anyone who can query pg_proc, which is every
--     authenticated role.
--   * Rotating them means editing four call sites in three files, running each
--     one, and getting all of them right in the same sitting. 0021 is proof of
--     how that goes: it shipped with placeholders, was run as written, and the
--     trigger posted the literal text "Bearer SUPABASE_PUBLISHABLE_KEY" for a
--     day before anyone could see why no email arrived.
--
-- After this there is one place to read and one place to change, and this file
-- holds no secret at all — so it can be committed like any other migration.
--
-- BEFORE RUNNING THIS
--
-- The two secrets must exist in Vault, or every notification goes quiet. See
-- the end of this file for the two statements that create them.

create or replace function public.call_edge(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  api_key  text;
  hook_key text;
begin
  select decrypted_secret into api_key
  from vault.decrypted_secrets where name = 'edge_api_key';

  select decrypted_secret into hook_key
  from vault.decrypted_secrets where name = 'edge_webhook_secret';

  /* Loud in the log, quiet everywhere else.

     A missing secret must not fail the INSERT or UPDATE that got us here: the
     enquiry, the application and the assignment are all already stored, and a
     notification is the only thing at stake. Raising would roll back the work
     to protect the telling of it. */
  if api_key is null or hook_key is null then
    raise warning 'call_edge: vault is missing edge_api_key or edge_webhook_secret — nothing sent';
    return;
  end if;

  perform net.http_post(
    /* Not a secret: the URL is in the project's own settings page and the
       function refuses anything without the header above. */
    url     := 'https://shhzbxaqbxgpqhgrhksf.supabase.co/functions/v1/enquiry-email',
    headers := jsonb_build_object(
      'Content-Type',     'application/json',
      -- Supabase verifies a key on every function call before the function
      -- itself runs. Without it the gateway answers 401 and the function never
      -- sees the request.
      'Authorization',    'Bearer ' || api_key,
      -- This is what actually protects the endpoint. The function compares it
      -- against its own WEBHOOK_SECRET and refuses anything else, so knowing
      -- the URL is not enough to post into the office's inbox.
      'x-webhook-secret', hook_key
    ),
    body    := payload
  );
end;
$$;

comment on function public.call_edge(jsonb) is
  'Posts to the enquiry-email function with credentials read from Vault. Triggers only.';

/* Triggers run as the definer, so no caller needs this. Left executable by
   `public` it would let any signed-in browser post whatever it liked to the
   function, using the database''s own credentials — which is a worse hole than
   the one this file closes. */
revoke all on function public.call_edge(jsonb) from public;
revoke all on function public.call_edge(jsonb) from anon;
revoke all on function public.call_edge(jsonb) from authenticated;


-- ------------------------------------------------- the four call sites
--
-- Each keeps the payload it always sent. Only the posting moved.

create or replace function public.notify_enquiry()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.call_edge(jsonb_build_object('record', to_jsonb(new)));
  return new;
end;
$$;

create or replace function public.notify_application()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.call_edge(jsonb_build_object('record', to_jsonb(new)));
  return new;
end;
$$;

create or replace function public.notify_assignment()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  assignee text;
  assigner text;
begin
  select email into assignee from public.profiles where id = new.assigned_to;
  if assignee is null then
    return new;
  end if;

  select email into assigner from public.profiles where id = new.assigned_by;

  perform public.call_edge(jsonb_build_object(
    'kind', 'assignment',
    'to',   assignee,
    'by',   assigner,
    'lead', jsonb_build_object(
      'id',           new.id,
      'name',         new.name,
      'phone',        new.phone,
      'email',        new.email,
      'company',      new.company,
      'product',      new.product,
      'enquiry_type', new.enquiry_type,
      'message',      new.message,
      'source',       new.source,
      'status',       new.status,
      'priority',     new.priority
    )
  ));
  return new;
end;
$$;

create or replace function public.notify_task()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  lead     public.enquiries;
  assignee text;
  author   text;
begin
  select * into lead from public.enquiries where id = new.enquiry_id;
  if lead.id is null or lead.assigned_to is null then
    return new;
  end if;

  if lead.assigned_to = new.created_by then
    return new;
  end if;

  select email into assignee from public.profiles where id = lead.assigned_to;
  if assignee is null then
    return new;
  end if;

  select email into author from public.profiles where id = new.created_by;

  perform public.call_edge(jsonb_build_object(
    'kind',   'task',
    'to',     assignee,
    'by',     author,
    'action', new.action,
    'due_on', new.due_on,
    'lead',   jsonb_build_object(
      'id',           lead.id,
      'name',         lead.name,
      'phone',        lead.phone,
      'email',        lead.email,
      'company',      lead.company,
      'product',      lead.product,
      'enquiry_type', lead.enquiry_type,
      'message',      lead.message,
      'source',       lead.source,
      'status',       lead.status,
      'priority',     lead.priority
    )
  ));
  return new;
end;
$$;


-- ------------------------------------------------------------- the secrets
--
-- Run these BEFORE the above, once, with the real values. They are not in this
-- file on purpose — that is the entire point of it.
--
--   select vault.create_secret('<publishable key>', 'edge_api_key',
--                              'Passes the Edge Function gateway check');
--   select vault.create_secret('<webhook secret>',  'edge_webhook_secret',
--                              'Proves a call to enquiry-email came from us');
--
-- To rotate either one later, without touching any function:
--
--   select vault.update_secret(
--            (select id from vault.secrets where name = 'edge_webhook_secret'),
--            '<new value>');
--
-- Both must then match what the function itself holds:
--
--   npx supabase secrets set WEBHOOK_SECRET=<new value>
--
-- Check what is stored, without printing it:
--
--   select name, created_at, updated_at from vault.secrets order by name;
