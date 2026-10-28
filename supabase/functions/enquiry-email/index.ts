/**
 * What happens the moment a submission's row is written.
 *
 *   an enquiry      -> forwarded to Odoo, where it becomes a CRM lead
 *   an application  -> emailed to the office, if MAIL_TO is set
 *
 * Both used to be emailed. Enquiries are not any more: they already appear on
 * the Leads screen in the admin panel and in the sales team's own CRM, and a
 * third copy in an inbox is one more place to miss one.
 *
 * Applications are emailed only while MAIL_TO holds an address. Unset that
 * secret and they are silent — which means the Applications screen in the
 * panel is the ONLY place a CV will ever appear, and nobody is told it
 * arrived. That is a deliberate choice, not an oversight; set MAIL_TO again to
 * undo it.
 *
 * Called by a database webhook on insert — so the trigger is the row, not the
 * form. That matters: the submission is already stored before this runs, so a
 * failure here loses a notification, never a lead. The row is in the panel
 * either way.
 *
 * Why this exists rather than Netlify Forms: Netlify Forms only works while
 * the site is on Netlify. This works wherever the site is hosted, because the
 * database is doing the sending, and the database does not move.
 *
 * Gmail, over SMTP, with an app password. Not the Gmail API — that needs
 * OAuth, and an app password cannot use it. The credentials are function
 * secrets; nothing here reaches a browser.
 *
 * Mail goes out through a Google Apps Script web app running in Buildon's own
 * Workspace, so it arrives from a buildon.co.in address rather than from the
 * personal Gmail account whose app password this used to carry. The script
 * itself is beside this file, in mail-webapp.gs. Gmail SMTP is still here and
 * is used only while MAIL_WEBAPP_URL is unset.
 *
 * Deploy:
 *   npx supabase login
 *   npx supabase functions deploy enquiry-email --project-ref <ref>
 *   npx supabase secrets set MAIL_WEBAPP_URL=… MAIL_WEBAPP_SECRET=… MAIL_TO=… WEBHOOK_SECRET=…
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
  quantity: number | null;
  source: string | null;
  page: string | null;
};

const env = (key: string) => Deno.env.get(key) ?? "";

/**
 * Hand the enquiry to Odoo as well, so it appears in the sales team's CRM.
 *
 * Called from the server and never from the browser. The URL is a credential:
 * anyone holding it can create records in the CRM, so a page that contained it
 * would be an open door for whoever reads the source — which is everyone.
 *
 * Deliberately cannot fail the function. The enquiry is already in the
 * database and the office has already been emailed by the time this runs, so
 * an Odoo outage must not turn into a retry that emails the office twice. A
 * push that fails is logged and the lead is still in the panel, where it can
 * be sent again by hand.
 *
 * Only enquiries go. A job application is recruitment, not a sales lead, and
 * putting applicants in the CRM pipeline would corrupt the sales figures.
 */
async function pushToOdoo(row: Enquiry) {
  const url = env("ODOO_WEBHOOK_URL");
  if (!url) return; /* Not configured — forwarding is optional. */

  /* Flat, with names that read the same in Odoo's automation rule as they do
     here. The rule maps these onto crm.lead; keeping the shape obvious is what
     makes that mapping something a person can check. */
  const payload = {
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    company: row.company ?? "",
    enquiry_type: row.enquiry_type ?? "",
    product: row.product ?? "",
    /* Bags. Its own field since 0025 — it used to be a line inside message,
       which Odoo had no way to map onto anything. */
    quantity: row.quantity ?? "",
    /* Where it came from, so website leads can be told from phone calls. */
    source: row.source ?? "website",
    page: row.page ?? "",
    /* Ours, so a duplicate push can be recognised rather than guessed at. */
    reference: `buildon-enquiry-${row.id}`,
    submitted_at: row.created_at,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      /* Odoo Online can be slow to wake. Long enough to be fair, short enough
         that this never holds the function open. */
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.error(
        `odoo push failed for enquiry ${row.id}: ${response.status} ${(await response.text()).slice(0, 200)}`,
      );
      return;
    }
    console.log(`odoo push ok for enquiry ${row.id}`);
  } catch (error) {
    console.error(`odoo push failed for enquiry ${row.id}:`, error);
  }
}

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

/**
 * One plain-text mail, over the same Gmail connection everything else uses.
 *
 * Pulled out when assignment notices were added: they go to a member of staff
 * rather than to MAIL_TO, so the recipient had to become an argument. The
 * encoding is unchanged and deliberately plain — see the note on mimeContent
 * below for the three ways the pretty version failed to arrive.
 */
async function sendMail(to: string, subject: string, text: string, replyTo?: string) {
  const script = env("MAIL_WEBAPP_URL");
  if (script) {
    await sendViaScript(script, to, subject, text, replyTo);
    return;
  }

  /* No web app configured, so the old road. Kept rather than deleted: it is
     what sends while the Apps Script deployment is being set up, and what
     sends again if that deployment is ever revoked. Unset MAIL_WEBAPP_URL and
     mail resumes over SMTP with no deploy. */
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
      to,
      ...(replyTo ? { replyTo } : {}),
      subject,
      mimeContent: [
        {
          mimeType: 'text/plain; charset="us-ascii"',
          content: text,
          transferEncoding: "7bit",
        },
      ],
    });
  } finally {
    await client.close();
  }
}

