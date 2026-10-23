-- Buildon CRM — staff can see who their colleagues are.
--
-- THE BUG THIS FIXES
--
-- profiles could be read by two people: you, and a super admin. Everything
-- else in the panel that needs to name a person was therefore broken for
-- everyone else, quietly, by returning one row instead of several:
--
--   listStaff()   the assign dropdown. Marketing may assign leads but is not
--                 a super admin, so the list of salespeople to assign TO came
--                 back holding only themselves. The screen looked finished.
--
--   the Assigned column, the presales tracker, and anything that turns an id
--   into a name — all of which fall back to showing nothing, or an id.
--
-- A filtered SELECT is not an error. It returns fewer rows and says nothing,
-- which is the same shape of mistake as 0010 and 0015: the policy was doing
-- exactly what it said, and what it said was too narrow.
--
-- WHAT IS AND IS NOT EXPOSED
--
-- A colleague's email and role, to people who already work alongside them and
-- already see those emails in the Assigned column of the leads table. Not a
-- password, not a session, not anything that grants access — a role is read
-- here and written only by a super admin, which the UPDATE policy still says.
--
-- This is a staff directory, and a CRM without one cannot say who did what.

create policy "staff read the directory"
  on public.profiles for select
  to authenticated
  using (public.is_staff());

-- The existing "readable by self and super admins" policy stays. RLS policies
-- are OR'd, so this widens SELECT and nothing else: UPDATE and DELETE remain
-- super-admin only, which is what keeps a role something granted rather than
-- claimed.
