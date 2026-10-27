-- Carry the new quantity column into the assignment and task emails.
--
-- 0025 gave enquiries a quantity of their own. The two notify functions build
-- their payload field by field — which is what keeps them readable — so a new
-- column has to be added to them by hand or it simply never leaves the
-- database. The salesperson would read "Product: Classic Gypsum Plaster" and
-- have to open the panel to find out whether that was three bags or three
-- thousand.
--
-- Everything else about these two is unchanged from 0022.

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
      'quantity',     new.quantity,
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
      'quantity',     lead.quantity,
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