/**
 * Send through the Google Apps Script web app instead of Gmail SMTP.
 *
 * WHY THIS EXISTS
 *
 * SMTP sends as whichever mailbox owns the app password — a personal Gmail
 * account that happens to have been to hand. Every enquiry, every assignment
 * and every CV therefore arrived from an address that is nobody at Buildon,
 * which is the wrong name on the envelope and the wrong account to depend on
 * when that person's password changes. The web app runs inside the company's
 * own Workspace and sends as a buildon.co.in address.
 *
 * It also removes the app password from this function. An Apps Script URL can
 * be revoked by redeploying; a Gmail app password has to be found and killed
 * in somebody's personal account settings.
 *
 * THE URL IS THE CREDENTIAL
 *
 * A web app deployed as "anyone" will send mail for whoever posts to it, so
 * the shared secret below is what stops the URL alone being enough. Both live
 * as function secrets and neither belongs in git.
 */
async function sendViaScript(
  url: string,
  to: string,
  subject: string,
  text: string,
  replyTo?: string,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    /* The shape the deployed script already reads — see mail-webapp.gs. It was
       written for Supabase's Auth hook (password resets) and this reuses it
       rather than replacing it: a second script would be a second deployment,
       a second secret and a second quota, for the same account sending the
       same kind of mail. `text`, not `body`: that is the key it looks for. */
    body: JSON.stringify({
      secret: env("MAIL_WEBAPP_SECRET"),
      to,
      subject,
      text,
      replyTo: replyTo ?? "",
    }),
    /* Apps Script answers with a 302 to googleusercontent.com and the real
       reply is behind it. Deno follows that by default; saying so because a
       redirect that is not followed looks exactly like a silent success. */
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });

  const body = (await response.text()).slice(0, 300);

  /* Apps Script answers 200 to almost everything, including its own crash
     page, so the status alone proves nothing. The script replies with
     {"ok":true} and that is what is checked. */
  if (!response.ok || !body.includes('"ok":true')) {
    throw new Error(`mail web app refused: ${response.status} ${body}`);
  }
}

/* --------------------------------------------------------- assignments */

type Assignment = {
  kind: "assignment" | "task";
  /** The member of staff being told. */
  to: string;
  /** Who did it, when a person did. */
  by?: string | null;
  lead: {
    id: number;
    name: string;
    phone: string;
    email: string;
    company: string | null;
    product: string | null;
    quantity: number | null;
    enquiry_type: string | null;
    message: string;
    source: string | null;
    status: string;
    priority: string;
  };
  /** Only on a task. */
  action?: string;
  due_on?: string | null;
};

/* Non-ASCII is stripped rather than encoded, for the same reason the body is
   7bit: a subject line that needs decoding is a subject line that sometimes
   arrives as gibberish. Names on this site are Latin; a stray character is
   worth less than a mail that always reads. */
const ascii = (value: string) =>
  value
    /* Newlines survive; they are below 0x20 and were being stripped with
       everything else, which ran a message's lines together. An enquiry
       reading "Quantity: 33 bags" and "this is testing" on two lines arrived
       as "33 bagsthis is testing".

       A carriage return is folded into the newline rather than kept, so a
       pasted Windows line ending does not open a blank line of its own. */
    .replace(/\r\n?/g, "\n")
    .replace(/[^\x20-\x7E\n]/g, "")
    .trim();

