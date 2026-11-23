-- Let a visitor say which branch they want, and let the form ask.
--
-- Two changes, both small, both needed by the same field on the enquiry form.
--
--
-- 1. THE BRANCH LIST BECOMES PUBLIC
--
-- places has been staff-read since 0009, which is right for a table the leads
-- screen groups by. But the enquiry form now asks "Your Branch", and a form
-- cannot offer a list it may not read: with the publishable key the select
-- returned 200 and an empty array, which is RLS working exactly as written and
-- a dropdown with nothing in it.
--
-- Only ACTIVE branches, and only to read. A branch name is the name of an
-- office that answers the phone — it is on the contact page and on a
-- letterhead, so there is nothing here that was not already public. A branch
-- switched off stays invisible, which is what switching it off is for.
--
-- Everything else about the table is unchanged: writing is still super admins
-- only, and nothing else in the row is exposed, because name and active are
-- all the columns there are.

drop policy if exists "anyone reads active places" on public.places;
create policy "anyone reads active places"
  on public.places for select
  to anon, authenticated
  using (active);

comment on policy "anyone reads active places" on public.places is
  'The enquiry form offers these as "Your Branch". Active only; a disabled branch is hidden from the public the same way it is hidden from the dropdown in the admin panel.';


-- 2. QUANTITY IS NOW TONS
--
-- It was bags from 0025 until today. The form asked "How Many Bags Do You
-- Need" and the notification emails said "N bags".
--
-- The column does not change — it is still a plain positive number — so the
-- rows written before today still hold bags and nothing in them says so. That
-- is why this comment exists and why it carries the date: a lead from October
-- reading "quantity 500" is five hundred bags, and one from today reading
-- "quantity 20" is twenty tons. Converting the old rows was the alternative
-- and it was not taken, because a conversion that is wrong about even one row
-- is worse than a boundary written down.

comment on column public.enquiries.quantity is
  'How much the enquiry is for. TONS from 2026-11-23 onward; rows created before that date are in BAGS, and were left as written rather than converted. Null when the visitor did not say.';
