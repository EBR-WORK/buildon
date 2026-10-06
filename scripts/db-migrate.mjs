/**
 * Apply supabase/migrations/*.sql to the project.
 *
 *   npm run db:migrate
 *
 * Creating tables is DDL, and PostgREST — the API behind the publishable and
 * secret keys — does not do DDL at all. So this needs a direct database
 * connection, which is a different credential: SUPABASE_DB_URL, the connection
 * string under Project Settings -> Database.
 *
 * Without it the script prints the SQL path and stops, because the dashboard
 * SQL editor is the zero-setup way to run this and is no worse for a migration
 * applied once.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const DIR = "supabase/migrations";

if (!existsSync(DIR)) {
  console.error(`x  ${DIR} not found.`);
  process.exit(1);
}

const files = readdirSync(DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error(`x  No .sql files in ${DIR}.`);
  process.exit(1);
}

const env = {};
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match) env[match[1]] = match[2].trim();
  }
}

const dbUrl = env.SUPABASE_DB_URL;
const looksMock = (value) => !value || /mock|replace-me|\[YOUR-PASSWORD\]/i.test(value);

if (looksMock(dbUrl)) {
  console.log("SUPABASE_DB_URL is not set, so nothing was applied.\n");
  console.log("Two ways to run it:\n");
  console.log("  1. Dashboard — SQL Editor, paste, Run. Nothing to install:");
  for (const file of files) console.log(`       ${path.join(DIR, file)}`);
  console.log("\n  2. From here — put the connection string in .env.local as");
  console.log("     SUPABASE_DB_URL (Project Settings -> Database -> Connection");
  console.log("     string -> URI, with your database password filled in), then");
  console.log("     re-run `npm run db:migrate`.\n");
  console.log("Either way, `npm run db:check` afterwards confirms the table is there.");
  process.exit(0);
}

console.log(`Applying ${files.length} migration(s) via the Supabase CLI…\n`);

/* The CLI is run through npx rather than added as a dependency: it is a large
   binary used twice, and never at build time. */
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["--yes", "supabase", "db", "push", "--db-url", dbUrl],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  console.error("\nx  The migration did not apply. The SQL editor route above always works.");
  process.exit(result.status ?? 1);
}

console.log("\nDone. Run `npm run db:check` to confirm.");
