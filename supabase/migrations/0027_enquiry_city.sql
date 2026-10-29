-- Where the enquiry was sent from.
--
-- Not where the SITE is. That is a different question and the chat assistant
-- already asks it in words — "Where is the site? The city is enough." This is
-- the city the browser appears to be in, worked out from the IP address, and
-- it is useful for a different reason: it arrives on every enquiry including
-- the ones where nobody typed anything, and it is the first clue about which
-- branch should pick a lead up.
--
-- HOW GOOD IT IS
--
-- Good enough to route, not good enough to quote. An IP address resolves to
-- wherever the visitor's internet provider terminates the connection, which on
-- a mobile network can be a different city entirely and on a corporate VPN can
-- be a different country. It is a hint, so it is stored beside the lead rather
-- than used to decide anything on its own.
--
-- Nullable and always will be: the lookup is a third-party request that can be
-- blocked, refused or simply slow, and an enquiry must never wait on it.

alter table public.enquiries
  add column if not exists city text,
  add column if not exists country text;

comment on column public.enquiries.city is
  'City the browser appeared to be in, from its IP. A hint for routing, not a fact about the site.';

comment on column public.enquiries.country is
  'Country for the same lookup. Mostly IN; worth having when it is not.';


-- The insert policy is the real limit on what the website may write, so the
-- two new columns need their own caps there. Recreated rather than altered: a
-- policy cannot be amended in place, and leaving the old one would mean two
-- policies OR'd together with the laxer one winning.

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
    and (quantity is null or quantity between 1 and 100000)
    -- A city name, not a paragraph. These come from a service the browser
    -- calls, so they are as trustworthy as anything else a browser sends:
    -- bounded here rather than believed.
    and (city is null or length(city) <= 120)
    and (country is null or length(country) <= 80)
    -- An insert may not arrive pre-marked as dealt with.
    and handled = false
    and handled_at is null
    and handled_by is null
    and note is null
  );
