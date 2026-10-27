-- How much they need, as a column rather than a line inside the message.
--
-- The website form asks for a quantity once a product is chosen, and that
-- answer was folded into the message text: "Quantity: 3 bags", a blank line,
-- then whatever they wrote. It avoided this migration and it was the wrong
-- call. The admin panel's edit form then showed the quantity sitting inside
-- the message box, where correcting it means editing somebody's own words, and
-- nothing could sort or total by it.
--
-- A number, not text. Bags are counted. "a few" and "around 500" are answers
-- the form no longer lets anyone give, and the column should not invite them
-- back in.

alter table public.enquiries
  add column if not exists quantity integer;

comment on column public.enquiries.quantity is
  'Bags asked for. Null means not asked or not answered — both are ordinary.';


-- ---------------------------------------------------------------- backfill
--
-- Every enquiry taken since the field was added carries its quantity in the
-- first line of the message, in a shape this code wrote itself. Moving it is
-- what makes the old rows look like the new ones.
--
-- Only the exact pattern is touched: "Quantity: <digits> bags" as the FIRST
-- line, followed by a blank line. Anything a visitor typed that happens to
-- mention a quantity is left exactly as they wrote it.

update public.enquiries
set quantity = (substring(message from '^Quantity: ([0-9]+) bags'))::integer,
    message  = regexp_replace(message, '^Quantity: [0-9]+ bags\r?\n\r?\n', '')
where quantity is null
  and message ~ '^Quantity: [0-9]+ bags\r?\n';


-- ------------------------------------------------------------------ bounds
--
-- The insert policy is the real limit on what the website may write, so the
-- new column needs its own cap there. Recreated rather than altered: a policy
-- cannot be amended in place, and leaving the old one would mean two policies
-- OR'd together, with the laxer one winning.

drop policy if exists "anyone may leave an enquiry" on public.enquiries;
create policy "anyone may leave an enquiry"
  on public.enquiries for insert
  to anon, authenticated
  with check (
    -- Length caps, so a loop cannot fill the table a megabyte at a time.
    length(name) between 2 and 120
    and length(email) between 5 and 200
    and length(phone) between 6 and 40
    and length(message) between 10 and 5000
    and (company is null or length(company) <= 200)
    and (enquiry_type is null or length(enquiry_type) <= 100)
    and (product is null or length(product) <= 120)
    and (source is null or length(source) <= 60)
    and (page is null or length(page) <= 300)
    -- One bag to a hundred thousand. Above that it is a typo or a joke, and
    -- either way it is not an order this company takes through a web form.
    and (quantity is null or quantity between 1 and 100000)
    -- An insert may not arrive pre-marked as dealt with.
    and handled = false
    and handled_at is null
    and handled_by is null
    and note is null
  );