function composeAssignment(body: Assignment) {
  const lead = body.lead;
  const who = body.by ? ascii(body.by) : "A super admin";

  const lines = [
    body.kind === "task"
      ? `${who} added a task on a lead assigned to you.`
      : `${who} assigned you a lead.`,
    "",
    `Name:     ${ascii(lead.name)}`,
    `Phone:    ${ascii(lead.phone)}`,
  ];

  /* The placeholder addLead writes for a lead taken by hand. Printing it would
     invite somebody to mail a mailbox that does not exist. */
  if (lead.email && !lead.email.startsWith("no-email@")) {
    lines.push(`Email:    ${ascii(lead.email)}`);
  }
  if (lead.company) lines.push(`Company:  ${ascii(lead.company)}`);
  if (lead.product) lines.push(`Product:  ${ascii(lead.product)}`);
  if (lead.quantity) lines.push(`Quantity: ${lead.quantity} bags`);
  if (lead.enquiry_type) lines.push(`Type:     ${ascii(lead.enquiry_type)}`);
  if (lead.source) lines.push(`Source:   ${ascii(lead.source)}`);
  lines.push(`Status:   ${ascii(lead.status)}`);
  if (lead.priority && lead.priority !== "normal") {
    lines.push(`Priority: ${ascii(lead.priority)}`);
  }

  if (body.kind === "task" && body.action) {
    lines.push("", "Next action:", ascii(body.action));
    if (body.due_on) lines.push(`Due: ${ascii(body.due_on)}`);
  }

  if (lead.message) {
    lines.push("", "What they asked for:", ascii(lead.message));
  }

  lines.push(
    "",
    "Open it in the admin panel:",
    `${env("PANEL_URL") || "https://buildon.co.in"}/admin/leads#lead-${lead.id}`,
    "",
    "You are getting this because the lead is assigned to you.",
  );

  const subject =
    body.kind === "task"
      ? `New task: ${ascii(lead.name)}`
      : `Lead assigned to you: ${ascii(lead.name)}`;

  return { subject, text: lines.join("\n") };
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

  /* One function, three jobs. The shape says which: an application carries a
     job and a first name, an enquiry a message, and an assignment says so.
     Three functions would mean three deploys, three sets of SMTP credentials
     and three places for one bug. */
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  /* An assignment, which is the only one of the three addressed to a member of
     staff rather than to the office. It is handled before anything else
     because it arrives on an UPDATE of a row that has already been through
     here once as an INSERT — falling through would push the same lead into
     Odoo a second time. */
  if (body.kind === "assignment" || body.kind === "task") {
    const note = body as unknown as Assignment;

    if (!note.to || !note.lead?.name) {
      return new Response("Bad request", { status: 400 });
    }

    /* A profile without an address, or a lead unassigned rather than handed
       on. Neither is an error: the bell in the panel still shows it. */
    if (!note.to.includes("@") || note.to.startsWith("no-email@")) {
      console.log(`no address for ${note.to} — notice is in the panel only`);
      return new Response("Skipped", { status: 200 });
    }

    try {
      const composed = composeAssignment(note);
      await sendMail(note.to, composed.subject, composed.text);
    } catch (error) {
      /* 500 so Supabase retries. Nothing is duplicated by a second attempt:
         this sends mail and writes nothing. */
      console.error("assignment mail failed", error);
      return new Response(`Send failed: ${error}`, { status: 500 });
    }

    return new Response("Sent", { status: 200 });
  }

  let record: Enquiry | Application;
  try {
    record = (body.record ?? body) as Enquiry | Application;
    if (!record?.email) throw new Error("not a submission");
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const isApplication = "job" in record && "first_name" in record;
  if (!isApplication && !(record as Enquiry).message) {
    return new Response("Bad request", { status: 400 });
  }

  /* An enquiry is no longer emailed to the office.

     It lands in two places a person already looks: the Leads screen in the
     admin panel, and the sales team's own CRM in Odoo. A third copy in an
     inbox is one more place to miss it and one more thing to keep in sync, so
     it was asked for and removed rather than left on "just in case".

     Job applications still send, because they have nowhere else to go —
     applicants are deliberately kept OUT of the sales pipeline, so for those
     the mail is the only notification HR gets. */
  if (!isApplication) {
    await pushToOdoo(record as Enquiry);
    /* 200 even if Odoo refused it. The enquiry is already stored, and a 500
       here would make Supabase retry — which, now that nothing dedupes on the
       Odoo side, would put the same lead in the pipeline twice. A failed push
       is in the log above and the lead is still in the panel. */
    return new Response("Forwarded", { status: 200 });
  }

  /* MAIL_TO is the off switch for application emails.

     Unset the secret and nothing is sent; set it again and sending resumes, no
     deploy either way. The mail code below is kept rather than deleted for
     that reason — "stop emailing HR" is a decision someone may reverse the
     first time a CV is missed, and a secret is a cheaper way back than a code
     change.

     With it unset, an application exists ONLY on the Applications screen in
     the admin panel. Nothing else will tell anyone it arrived. */
  if (!env("MAIL_TO")) {
    console.log(`mail disabled (no MAIL_TO) — application ${record.id} is in the panel only`);
    return new Response("Stored", { status: 200 });
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

  /* One sender for all three kinds of mail.
  
     This used to build its own SMTP client, with its own copy of the encoding
     notes below. Two senders meant the Apps Script change would have moved
     assignment mail to the company's own address and left applications coming
     from a personal Gmail — which is exactly the split that made this worth
     changing in the first place.
  
     Still plain text with no attachment. The CV goes as a signed link:
     attaching it meant base64 through denomailer, which writes an attachment
     in 75-character chunks, one call each — a 4.6 MB CV came to 84,000 of them
     and the worker ran out of resources. The form allows 5 MB, so that was not
     an edge case. */
  try {
    /* Reply goes to the person who asked, not to the sending mailbox —
       otherwise answering an enquiry emails ourselves. */
    await sendMail(env("MAIL_TO"), composed.subject, composed.text, record.email);
  } catch (error) {
    /* 500 on purpose: Supabase retries a failed webhook, and a transient
       failure should get another go. The application is already saved. */
    console.error("send failed", error);
    return new Response(`Send failed: ${error}`, { status: 500 });
  }

  /* Only applications reach here. An enquiry returned earlier, forwarded
     to Odoo and deliberately not emailed. */
  return new Response("Sent", { status: 200 });
});
