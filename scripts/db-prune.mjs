/**
 * Find uploaded files nothing points at any more.
 *
 *   npm run db:prune              list them
 *   npm run db:prune -- --delete  remove the ones nothing references
 *
 * Uploads are never deleted automatically. The panel used to remove the old
 * file as soon as a field was pointed at a new one, which deleted it before
 * the new URL had been saved — upload twice without saving in between and the
 * stored content referenced a file that was already gone. So files accumulate
 * on purpose now, and this is the deliberate, reviewable way to clear them.
 *
 * Three categories, because "unused" is not one thing:
 *
 *   in use     a current content row points at it. Never touched.
 *   in history only an older version in content_versions points at it. Kept
 *              unless --include-history, because that is what a rollback would
 *              need — deleting them turns "undo" into a page of broken images.
 *   orphaned   nothing at all points at it. Safe.
 */

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
const FOLDERS = ["video", "uploads", "blog", "products", "projects", "career", "brand"];

const doDelete = process.argv.includes("--delete");
const includeHistory = process.argv.includes("--include-history");

/* ------------------------------------------------------------ environment */

if (!existsSync(".env.local")) {
  console.error("x  .env.local not found.");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (match) env[match[1]] = match[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const looksMock = (value) => !value || /mock|replace-me/i.test(value);

if (looksMock(url) || looksMock(secret)) {
  console.error("x  The URL and the secret key must both be set in .env.local.");
  console.error("   Listing the bucket and deleting from it both need the secret key.");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ------------------------------------------------------------- references */

/** Every bucket path mentioned anywhere in a value, however deeply nested. */
function pathsIn(value, found = new Set()) {
  if (typeof value === "string") {
    /* Matches the public URL shape and nothing else, so a path in public/ or
       an external link is never mistaken for one of ours. */
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    let at = value.indexOf(marker);
    while (at !== -1) {
      const rest = value.slice(at + marker.length).split(/["'\s)]/)[0];
      if (rest) found.add(decodeURIComponent(rest.split("?")[0]));
      at = value.indexOf(marker, at + 1);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) pathsIn(item, found);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) pathsIn(item, found);
  }
  return found;
}

const { data: rows, error: rowsError } = await supabase.from("content").select("data");
if (rowsError) {
  console.error(`x  Could not read content — ${rowsError.message}`);
  process.exit(1);
}

const inUse = new Set();
for (const row of rows) pathsIn(row.data, inUse);

const { data: versions } = await supabase.from("content_versions").select("data");
const inHistory = new Set();
for (const row of versions ?? []) pathsIn(row.data, inHistory);
for (const path of inUse) inHistory.delete(path);

/* ----------------------------------------------------------------- bucket */

const files = [];
for (const folder of FOLDERS) {
  const { data } = await supabase.storage.from(BUCKET).list(folder, { limit: 1000 });
  for (const file of data ?? []) {
    /* list() returns folder placeholders too; a real file has metadata. */
    if (!file.metadata) continue;
    files.push({ path: `${folder}/${file.name}`, bytes: file.metadata.size ?? 0 });
  }
}

const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;
const used = files.filter((f) => inUse.has(f.path));
const historic = files.filter((f) => !inUse.has(f.path) && inHistory.has(f.path));
const orphans = files.filter((f) => !inUse.has(f.path) && !inHistory.has(f.path));
const total = (list) => list.reduce((sum, f) => sum + f.bytes, 0);

console.log(`Bucket "${BUCKET}" — ${files.length} files, ${mb(total(files))}\n`);
console.log(`  in use     ${String(used.length).padStart(3)}  ${mb(total(used))}`);
console.log(`  in history ${String(historic.length).padStart(3)}  ${mb(total(historic))}  (a rollback would need these)`);
console.log(`  orphaned   ${String(orphans.length).padStart(3)}  ${mb(total(orphans))}`);

const removable = includeHistory ? [...orphans, ...historic] : orphans;

if (removable.length > 0) {
  console.log(`\n${includeHistory ? "Orphaned and historic" : "Orphaned"}:\n`);
  for (const file of removable.sort((a, b) => b.bytes - a.bytes)) {
    console.log(`  ${mb(file.bytes).padStart(9)}  ${file.path}`);
  }
}

if (!doDelete) {
  console.log(
    removable.length === 0
      ? "\nNothing to remove."
      : `\nNothing was deleted. Re-run with --delete to remove ${removable.length} file(s)` +
          `${includeHistory ? "" : ", or --include-history --delete to take the historic ones too"}.`,
  );
} else if (removable.length === 0) {
  console.log("\nNothing to remove.");
} else {
  /* In batches: the API caps how many paths one call may carry, and a single
     failure in a list of two hundred tells you nothing about the rest. */
  let removed = 0;
  for (let i = 0; i < removable.length; i += 50) {
    const batch = removable.slice(i, i + 50).map((f) => f.path);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) {
      console.error(`\nx  Failed on a batch of ${batch.length} — ${error.message}`);
      process.exitCode = 1;
      break;
    }
    removed += batch.length;
  }
  console.log(`\nRemoved ${removed} file(s), freeing ${mb(total(removable))}.`);
}
