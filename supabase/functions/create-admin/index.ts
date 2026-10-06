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

import { createClient } from "jsr:@supabase/supabase-js@2";

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
function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // --- who is asking -------------------------------------------------------
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Not signed in." }, 401);

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) return json({ error: "Not signed in." }, 401);

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
  const role = body.role === "super_admin" ? "super_admin" : "admin";

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
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    const taken = /already|registered|exists/i.test(createError.message);
    return json(
      {
        error: taken
          ? "An account already exists for that address."
          : createError.message,
      },
      taken ? 409 : 400,
    );
  }

  // Written directly rather than left to the sign-up trigger: that trigger only
  // fires for an invited address, and this account was made, not invited.
  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      { id: created.user.id, email, role, created_by: caller.user.id },
      { onConflict: "id" },
    );

  if (profileError) {
    // Leaving a login with no profile behind would be a ghost account: able to
    // sign in, able to do nothing, and invisible on the Team screen.
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: `Account rolled back: ${profileError.message}` }, 500);
  }

  return json({ email, role, password, generated });
});
