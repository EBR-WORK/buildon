# Enquiry email

Sends each new row in `public.enquiries` to the office over Gmail SMTP.

```
visitor submits  →  row in enquiries  →  trigger  →  this function  →  Gmail
```

The row is written first and the mail is sent after, so a mail failure loses a
notification, never a lead. Every enquiry is in `/admin/enquiries` whether this
is working or not.

## Setup, once

**1. Deploy the function**

```bash
npx supabase login
npx supabase functions deploy enquiry-email --project-ref shhzbxaqbxgpqhgrhksf
```

**2. Give it its secrets**

```bash
npx supabase secrets set \
  GMAIL_USER=ebrproject000@gmail.com \
  GMAIL_APP_PASSWORD="<the 16-character app password>" \
  MAIL_TO=Marketing@buildon.co.in \
  WEBHOOK_SECRET=<a long random string> \
  --project-ref shhzbxaqbxgpqhgrhksf
```

These live in Supabase, never in the repository and never in the browser
bundle. `GMAIL_APP_PASSWORD` is the same app password the project already uses
for auth email — it is not the account password.

**3. Point the database at it**

Open `supabase/migrations/0006_enquiry_notify.sql`, replace `<PROJECT_REF>` and
`<WEBHOOK_SECRET>` with the values above, and run it in the SQL editor. Do not
commit the edited copy.

The dashboard's **Database → Webhooks** screen does the same thing through a
form, if that is easier. Same URL, same header.

## Checking it

Send a test enquiry from the site, then:

```sql
select created, status_code, content
from net._http_response
order by created desc
limit 5;
```

- `200` — sent.
- `401` — the header and the function's `WEBHOOK_SECRET` disagree.
- `500` — SMTP refused. `npx supabase functions logs enquiry-email` has the reason;
  the usual one is an app password that has been revoked.
- nothing at all — the trigger did not fire. Check it exists on `enquiries`.

## Notes

- **Reply-To is the enquirer**, so answering from Gmail replies to them rather
  than to the sending mailbox.
- Gmail allows ~500 messages a day (2,000 on Workspace), which is far above
  anything this will send.
- Sending from `@gmail.com` to a `@buildon.co.in` inbox is fine, but the first
  few may land in spam until the address has some history. Marking one as
  "not spam" settles it.
- If the sending address ever moves to Google Workspace on `buildon.co.in`,
  only `GMAIL_USER` and `GMAIL_APP_PASSWORD` change. Nothing else here does.
