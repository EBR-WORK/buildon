-- An assigned lead belongs to the person holding it, and to nobody else.
--
-- 0023 stopped anyone but a super admin moving a lead that already has an
-- owner. This goes further: once a lead is assigned, how it is PROGRESSING is
-- the owner's to say and nobody else's. Not marketing, not presales, not a
-- super admin.
--
-- The reasoning is the one the panel is built around: the person who spoke to
-- the customer is the one who knows what happened, so they are the only one
-- whose Contacted, Quoted or Lost means anything.
--
-- WHAT THE LEAD SAYS IS A DIFFERENT QUESTION
--
-- Correcting a misheard phone number or a product picked from the wrong line
-- is not working the lead — it is keeping the record true, and that belongs to
-- marketing and the super admin whoever happens to be selling it. So they may
-- still edit the details of an assigned lead; what they may not do is move its
-- status or priority, because they are not the ones who spoke to the customer.
--
-- WHAT IS STILL OPEN
--
--   * An unassigned lead. Until somebody holds it, this does nothing at all.
--   * The handover itself — changing assigned_to — which 0023 polices on its
--     own, and which is the way out of every corner this file creates.
--   * Notes. enquiry_notes is a different table and is untouched, so presales
--     can still advise on a lead they may not move.
--
-- THE WAY OUT
--
-- A super admin who needs to correct an assigned lead reassigns it first —
-- to themselves, or to whoever should have had it — and then it is theirs to
-- edit. Nothing here is a dead end, but it is two steps on purpose: taking
-- somebody's lead off them should be a thing you did, not a thing you did by
-- accident while tidying a list.

create or replace function public.guard_owned_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Nobody holds it, so there is nothing to protect.
  if old.assigned_to is null then
    return new;
  end if;

  -- Server-side work: a migration, a script with the service key, or a trigger
  -- stamping a column. There is no signed-in person to check.
  if auth.uid() is null then
    return new;
  end if;

  /* A handover. 0023 decides whether this person may do it, and it carries
     status and place with it — so those changes are part of the handover and
     not something to refuse here as well. Checking both would make a legal
     reassignment fail on its own side effects. */
  if new.assigned_to is distinct from old.assigned_to then
    return new;
  end if;

  if auth.uid() = old.assigned_to then
    return new;
  end if;

  /* Marketing and the super admin keep the record true: name, phone, email,
     company, product, enquiry type, the message. What they do not get is the
     two columns that say how the sale is going — those are the owner's
     account of a conversation they were part of and nobody else was. */
  if public.can_assign_leads() then
    if new.status is distinct from old.status
       or new.priority is distinct from old.priority then
      raise exception
        'Status and priority belong to whoever the lead is assigned to.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  raise exception
    'That lead belongs to somebody else. Only they can change it — reassign it first.'
    using errcode = '42501';
end;
$$;

comment on function public.guard_owned_lead() is
  'Keeps an assigned lead''s status and priority with its owner. Marketing may still correct its details.';

drop trigger if exists enquiries_guard_owned on public.enquiries;
create trigger enquiries_guard_owned
  before update on public.enquiries
  for each row execute function public.guard_owned_lead();


-- To undo this, drop the trigger and leave the function:
--
--   drop trigger if exists enquiries_guard_owned on public.enquiries;
