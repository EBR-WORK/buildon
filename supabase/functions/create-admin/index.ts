// Create an admin account, on behalf of a super admin.
//
// This exists because of one hard constraint: creating a user requires the
// service role key, and the site is a static export — there is no server of
// ours to hold that key, and anything in the browser bundle is public. An Edge
// Function is a server that is not ours to run: Supabase hosts it, the key
// stays in its environment, and the browser only ever sees the result.
//
// The caller's own JWT decides whether this is allowed. The function trusts
// nothing in the request body about who is asking — it reads the token, looks
// up that user's profile with the service key, and refuses anyone who is not a
// super admin. A body claiming `role: "super_admin"` for the *new* account is
// honoured; a body claiming the caller is one is not, because the caller is
// never read from the body.
//
// Deploy:
//   npx supabase functions deploy create-admin --project-ref <your-ref>
//
// Or paste this into Dashboard -> Edge Functions -> Deploy a new function.

/* Pinned, not "@2".
 *
 * An unpinned range is resolved at DEPLOY time, so a function that has not
 * been touched for weeks can come back with a different library than the one
 * it was written against. That is what happened here: a redeploy picked up a
 * newer v2 in which `auth.getUser(jwt)` no longer reads the token it is handed
 * and throws "Auth session missing!" instead. Nothing in this file had
 * changed, and the error pointed at the caller's sign-in rather than at the
 * dependency.
 *
 * Same version as enquiry-email, so both functions move together and only when
 * somebody decides to move them.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
/* Same mailer and the same Gmail credentials the enquiry function uses.
   Supabase's own templates cannot carry a password — they send a link and
   nothing else — so an email that states the credentials has to be sent
   from here. */
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

/** Readable, and strong enough to be the only thing guarding the panel.
    i/l/1/O/0 are left out: this gets read off a screen and retyped. */
/** Shorthand, so a missing secret reads as "" rather than undefined. */
const env = (key: string) => Deno.env.get(key) ?? "";

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}


/**
 * Email somebody the account that was just made for them.
 *
 * A PLAINTEXT PASSWORD, deliberately, and it is worth being clear about the
 * trade: a set-password link is safer, because nothing reusable is ever
 * written down. A password in an inbox stays there, and travels with every
 * forward of that message.
 *
 * It is sent anyway because this is an internal panel for a small team, and a
 * link that expires in an hour has repeatedly been the thing that stops a new
 * person getting in at all. The mail says to change it, and they can.
 *
 * Returns whether it went. A failure is not fatal: the panel falls back to
 * showing the password on screen for the super admin to pass on, which is the
 * same place it was before any of this.
 */
