/**
 * Email an enquiry to the office, the moment its row is written.
 *
 * Called by a database webhook on insert into public.enquiries — so the
 * trigger is the row, not the form. That matters: the enquiry is already
 * stored before this runs, so a mail failure loses a notification, never a
 * lead. The row is still in the panel either way.
 *
 * Why this exists rather than Netlify Forms: Netlify Forms only works while
 * the site is on Netlify. This works wherever the site is hosted, because the
 * database is doing the sending, and the database does not move.
 *
 * Gmail, over SMTP, with an app password. Not the Gmail API — that needs
 * OAuth, and an app password cannot use it. The credentials are function
 * secrets; nothing here reaches a browser.
 *
 * Deploy:
 *   npx supabase login
 *   npx supabase functions deploy enquiry-email --project-ref <ref>
 *   npx supabase secrets set GMAIL_USER=… GMAIL_APP_PASSWORD=… MAIL_TO=… WEBHOOK_SECRET=…
 */

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

type Application = {
  id: number;
  created_at: string;
  job: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  qualification: string | null;
  experience: string | null;
  ctc: string | null;
  preference: string | null;
  cv_path: string | null;
  cv_name: string | null;
};

type Enquiry = {
  id: number;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  company: string | null;
  enquiry_type: string | null;
  product: string | null;
  source: string | null;
  page: string | null;
};

const env = (key: string) => Deno.env.get(key) ?? "";

/**
 * How long the CV link in the email keeps working.
 *
 * A signed URL is a credential in a sentence — anyone holding the email can
 * open the file, no sign-in. Thirty days is long enough to cover a hiring
 * round and short enough that an old forwarded email stops being a way in.
 * The admin panel can always make a fresh one.
 */
const CV_LINK_DAYS = 30;

/** Addresses and names go into an email; both can contain anything typed. */
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Fetch the CV so it can ride along with the email.
 *
 * An attachment rather than a link, which is what this did first. A link meant
 * whoever opened the email had to be online, had to still be within the
 * expiry, and could not forward the application to a colleague without
 * forwarding a credential. HR wants the CV in the message.
 *
 * Read with the service key, because the bucket is private and has no public
 * URL by design — which is the whole reason the file is safe sitting there.
 * Through the client rather than a raw fetch to the sign endpoint: that
 * endpoint wants a JWT and refuses the newer `sb_secret_…` key outright, with
 * "Invalid Compact JWS", which is exactly how this failed silently before.
 */
async function signCv(path: string) {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;

  try {
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await admin.storage
      .from("applications")
      .createSignedUrl(path, CV_LINK_DAYS * 24 * 60 * 60);
    return data?.signedUrl ?? null;
  } catch {
    /* No link is a worse email, never a lost application: the row is stored
       and the CV is in the panel either way. */
    return null;
  }
}

/**
 * ASCII only, and nothing else.
 *
 * An em-dash or a middot would otherwise have to be encoded, and a client that
 * shows the part without decoding it prints `=e2=80=94` where the dash should
 * be. Pure ASCII can be declared 7bit and sent exactly as written.
 */
const toAscii = (value: string) =>
  value
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u00b7/g, "|")
    .replace(/\u2026/g, "...")
    /* Anything still outside printable ASCII is dropped rather than encoded: a
       name in another script is worth less than an unreadable message, and it
       survives in the panel either way. */
    .replace(/[^\x20-\x7e\n]/g, "");

/**
 * Break a long single-line string into SMTP-safe lines.
 *
 * SMTP refuses a line over 1000 octets, and our HTML is one unbroken string.
 * Breaking after a tag is always safe — whitespace between elements is not
 * content — so the markup is split there and nowhere else.
 */
function wrap(html: string, limit = 500) {
  const out: string[] = [];
  let line = "";
  for (const piece of html.split(/(?<=>)/)) {
    if (line.length + piece.length > limit && line) {
      out.push(line);
      line = "";
    }
    line += piece;
  }
  if (line) out.push(line);
  return out.join("\r\n");
}

