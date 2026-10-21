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

/**
 * Any host's build hook, not just Netlify's.
 *
 * This used to demand `https://api.netlify.com/build_hooks/…` exactly, which
 * meant the site could not be moved without a code change — the panel would
 * refuse the new host's URL and Publish would simply stop working. Nothing
 * else here is Netlify-specific: the site is a folder of HTML files, and every
 * host that builds from a repository offers the same thing under its own name
 * (Deploy Hook, Build Hook, Build Trigger).
 *
 * So the rule is only what has to be true: an https URL. http is refused
 * because the hook is a credential — anyone who sees it can trigger builds —
 * and sending it in clear is how it stops being secret.
 */
export const BUILD_HOOK_PATTERN = /^https:\/\/[^\s]+$/;

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
      "That is not a build hook URL. It must start with https:// — on Netlify copy it from Site configuration → Build & deploy → Build hooks; other hosts call it a Deploy Hook or Build Trigger.",
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