async function emailCredentials(to: string, password: string, roleLabel: string) {
  const script = env("MAIL_WEBAPP_URL");
  const user = env("GMAIL_USER");
  const pass = env("GMAIL_APP_PASSWORD");
  if (!script && (!user || !pass)) {
    return {
      ok: false,
      error: "MAIL_WEBAPP_URL, or GMAIL_USER and GMAIL_APP_PASSWORD, must be set on the function.",
    };
  }

  const lines = [
    "You have been given access to the Buildon admin panel.",
    "",
    `  Sign in at:  ${env("SITE_URL") || "https://buildon.co.in"}/admin`,
    `  Username:    ${to}`,
    `  Password:    ${password}`,
    `  Role:        ${roleLabel}`,
    "",
    "Please change this password after signing in: use Forgot password on",
    "the sign-in screen and choose your own.",
    "",
    "If you were not expecting this, tell whoever manages the website.",
  ].join("\n");

  /* Through the company's own Apps Script web app when there is one.
  
     This function had its own SMTP client, so the move off the personal Gmail
     account missed it: enquiries and assignments started arriving from
     buildon.co.in while the mail that hands somebody their PASSWORD still came
     from a stranger's address — which is the one mail where the sender being
     recognisable matters most.
  
     No bcc on this road. The Apps Script contract takes one recipient, and the
     copy that road sent to itself was an audit trail; the panel still shows
     the password to the super admin, and the Team screen still records who was
     added. */
  if (script) {
    try {
      const response = await fetch(script, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env("MAIL_WEBAPP_SECRET"),
          to,
          subject: "Your Buildon admin account",
          text: lines,
        }),
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });

      /* Apps Script answers 200 to its own crash page too, so the body is what
         is checked, not the status. */
      const body = (await response.text()).slice(0, 300);
      if (!response.ok || !body.includes('"ok":true')) {
        return { ok: false, error: `mail web app refused: ${response.status} ${body}` };
      }
      return { ok: true, error: "" };
    } catch (error) {
      return { ok: false, error: `mail web app failed: ${error}` };
    }
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: user, password: pass },
    },
  });

  try {
    await client.send({
      from: user,
      to,
      /* A copy to the sending mailbox, for two reasons.
         
         It is an audit trail — who was given access, when, with which role —
         and it is the only way to tell "the mail was never sent" apart from
         "the mail was sent and did not arrive". Without it a silent failure
         and a spam folder look identical from here, and Edge Function logs
         cannot be read from the CLI. */
      bcc: user,
      subject: "Your Buildon admin account",
      /* One plain-text part, 7bit. The enquiry function learned this the hard
         way: denomailer quoted-printable encodes its `content` field, and the
         soft line breaks arrive in Gmail as a literal "=" at the end of every
         line. */
      mimeContent: [
        {
          mimeType: 'text/plain; charset="us-ascii"',
          content: lines,
          transferEncoding: "7bit",
        },
      ],
    });
    await client.close();
    return { ok: true, error: "" };
  } catch (error) {
    /* Returned, not only logged.
       
       Edge Function logs are not reachable from the CLI, so a failure here was
       invisible: the panel said the password had been emailed and nothing
       arrived, with no way to find out why. The super admin is the only one
       who sees this, and they are the person who can act on it. */
    const message = error instanceof Error ? error.message : String(error);
    console.error("could not email the credentials:", message);
    return { ok: false, error: message.slice(0, 300) };
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;

  /* SUPABASE_SERVICE_ROLE_KEY is injected into every function. SECRET_KEY is
     the name the newer key scheme uses, taken as a fallback so that disabling
     the legacy keys does not silently leave this reading an empty string and
     failing further down, where the message would say nothing about why. */
  const serviceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";

  if (!serviceKey) {
    /* Said plainly, because this is a deployment problem and no amount of
       signing in again will change it. */
    return json(
      { error: "The function has no service key. Set SUPABASE_SERVICE_ROLE_KEY as a function secret." },
      500,
    );
  }

  // --- who is asking -------------------------------------------------------
  //
  // These two used to return the same sentence, and that cost a round of
  // guessing: "Not signed in." was shown both when the panel sent no token and
  // when the token was sent but could not be verified. They are different
  // faults with different fixes, so they say different things.
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return json({ error: "No sign-in token reached the function." }, 401);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  /* The caller is identified by a SECOND client, one that carries their token
     as a request header, rather than by handing the token to getUser().

     getUser(jwt) is the call that broke: in newer releases it reads the
     client's own stored session and ignores the argument, so on a server —
     where there is no stored session — it throws "Auth session missing!"
     whatever token you pass. Setting the Authorization header is how a server
     has always been meant to act as a user, and it behaves the same across
     versions.

     Deliberately not the `admin` client: that one holds the service key and
     must never be given a user's identity, or the role check below would be
     asking the wrong question. */
  const asCaller = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: caller, error: callerError } = await asCaller.auth.getUser();
  if (callerError || !caller.user) {
    return json(
      {
        error: `Your sign-in could not be verified${callerError?.message ? `: ${callerError.message}` : "."}`,
      },
      401,
    );
  }

  // The role comes from the database, never from the request.
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", caller.user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") {
    return json({ error: "Only a super admin can create accounts." }, 403);
  }

  // --- what they asked for -------------------------------------------------
  let body: { email?: string; role?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected JSON." }, 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();

  /* Every role the panel offers, matching the CHECK on profiles.role.

     This used to read:

       const role = body.role === "super_admin" ? "super_admin" : "admin";

     written when there were two roles and never revisited when 0009 added
     six. It silently turned every other choice into "admin": picking "Content
     editor" or "Marketing" in the panel created somebody with full admin
     rights, the panel reported the role it had asked for, and the Team screen
     showed what the database held — so the only place the truth appeared was
     the row itself.

     Rejected rather than defaulted, now. A role this does not recognise is a
     panel and a function that disagree, and quietly picking one of them is how
     the bug above lasted this long. */
  const ROLES = [
    "super_admin",
    "content_editor",
    "hr",
    "marketing",
    "sales",
    "presales",
    /* The original role, kept because existing rows still carry it. */
    "admin",
  ];

  const role = body.role ?? "";
  if (!ROLES.includes(role)) {
    return json(
      { error: `Unknown role "${role}". Expected one of: ${ROLES.join(", ")}.` },
      400,
    );
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "That is not a valid email address." }, 400);
  }

  // A password may be supplied, but a generated one is the normal path: it is
  // stronger than what gets typed into a form, and it is never reused.
  const password = body.password && body.password.length >= 10
    ? body.password
    : generatePassword();
  const generated = password !== body.password;

  // --- make the account ----------------------------------------------------
  //
  // email_confirm skips the confirmation mail. A project without SMTP cannot
  // deliver one, and an unconfirmed account simply cannot sign in — which
  // looks to the new admin like a wrong password rather than a missing email.
  //
  // This was briefly inviteUserByEmail, so that Supabase would send its
  // "Invite user" template instead of a password-reset letter. It is back,
  // because the invite sets NO password: when the email failed to send — which
  // on the built-in mail service it does readily, the free tier allows very
  // few an hour — the account existed with no way into it at all. No password
  // to hand over, no link delivered, and a super admin who could only try
  // again and get the same.
  //
  // Creating with a password keeps a working fallback: if the mail does not
  // arrive, the panel shows a password that can be read out. The wording of
  // the letter is fixed in the template instead, where getting it wrong cannot
  // lock anybody out.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  /**
   * An address that already has a login is not a refusal.
   *
   * It happens more than it sounds: somebody signed up before any of this
   * existed, or an earlier approval made the account and then failed before
   * the profile was written. Either way the person has a login that can do
   * nothing, and the super admin pressing Approve wants exactly what they
   * asked for — give this person access as this role.
   *
   * So the account is found rather than rejected, and the profile below is
   * written for it the same way. The password is left alone: whatever they
   * already have keeps working, and the link they are sent replaces it.
   */
  let userId: string;
  let existing = false;

  if (createError) {
    const taken = /already|registered|exists/i.test(createError.message);
    if (!taken) return json({ error: createError.message }, 400);

    /* listUsers, because there is no get-by-email: the admin API indexes on
       id. 200 is far more accounts than this panel will ever have, and the
       alternative is a query against auth.users, which is not ours to make. */
    const { data: list, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const found = list?.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (listError || !found) {
      return json({ error: "An account already exists for that address." }, 409);
    }

    userId = found.id;
    existing = true;
  } else {
    userId = created!.user.id;
  }

  /* An existing login with NO role is not somebody's working account.
     
     People can sign themselves up before a super admin approves them, so by
     the time Approve is pressed the login often already exists — and it can do
     nothing at all, because a role is what grants anything here.
     
     That case used to be treated as "their password is theirs, leave it", so
     no credentials were sent and the panel fell back to a Supabase reset link
     — which is capped at 30 an hour and is what produced the rate-limit
     warning on approval. There is no password worth protecting on an account
     that has never had access, so it is given the generated one and told
     about it like any other new admin.
     
     An account that already HAS a role is left alone: that is a working
     admin, and changing their password because somebody re-approved them
     would lock them out of a session they are in the middle of. */
  let adopted = false;
  if (existing) {
    const { data: priorProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!priorProfile) {
      const { error: setError } = await admin.auth.admin.updateUserById(userId, { password });
      if (setError) {
        return json({ error: `Could not set a password: ${setError.message}` }, 500);
      }
      adopted = true;
    }
  }

  // Written directly rather than left to the sign-up trigger: that trigger only
  // fires for an invited address, and this account was made, not invited.
  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      { id: userId, email, role, created_by: caller.user.id },
      { onConflict: "id" },
    );

  if (profileError) {
    /* Leaving a login with no profile behind would be a ghost account: able to
       sign in, able to do nothing, invisible on the Team screen. Rolled back
       only when this call made it — an account that was already there is not
       ours to delete, and deleting it would take somebody's login away for a
       failure that has nothing to do with them. */
    if (!existing) await admin.auth.admin.deleteUser(userId);
    return json(
      { error: existing ? profileError.message : `Account rolled back: ${profileError.message}` },
      500,
    );
  }

  /* `existing` tells the panel not to offer a password: the account already
     had one, and this call did not change it. */
  /* Email the credentials, unless the address already had a login.
     
     An existing account keeps the password it already has — this call did not
     change it — so sending "your password is …" would be a lie and would lock
     nobody in or out. Those still get a reset link from the panel instead. */
  /* Sent for a brand-new account, and for an existing login that had no role
     and has just been given the generated password above. Not sent to a
     working admin, whose password was deliberately left untouched. */
  const mail = existing && !adopted
    ? { ok: false, error: "" }
    : await emailCredentials(email, password, role);
  const emailed = mail.ok;

  /* `invited` tells the panel whether an email has ALREADY gone, so it does not
     send a second one on top. `emailed` says which kind: credentials, not a
     link. When the send failed, both are false and the panel falls back to
     showing the password for the super admin to pass on by hand. */
  return json({
    email,
    role,
    password,
    generated,
    /* `existing` now means "was a working admin already" — an unroled login
       that was adopted reports as new, because from the panel's point of view
       that is what happened: somebody who had no access now has it, with a
       password they were just sent. */
    existing: existing && !adopted,
    invited: emailed,
    emailed,
    /* Empty when nothing went wrong, or when there was nothing to send. */
    mailError: mail.error,
  });
});