/** The table of fields, the body under it, and the line at the foot. */
function render(
  lines: [string, string | null][],
  body: string,
  footer: string,
  /* Put on a line of its own rather than inside a field, so no client wraps a
     several-hundred-character signed URL in the middle. */
  linkLine?: string,
) {
  const text = toAscii(
    [
      /* Tags stripped: the CV row holds an anchor for the HTML the admin panel
         shows, and this part must read as words rather than markup. */
      ...lines
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${String(v).replace(/<[^>]*>/g, "")}`),
      ...(linkLine ? ["", linkLine] : []),
      "",
      body,
      "",
      "--",
      footer,
    ].join("\n"),
  );

  const rows = lines
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#7d7d7d;white-space:nowrap">${k}</td>` +
        `<td style="padding:4px 0;color:#16181d">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");

  const html =
    `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#16181d">` +
    `<table style="border-collapse:collapse">${rows}</table>` +
    (body
      ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #dddfe3;white-space:pre-line">${escapeHtml(body)}</p>`
      : "") +
    `<p style="margin:24px 0 0;font-size:13px;color:#7d7d7d">${footer}</p></div>`;

  /* 7bit ASCII, both parts — see the send call for why. */
  return { text, html: wrap(toAscii(html)) };
}

async function composeApplication(row: Application) {
  const link = row.cv_path ? await signCv(row.cv_path) : null;
  const name = row.cv_name ?? "CV";

  const lines: [string, string | null][] = [
    ["Position", row.job],
    ["Name", `${row.first_name} ${row.last_name}`],
    ["Phone", row.phone],
    ["Email", row.email],
    ["Qualification", row.qualification],
    ["Experience", row.experience],
    ["Current CTC", row.ctc],
    ["Prefers", row.preference],
    ["CV", row.cv_path ? name : "none sent"],
  ];

  return {
    subject: `Application: ${row.job} - ${row.first_name} ${row.last_name}`,
    ...render(
      lines,
      "",
      link
        ? `Sent by the website. The link works for ${CV_LINK_DAYS} days; after that, open the CV in the admin panel.`
        : "Sent by the website. Reply to this email to answer them directly.",
      link ? `Open the CV: ${link}` : undefined,
    ),
  };
}

function composeEnquiry(row: Enquiry) {
  const lines: [string, string | null][] = [
    ["Name", row.name],
    ["Phone", row.phone],
    ["Email", row.email],
    ["Company", row.company],
    ["Enquiry type", row.enquiry_type],
    ["Product", row.product],
    ["Came from", [row.source, row.page].filter(Boolean).join(" · ") || null],
  ];

  return {
    subject: `Enquiry from ${row.name}${row.product ? ` — ${row.product}` : ""}`,
    ...render(
      lines,
      row.message,
      "Sent by the website. Reply to this email to answer them directly.",
    ),
  };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  /* The function is on a public URL, so without this anyone who found it could
     post a fake enquiry straight into the office's inbox. The webhook sends
     this header; nothing else knows it. */
  const secret = env("WEBHOOK_SECRET");
  if (!secret || request.headers.get("x-webhook-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  /* One function, two tables. The shape says which: an application carries a
     job and a first name, an enquiry a message. Two functions would mean two
     deploys, two sets of SMTP credentials and two places for one bug. */
  let record: Enquiry | Application;
  try {
    const body = await request.json();
    record = body.record ?? body;
    if (!record?.email) throw new Error("not a submission");
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const isApplication = "job" in record && "first_name" in record;
  if (!isApplication && !(record as Enquiry).message) {
    return new Response("Bad request", { status: 400 });
  }

  let composed;
  try {
    composed = isApplication
      ? await composeApplication(record as Application)
      : composeEnquiry(record as Enquiry);
  } catch (error) {
    console.error("compose failed", error);
    return new Response(`Compose failed: ${error}`, { status: 500 });
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: env("GMAIL_USER"), password: env("GMAIL_APP_PASSWORD") },
    },
  });

  try {
    await client.send({
      from: env("GMAIL_USER"),
      to: env("MAIL_TO"),
      /* Reply goes to the person who asked, not to the sending mailbox —
         otherwise answering an enquiry emails ourselves. */
      replyTo: record.email,
      subject: composed.subject,
      /* One part, plain text, 7bit ASCII — and no attachment.
       *
       * The CV goes as a signed link. Attaching it meant base64 through
       * denomailer, which writes an attachment in 75-character chunks, one
       * call each: a 4.6 MB CV came to 84,000 of them and the worker ran out
       * of resources. The form allows 5 MB, so that is not an edge case.
       *
       * One part, not two, because an HTML alternative nests
       * multipart/alternative inside multipart/mixed, and that nesting arrived
       * in Gmail as raw text — boundary lines, part headers and markup all
       * printed into the body.
       *
       * The library's own `content`/`html` fields were worse again — it
       * quoted-printable encodes them, and its encoder's soft line breaks came
       * through as a literal `=` at the end of every line.
       *
       * So: nothing to decode, nothing to nest, nothing to render. An
       * application email is a list of fields and a file; it does not need
       * typography, and the version that always arrives beats the version that
       * looks better when it does.
       */
      mimeContent: [
        {
          mimeType: 'text/plain; charset="us-ascii"',
          content: composed.text,
          transferEncoding: "7bit",
        },
      ],
    });

    await client.close();
  } catch (error) {
    /* 500 on purpose: Supabase retries a failed webhook, and a transient SMTP
       failure should get another go. The enquiry is already saved regardless. */
    console.error("send failed", error);
    return new Response(`Send failed: ${error}`, { status: 500 });
  }

  return new Response("Sent", { status: 200 });
});
