/**
 * Is the database reachable, and is the schema there?
 *
 *   npm run db:check
 *
 * Run it after editing .env.local, after creating a table, or whenever the
 * admin panel says it cannot reach the database and you want to know whether
 * the problem is the keys, the project or the schema.
 *
 * It reads .env.local directly rather than relying on Next, so it works from a
 * plain terminal with no dev server running.
 */

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const TABLES = ["content"];

/* --- environment ---------------------------------------------------------- */

if (!existsSync(".env.local")) {
  console.error("x  .env.local not found. Copy .env.example to .env.local first.");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (match) env[match[1]] = match[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* A value still carrying its placeholder is worth catching here: it fails
   later with a confusing network error instead of an obvious one. */
const looksMock = (value) => !value || /mock|replace-me/i.test(value);

console.log("Supabase\n");
console.log("  url  ", url || "(not set)");
console.log("  key  ", key ? `${key.slice(0, 18)}… (${key.length} chars)` : "(not set)");
console.log();

if (looksMock(url) || looksMock(key)) {
  console.error("x  URL or key is missing or still a placeholder. Edit .env.local.");
  process.exit(1);
}

/* --- the project ---------------------------------------------------------- */

/* Deliberately not /rest/v1/: that endpoint is restricted to secret keys, so a
   401 there would say nothing about whether the publishable key is good. */
try {
  const response = await fetch(`${url}/auth/v1/health`, { signal: AbortSignal.timeout(10_000) });
  console.log(`  project    reachable (${response.status})`);
} catch (error) {
  console.error(`x  project    unreachable — ${error.message}`);
  console.error("   A paused free project also looks like this. Check the dashboard.");
  process.exit(1);
}

/* --- the key and the schema ----------------------------------------------- */

const supabase = createClient(url, key);
let missing = 0;

for (const table of TABLES) {
  /* A plain GET, deliberately not { head: true }. PostgREST answers a HEAD
     request for a missing table with 204 and an empty body, which the client
     reports as error: null -- so a head request makes a missing table look
     like an empty one. A GET returns the real 404. */
  const { error } = await supabase.from(table).select("*").limit(1);

  if (!error) {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    console.log(`  ${table.padEnd(10)} readable, ${count ?? 0} row(s)`);
    continue;
  }

  /* PGRST205 is returned only after the key has been accepted: PostgREST
     authenticated the request, then failed to find the table. So it confirms
     the connection at the same time as it reports the missing schema. */
  if (error.code === "PGRST205" || /find the table/i.test(error.message)) {
    console.log(`  ${table.padEnd(10)} NOT CREATED (key works — table does not exist yet)`);
    missing += 1;
    continue;
  }

  if (/invalid api key|JWT/i.test(error.message)) {
    console.error(`x  key rejected — ${error.message}`);
    process.exit(1);
  }

  /* Anything else is usually row level security refusing the read, which still
     means the connection itself is fine. */
  console.log(`  ${table.padEnd(10)} ${error.code ?? "?"} — ${error.message}`);
  missing += 1;
}

/* --- the Edge Function ----------------------------------------------------
   Creating a login needs the service role key, which cannot be in a browser,
   so the panel calls this instead. Without it the Team screen can still
   invite; it just cannot create an account outright. */
let functionReady = false;
try {
  const response = await fetch(`${url}/functions/v1/create-admin`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(10_000),
  });
  /* 401 is the healthy answer to a call with no user token: the function is
     there and refused us. 404 means it was never deployed. */
  functionReady = response.status !== 404;
  console.log(
    `  create-admin  ${functionReady ? `deployed (${response.status} to an unauthenticated call)` : "NOT DEPLOYED"}`,
  );
} catch {
  console.log("  create-admin  could not be reached");
}

console.log();
if (missing > 0) {
  console.log(`Connected, but ${missing} table(s) still to create.`);
} else if (!functionReady) {
  console.log("OK  connected, schema present.");
  console.log("    Accounts cannot be created from the panel until create-admin is");
  console.log("    deployed. Inviting works either way.");
} else {
  console.log("OK  connected, schema present, functions deployed.");
}
