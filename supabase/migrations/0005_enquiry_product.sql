-- Buildon CMS — which product the enquiry is about.
--
-- The quote dialog now asks, because "I need plaster" and "I need Bondit-151"
-- are different enquiries and the office was reading the message to find out.
--
-- Nullable, and no backfill: the rows already in the table were taken by a
-- form that never asked, and guessing an answer for them would be worse than
-- an empty column.

alter table public.enquiries
  add column if not exists product text;

comment on column public.enquiries.product is
  'Which product the enquiry names. Null for enquiries taken before the field existed, and for forms that do not ask.';

-- The insert policy lists every column it will accept, so a new one has to be
-- added to it or the value arrives and is thrown away. Recreated whole rather
-- than altered: a policy cannot be amended in place, and a half-stated one is
-- worse than none.
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
    -- An insert may not arrive pre-marked as dealt with.
    and handled = false
    and handled_at is null
    and handled_by is null
    and note is null
  );
