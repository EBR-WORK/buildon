"use client";

/**
 * Publishing: turning saved content into the site people see.
 *
 * The site is a static export, so a save and a publish are two different
 * things. Saving writes to Postgres and is instant. The pages a visitor loads
 * were turned into HTML at build time, and the only way new content reaches
 * them is another build — `npm run build` begins with db:pull, which fetches
 * exactly what the panel just saved.
 *
 * A Netlify build hook is a URL that starts that build when posted to. This
 * module reads it from `settings`, where RLS keeps it away from the public
 * key, and posts to it.
 */

import { supabase } from "./supabase";

export const BUILD_HOOK_KEY = "netlify_build_hook";

/** Netlify's own shape, so a pasted URL that cannot work is refused early. */
export const BUILD_HOOK_PATTERN = /^https:\/\/api\.netlify\.com\/build_hooks\/[A-Za-z0-9]+$/;

/** The hook, or null when none is set or the account may not read it. */
export async function getBuildHook(): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", BUILD_HOOK_KEY)
    .maybeSingle();

  /* maybeSingle: no row is the normal state before anyone sets one, and RLS
     filtering this out returns the same thing. Neither is an error worth
     raising — the panel asks "can I publish?", and both answers are no. */
  if (error || !data?.value) return null;
  return data.value;
}

/** Set or clear it. Super admins only; the policy refuses everyone else. */
export async function setBuildHook(url: string) {
  if (!supabase) throw new Error("The database is not configured.");

  const trimmed = url.trim();
  if (trimmed && !BUILD_HOOK_PATTERN.test(trimmed)) {
    throw new Error(
      "That is not a Netlify build hook. It looks like https://api.netlify.com/build_hooks/… — copy it from Site configuration → Build & deploy → Build hooks.",
    );
  }

  const { data, error } = await supabase
    .from("settings")
    .upsert({ key: BUILD_HOOK_KEY, value: trimmed || null })
    .select("key");

  if (error) throw new Error(error.message);
  /* A policy refusal is no error and no rows — the same shape that bit the
     content repository and the enquiries list. */
  if (!data || data.length === 0) {
    throw new Error("That did not save. Only a super admin can change this.");
  }
}

/**
 * Start a deploy.
 *
 * `no-cors` because the build hook sends no CORS headers: a normal fetch
 * reaches Netlify and starts the build, then the browser refuses to let this
 * page read the reply, and the whole thing fails in the console having already
 * worked. The opaque response is the honest version — the request is sent, and
 * whether Netlify accepted it is not something this page can know.
 *
 * So success here means "asked", not "deployed". The button says so.
 */
export async function triggerDeploy(hook: string) {
  await fetch(hook, {
    method: "POST",
    mode: "no-cors",
    /* Netlify reads this as the reason in its deploy log, which is the
       difference between a mystery build and an obvious one. */
    body: JSON.stringify({ trigger_title: "Published from the admin panel" }),
  });
}
