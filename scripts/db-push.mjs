/**
 * Push the repo's content into Supabase.
 *
 *   npm run db:push            # only fills sections that are missing
 *   npm run db:push -- --force # overwrite what is there
 *
 * The source of truth is `defaults` in src/lib/cms/schema.ts — the same object
 * the admin panel starts from — so the database begins life holding exactly
 * what the site already renders. The TypeScript is loaded through jiti rather
 * than duplicated as JSON, because a second copy would drift the first time
 * somebody edited one and not the other.
 *
 * Safe by default. A plain run never touches a section that already has a row:
 * once editors are working in the panel, re-running this to "set things up"
 * must not quietly revert their work. --force is the way to say otherwise, and
 * the trigger in 0001_content.sql keeps the replaced version either way.
 *
 * This needs the SECRET key, not the publishable one. Seeding happens with no
 * user signed in, and the write policy requires `authenticated`.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createJiti } from "jiti";

const force = process.argv.includes("--force");

/* ------------------------------------------------------------ environment */

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
/* Supabase renamed this: new projects issue `sb_secret_…`, older ones a JWT
   service role key. Either is accepted. */
const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

const looksMock = (value) => !value || /mock|replace-me/i.test(value);

if (looksMock(url)) {
  console.error("x  NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder.");
  process.exit(1);
}

if (looksMock(secret)) {
  console.error("x  SUPABASE_SECRET_KEY is missing or still a placeholder.\n");
  console.error("   Seeding runs with nobody signed in, and the write policy requires");
  console.error("   an authenticated user, so the publishable key cannot do it.");
  console.error("   Dashboard -> Project Settings -> API keys -> secret key.");
  process.exit(1);
}

/* ---------------------------------------------------------------- content */

const jiti = createJiti(import.meta.url, { alias: { "@": path.resolve("src") } });
const { defaults } = await jiti.import(path.resolve("src/lib/cms/schema.ts"));

/* One row per section, which is also how the admin saves. */
const rows = [
  ["home", defaults.home],
  ["products", defaults.products],
  ["projects", defaults.projects],
  ["blog", defaults.blog],
  ["faq", defaults.faq],
  ["career", defaults.career],
];

/* ------------------------------------------------------------------ push */

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existingRows, error: readError } = await supabase.from("content").select("key");

if (readError) {
  if (/find the table/i.test(readError.message)) {
    console.error("x  The `content` table does not exist yet.\n");
    console.error("   Apply supabase/migrations/0001_content.sql first — paste it into");
    console.error("   the dashboard SQL editor, or run `npm run db:migrate`.");
    process.exit(1);
  }
  console.error(`x  Could not read the table — ${readError.message}`);
  process.exit(1);
}

const existing = new Set(existingRows.map((row) => row.key));

console.log(`Pushing to ${url}`);
console.log(force ? "Mode: force (overwrites existing rows)\n" : "Mode: fill gaps only\n");

let written = 0;
let skipped = 0;

for (const [key, data] of rows) {
  if (existing.has(key) && !force) {
    console.log(`  ${key.padEnd(9)} skipped (already there)`);
    skipped += 1;
    continue;
  }

  const { error } = await supabase.from("content").upsert({ key, data }, { onConflict: "key" });

  if (error) {
    console.error(`  ${key.padEnd(9)} FAILED — ${error.message}`);
    process.exit(1);
  }

  const size = Buffer.byteLength(JSON.stringify(data));
  console.log(`  ${key.padEnd(9)} written (${(size / 1024).toFixed(1)} KB)`);
  written += 1;
}

console.log(`\nDone. ${written} written, ${skipped} left alone.`);
if (skipped > 0 && !force) {
  console.log("Re-run with `npm run db:push -- --force` to overwrite the rest.");
}
