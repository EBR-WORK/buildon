"use client";

/**
 * Who is signed in, and what they are allowed to do.
 *
 * The role is read from `profiles`, not from the session. A JWT says who you
 * are; the profile row says what you may do, and it is the row the policies in
 * 0002_admins.sql consult. Anything decided here is a convenience for the UI —
 * hiding a button nobody may press — never the enforcement. A signed-in user
 * with no profile can reach every screen by typing the URL, and every write
 * they attempt will still be refused by Postgres.
 */

import { supabase } from "./supabase";

export type AdminRole = "admin" | "super_admin";

export type AdminProfile = {
  readonly id: string;
  readonly email: string;
  readonly role: AdminRole;
};

/** Managing the team is the one thing an ordinary admin cannot do. */
export function canManageTeam(profile: AdminProfile | null) {
  return profile?.role === "super_admin";
}

/** Editing content is what having a profile at all means. */
export function canEditContent(profile: AdminProfile | null) {
  return profile !== null;
}

export function describeRole(role: AdminRole) {
  return role === "super_admin" ? "Super admin" : "Admin";
}

/**
 * The signed-in user's profile, or null.
 *
 * Null covers two different situations the caller has to tell apart: nobody is
 * signed in, and somebody is signed in who was never invited. `signedIn` says
 * which, because the second needs an explanation rather than a login form.
 */
export async function loadProfile(): Promise<{
  signedIn: boolean;
  profile: AdminProfile | null;
  email: string | null;
}> {
  if (!supabase) return { signedIn: false, profile: null, email: null };

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { signedIn: false, profile: null, email: null };

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  /* maybeSingle, not single: no row is the expected answer for somebody who
     signed up without an invite, and `single` reports that as an error. */
  if (error || !data) {
    return { signedIn: true, profile: null, email: user.email ?? null };
  }

  return {
    signedIn: true,
    profile: data as AdminProfile,
    email: user.email ?? null,
  };
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error("The database is not configured.");

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    /* Supabase answers a wrong password and an unknown address identically, on
       purpose — telling them apart lets anyone test which addresses exist. The
       message is rewritten only to drop the API wording. */
    throw new Error(
      /invalid login credentials/i.test(error.message)
        ? "That email and password do not match."
        : error.message,
    );
  }
}

export async function signOut() {
  await supabase?.auth.signOut();
}

/**
 * Create an account for someone, as a super admin.
 *
 * The work happens in the `create-admin` Edge Function, because making a user
 * needs the service role key and that key can never be in a browser. The
 * function re-checks the caller's role against the database rather than
 * trusting anything sent from here — this call being reachable is not what
 * authorises it.
 *
 * Throws NotDeployed when the function is not there, so the Team screen can
 * say what to do instead of showing a network error.
 */
export class FunctionNotDeployed extends Error {}

export async function createAdmin(
  email: string,
  role: AdminRole,
): Promise<{ email: string; role: AdminRole; password: string }> {
  if (!supabase) throw new Error("The database is not configured.");

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Your session has expired. Sign in again.");

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let response: Response;

  try {
    response = await fetch(`${base}/functions/v1/create-admin`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
    });
  } catch {
    /* A network-level failure here is almost always the function not existing
       yet, since the project itself has just answered other requests. */
    throw new FunctionNotDeployed("The create-admin function is not deployed.");
  }

  if (response.status === 404) {
    throw new FunctionNotDeployed("The create-admin function is not deployed.");
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error ?? `The account could not be created (${response.status}).`);
  }

  return payload as { email: string; role: AdminRole; password: string };
}

/**
 * Create your own account, from an invitation.
 *
 * Open sign-up is not a hole here, and closing it is not an option: creating a
 * user needs the service role key, so an invited teammate has no other way to
 * exist. What protects the panel is the allowlist — the trigger in
 * 0002_admins.sql grants a role only to an invited address, and anyone else
 * ends up signed in with no profile and no permission to write anything.
 *
 * Returns whether a session came back. It does not when the project still has
 * email confirmation switched on, and the caller has to say so rather than
 * dropping the person on a login form that will reject them.
 */
export async function signUp(
  email: string,
  password: string,
): Promise<{ needsConfirmation: boolean }> {
  if (!supabase) throw new Error("The database is not configured.");

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      throw new Error("An account already exists for that address. Sign in instead.");
    }
    if (/invalid/i.test(error.message) && /email/i.test(error.message)) {
      /* Supabase refuses addresses at domains that cannot receive mail, which
         includes example.com and anything that does not resolve. */
      throw new Error("Supabase will not accept that address. Use a real work email.");
    }
    throw new Error(error.message);
  }

  return { needsConfirmation: !data.session };
}
