-- Once a lead has an owner, only a super admin may change it.
--
-- Marketing hands leads out, which is the whole point of the role. What it may
-- not do is take one back off a salesperson who is already working it, or move
-- it quietly to somebody else — and nor may the salesperson holding it hand it
-- on. Handing out an unassigned lead stays open to anyone who may assign;
-- changing an existing owner does not.
--
-- WHY A TRIGGER AND NOT A POLICY
--
-- Row level security policies are OR'd. "marketing assigns leads" and "sales
-- update own leads" both already permit an UPDATE on this table, so tightening
-- one of them changes nothing while the other still says yes. A BEFORE trigger
-- is the only thing here that can see the OLD row and the NEW one together and
-- refuse the difference between them.

create or replace function public.guard_reassignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Not a change of owner. Status, priority, notes and everything else on the
  -- row are untouched by this.
  if new.assigned_to is not distinct from old.assigned_to then
    return new;
  end if;

  -- Nobody holds it yet, so there is nothing to take away. Marketing assigning
  -- a new enquiry is the ordinary case and stays open.
  if old.assigned_to is null then
    return new;
  end if;

  -- Server-side work: a migration, a script with the service key, or the
  -- assignment trigger itself. There is no signed-in person to check, and
  -- refusing here would break the tools that repair this table.
  if auth.uid() is null then
    return new;
  end if;

  if public.is_super_admin() then
    return new;
  end if;

  /* 42501 is insufficient_privilege, which PostgREST reports as 403 — so the
     panel can tell this apart from a row that simply did not match a policy.
     A filtered update returns no error and no rows; this one says why. */
  raise exception
    'That lead is already assigned. Only a super admin can change who it belongs to.'
    using errcode = '42501';
end;
$$;

comment on function public.guard_reassignment() is
  'Refuses a change of assigned_to on a lead that already has one, unless a super admin asks.';

drop trigger if exists enquiries_guard_reassignment on public.enquiries;
create trigger enquiries_guard_reassignment
  before update of assigned_to on public.enquiries
  for each row execute function public.guard_reassignment();


-- To undo this, drop the trigger and leave the function:
--
--   drop trigger if exists enquiries_guard_reassignment on public.enquiries;
