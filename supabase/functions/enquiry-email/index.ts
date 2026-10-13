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

/** Addresses and names go into an email; both can contain anything typed. */
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * A link to the CV that expires.
 *
 * Made here rather than stored: the bucket is private and has no public URL by
 * design. A week is long enough to get to it after a weekend, and short enough
 * that a forwarded email stops working.
 */
async function signCv(path: string): Promise<string | null> {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;

  const response = await fetch(`${url}/storage/v1/object/sign/applications/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 7 }),
  });
  if (!response.ok) return null;

  const { signedURL } = await response.json();
  return signedURL ? `${url}/storage/v1${signedURL}` : null;
}

/** The table of fields, the body under it, and the line at the foot. */
function render(lines: [string, string | null][], body: string, footer: string) {
  const text = [
    ...lines.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    "",
    body,
    "",
    "—",
    footer,
  ].join("\n");

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

  return { text, html };
}

async function composeApplication(row: Application) {
  const cv = row.cv_path ? await signCv(row.cv_path) : null;

  const lines: [string, string | null][] = [
    ["Position", row.job],
    ["Name", `${row.first_name} ${row.last_name}`],
    ["Phone", row.phone],
    ["Email", row.email],
    ["Qualification", row.qualification],
    ["Experience", row.experience],
    ["Current CTC", row.ctc],
    ["Prefers", row.preference],
    [
      "CV",
      cv
        ? `${row.cv_name ?? "Download"} — ${cv}`
        : row.cv_path
          ? "uploaded; open it in the admin panel"
          : "none sent",
    ],
  ];

  return {
    subject: `Application: ${row.job} — ${row.first_name} ${row.last_name}`,
    ...render(
      lines,
      "",
      cv
        ? "Sent by the website. The CV link works for seven days; after that, open it in the admin panel."
        : "Sent by the website. Reply to this email to answer them directly.",
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

  const composed = isApplication
    ? await composeApplication(record as Application)
    : composeEnquiry(record as Enquiry);

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
      content: composed.text,
      html: composed.html,
    });
    await client.close();
  } catch (error) {
    /* 500 on purpose: Supabase retries a failed webhook, and a transient SMTP
       failure should get another go. The enquiry is already saved regardless. */
    console.error("send failed", error);
    return new Response("Send failed", { status: 500 });
  }

  return new Response("Sent", { status: 200 });
});
