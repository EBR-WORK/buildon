/**
 * The Supabase client.
 *
 * One module so there is one client per browser tab. createClient opens its own
 * auth listener and realtime socket, so calling it per component would stack up
 * duplicates and make the session state disagree with itself.
 *
 * Keys: NEXT_PUBLIC_ values are inlined into the client bundle and are public by
 * design. That is safe only because row level security decides what the
 * publishable key may read and write — the key is an identifier, not a
 * permission. The secret key never appears here; it belongs to the build.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

/* Supabase renamed these: new projects issue `sb_publishable_…`, older ones a
   JWT `anon` key. Both are read so the app works either way. */
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False when the env vars are absent, which is the normal state before setup. */
export const isSupabaseConfigured = Boolean(url && publishableKey);

/**
 * Null rather than a throw when unconfigured.
 *
 * The admin panel still has to render — to say the database is not connected —
 * and `next build` imports these modules whether or not the env file exists. A
 * throw at module scope would take the build down instead of the one screen
 * that needs the database.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, publishableKey as string, {
      auth: {
        /* The admin is a browser app: keep the session across reloads and
           refresh it before it expires, so an editor mid-sentence is not
           logged out. */
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "buildon.cms.auth",
      },
    })
  : null;

/** For call sites that cannot proceed without it, so the check is in one place. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart the dev server.",
    );
  }
  return supabase;
}
