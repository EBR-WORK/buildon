/**
 * Supabase's Send Email hook: every auth mail, written and sent by us.
 *
 * Without this, password resets go out from "Supabase Auth
 * <noreply@mail.app.supabase.io>" — a sender nobody at Buildon recognises,
 * with Supabase's own branding and an "opt out of these emails" footer under a
 * message the person asked for. It also carries Supabase's built-in cap of
 * thirty auth mails an hour, project-wide, which testing alone can exhaust.
 *
 * With it, Supabase stops sending entirely and calls this instead. The mail is
 * then ours: our words, our address, and the Workspace account's quota of
 * 1,500 a day rather than 30 an hour.
 *
 * HOW IT IS CALLED
 *
 * Supabase posts the user and the token whenever an auth mail is due, signed
 * in the Standard Webhooks format. It is a server calling a public URL with no
 * user attached, so the function is deployed with JWT verification off and the
 * signature below is the only thing that proves the call is genuine.
 *
 * Deploy:
 *   npx supabase functions deploy send-email --no-verify-jwt --project-ref <ref>
 *   npx supabase secrets set SEND_EMAIL_HOOK_SECRET=… MAIL_WEBAPP_URL=… MAIL_WEBAPP_SECRET=…
 *
 * Then: Dashboard -> Authentication -> Hooks -> Send Email -> enable, point it
 * at this function, and copy the secret it generates into the secret above.
 */

const env = (key: string) => Deno.env.get(key) ?? "";

type Hook = {
  user: { email: string };
  email_data: {
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
};

/**
 * Prove the call came from Supabase and not from whoever found the URL.
 *
 * Standard Webhooks: the signature is an HMAC of `id.timestamp.body` with the
 * secret, and the header may carry several space-separated signatures so a
 * secret can be rotated without a gap. The secret itself arrives as
 * `v1,whsec_<base64>`; the part after whsec_ is the key, base64-decoded.
 *
 * Written out rather than pulled from a library: it is twenty lines, and a
 * dependency here is one more thing that can change under a function nobody
 * redeploys for months.
 */
async function signatureIsValid(body: string, headers: Headers) {
  const secret = env("SEND_EMAIL_HOOK_SECRET");
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatures = headers.get("webhook-signature");

  if (!secret || !id || !timestamp || !signatures) return false;

  /* Five minutes either way. A valid signature replayed next week is still a
     valid signature without this. */
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const raw = secret.replace(/^v1,whsec_/, "");
  const key = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(atob(raw), (c) => c.charCodeAt(0)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${body}`),
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  return signatures
    .split(" ")
    .some((entry) => entry.replace(/^v1,/, "") === expected);
}

/**
 * What each kind of auth mail says.
 *
 * Only the ones this site can actually produce. `recovery` is the one that
 * matters — Forgot password on the admin sign-in screen — and the rest are
 * here so that turning on a feature later does not send an empty message.
 */
function compose(action: string, link: string) {
  switch (action) {
    case "recovery":
      return {
        subject: "Reset your Buildon admin password",
        text: [
          "Somebody asked to reset the password for this Buildon admin account.",
          "",
          "Open this link to choose a new one:",
          link,
          "",
          "The link works once and expires in an hour.",
          "",
          "If this was not you, nothing has changed and you can ignore this.",
        ].join("\n"),
      };

    case "invite":
      return {
        subject: "You have been invited to the Buildon admin panel",
        text: [
          "You have been invited to the Buildon admin panel.",
          "",
          "Open this link to set your password and sign in:",
          link,
        ].join("\n"),
      };

    case "magiclink":
      return {
        subject: "Your Buildon sign-in link",
        text: ["Open this link to sign in to the Buildon admin panel.", "", link].join("\n"),
      };

    case "email_change":
      return {
        subject: "Confirm your new email address",
        text: [
          "Open this link to confirm the new address on your Buildon admin account.",
          "",
          link,
        ].join("\n"),
      };

    default:
      return {
        subject: "Confirm your Buildon admin account",
        text: ["Open this link to confirm your Buildon admin account.", "", link].join("\n"),
      };
  }
}

/** The same Apps Script web app every other mail on this project goes through. */
async function send(to: string, subject: string, text: string) {
  const url = env("MAIL_WEBAPP_URL");
  if (!url) throw new Error("MAIL_WEBAPP_URL is not set on the function");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: env("MAIL_WEBAPP_SECRET"),
      to,
      subject,
      text,
    }),
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });

  /* Apps Script answers 200 to its own crash page, so the body decides. */
  const body = (await response.text()).slice(0, 300);
  if (!response.ok || !body.includes('"ok":true')) {
    throw new Error(`mail web app refused: ${response.status} ${body}`);
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  /* Read once, as text: the signature covers the exact bytes sent, so parsing
     first and re-serialising would verify something Supabase never signed. */
  const raw = await request.text();

  if (!(await signatureIsValid(raw, request.headers))) {
    return new Response("Unauthorized", { status: 401 });
  }

  let hook: Hook;
  try {
    hook = JSON.parse(raw);
    if (!hook?.user?.email || !hook?.email_data?.token_hash) {
      throw new Error("not an email hook payload");
    }
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const data = hook.email_data;

  /* The verify endpoint lives on the PROJECT, not on the website.
  
     site_url in the payload is the site a person lands on afterwards —
     buildon.co.in — and a /auth/v1/verify path there is nothing at all. The
     endpoint that turns a token into a session is on the Supabase API domain,
     which the runtime always provides.
  
     And it needs an apikey. Supabase's gateway refuses an unkeyed call with
     "No API key found in request" — which is exactly what the first links from
     this function returned when they reached the right domain. The gateway
     accepts the key as a query parameter, which is the only place a link can
     put it. It is the publishable key, the same one the website's JavaScript
     carries in the open; what it permits is decided by row level security.
  
     redirect_to is where the person goes once the token is accepted, and must
     be allow-listed under Authentication -> URL Configuration or Supabase
     quietly substitutes the Site URL. */
  const apiUrl = env("SUPABASE_URL") || data.site_url;
  /* SUPABASE_ANON_KEY is injected by the runtime and is usually enough. The
     fallback is deliberately NOT called SUPABASE_something: the CLI refuses to
     set any secret whose name starts with that prefix, because the prefix is
     its own. */
  const apiKey = env("SUPABASE_ANON_KEY") || env("PUBLISHABLE_KEY") || "";

  const link =
    `${apiUrl}/auth/v1/verify` +
    `?token=${encodeURIComponent(data.token_hash)}` +
    `&type=${encodeURIComponent(data.email_action_type)}` +
    `&redirect_to=${encodeURIComponent(data.redirect_to)}` +
    (apiKey ? `&apikey=${encodeURIComponent(apiKey)}` : "");

  const mail = compose(data.email_action_type, link);

  try {
    await send(hook.user.email, mail.subject, mail.text);
  } catch (error) {
    /* 500 so Supabase reports the failure rather than telling the person their
       mail is on its way. Nothing is duplicated by a retry: this sends a
       message and writes nothing. */
    console.error("auth mail failed", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  /* An empty object is what the hook expects when it has nothing to change. */
  return new Response("{}", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
