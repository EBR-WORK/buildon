-- Tell a salesperson, by email, that a lead is now theirs.
--
-- The bell in the panel already says so, and it is the better place: it is
-- beside the work, it clears when read, and it cannot go to spam. But it only
-- speaks to somebody who is already looking at the panel. Sales are out, on a
-- phone, and the lead they were handed an hour ago is worth knowing about
-- before they next sign in.
--
-- WHY A TRIGGER AND NOT THE BROWSER
--
-- The assignment is an UPDATE from the admin panel. Sending the mail there
-- would mean a tab that must stay open until the request finishes, a second
-- place holding the SMTP credentials, and no mail at all when a lead is
-- assigned by any other means. The row changing is the fact; everything else
-- follows from it.
--
-- WHAT IT DOES NOT DO
--
-- It does not fire when a lead is unassigned, when the assignment does not
-- change, or when somebody assigns a lead to themselves. The first two are not
-- news. The third is: telling you what you just did, by email, is how people
-- learn to filter a sender.
--
-- BEFORE RUNNING THIS
--
-- Replace the two placeholders below exactly as in 0006_enquiry_notify.sql and
-- 0007_applications.sql, and keep the edited copy out of git. They are the
-- project's publishable key and the function's webhook secret.

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
  -- The address of the person it was handed to. A profile with no row here
  -- means an account that no longer exists; the panel still shows the bell.
  select email into assignee from public.profiles where id = new.assigned_to;
  if assignee is null then
    return new;
  end if;

  -- Stamped by the assignment trigger in 0012, never by the browser.
  select email into assigner from public.profiles where id = new.assigned_by;

  perform net.http_post(
    url     := 'https://shhzbxaqbxgpqhgrhksf.supabase.co/functions/v1/enquiry-email',
    headers := jsonb_build_object(
      'Content-Type',     'application/json',
      'Authorization',    'Bearer SUPABASE_PUBLISHABLE_KEY',
      'x-webhook-secret', 'WEBHOOK_SECRET'
    ),
    body    := jsonb_build_object(
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
    )
  );
  return new;
end;
$$;

drop trigger if exists enquiries_notify_assignment on public.enquiries;
create trigger enquiries_notify_assignment
  after update on public.enquiries
  for each row
  when (
    new.assigned_to is not null
    and new.assigned_to is distinct from old.assigned_to
    -- Nobody needs an email about something they did themselves.
    and new.assigned_to is distinct from new.assigned_by
  )
  execute function public.notify_assignment();


-- ------------------------------------------------------------------ tasks
--
-- A qualification task is written by presales and ticked off by whoever owns
-- the lead — so the person who has to act on it is not the person who wrote
-- it, and nothing told them it existed.

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

  -- Presales adding a task to their own lead does not need telling.
  if lead.assigned_to = new.created_by then
    return new;
  end if;

  select email into assignee from public.profiles where id = lead.assigned_to;
  if assignee is null then
    return new;
  end if;

  select email into author from public.profiles where id = new.created_by;

  perform net.http_post(
    url     := 'https://shhzbxaqbxgpqhgrhksf.supabase.co/functions/v1/enquiry-email',
    headers := jsonb_build_object(
      'Content-Type',     'application/json',
      'Authorization',    'Bearer SUPABASE_PUBLISHABLE_KEY',
      'x-webhook-secret', 'WEBHOOK_SECRET'
    ),
    body    := jsonb_build_object(
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
    )
  );
  return new;
end;
$$;

drop trigger if exists lead_tasks_notify on public.lead_tasks;
create trigger lead_tasks_notify
  after insert on public.lead_tasks
  for each row execute function public.notify_task();


-- A failed post is a lost email and never a lost lead: net.http_post queues
-- the request and returns immediately, so nothing here can fail the UPDATE
-- that assigned the lead. Check what was sent with:
--
--   select created, url, status_code
--   from net._http_response
--   order by created desc
--   limit 20;
