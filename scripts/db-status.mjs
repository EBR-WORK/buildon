/**
 * Do the committed files still say what the database says?
 *
 *   npm run db:status
 *
 * The site is a static export, so the build reads content/*.json rather than
 * querying Supabase per request. Those files are written by `npm run db:pull`
 * and committed, which is what gives a content change a diff to review and a
 * commit to revert.
 *
 * The risk that buys is drift: an editor saves, nobody pulls, and the repo
 * quietly describes a version of the site that no longer exists. Nothing
 * breaks — which is exactly why it goes unnoticed. This says so.
 */

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { readEnv, SECTIONS } from "./lib/pull.mjs";

const { url, key, configured } = readEnv();

if (!configured) {
  console.error("x  Supabase is not configured, so there is nothing to compare against.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.from("content").select("key, data, updated_at");

if (error) {
  console.error(`x  Could not read the database — ${error.message}`);
  process.exit(1);
}

/** Key order is not content: Postgres normalises it, a file preserves it. */
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, stable(value[k])]),
    );
  }
  return value;
}

const ago = (iso) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
};

let behind = 0;
let missing = 0;

console.log("Committed files against the database:\n");

for (const section of SECTIONS) {
  const row = data.find((entry) => entry.key === section);
  const file = `content/${section}.json`;

  if (!row) {
    console.log(`  no row     ${section.padEnd(9)}  the database has nothing for this section`);
    missing += 1;
    continue;
  }

  if (!existsSync(file)) {
    console.log(`  MISSING    ${section.padEnd(9)}  ${file} does not exist`);
    missing += 1;
    continue;
  }

  const onDisk = JSON.parse(readFileSync(file, "utf8"));
  const same = JSON.stringify(stable(onDisk)) === JSON.stringify(stable(row.data));

  if (same) {
    console.log(`  current    ${section.padEnd(9)}  saved ${ago(row.updated_at)}`);
  } else {
    console.log(`  BEHIND     ${section.padEnd(9)}  database changed ${ago(row.updated_at)}`);
    behind += 1;
  }
}

if (behind === 0 && missing === 0) {
  console.log("\nEverything a build would read matches the database.");
} else {
  console.log(
    `\n${behind + missing} section(s) out of step. Run \`npm run db:pull\` and commit the result,` +
      "\notherwise a deploy from this checkout ships content the database no longer has.",
  );
  process.exitCode = 1;
}
