/**
 * Pull published content out of Supabase into content/*.json.
 *
 *   npm run db:pull
 *
 * This is what makes an edit in the admin panel appear on the site. The site
 * is a static export: there is no request at which it could ask the database
 * anything, so the build is the only moment content can be read, and these
 * files are what it reads.
 *
 * Why files rather than having the pages query Supabase during `next build`:
 *
 *   - A build must not fail because a database was briefly unreachable. If the
 *     pull fails, the last good files are still on disk and the build is fine.
 *   - The files are committed, so a deploy is reviewable in a pull request and
 *     revertible with git. A row in a table is neither.
 *   - It stays possible to build with no credentials at all.
 *
 * Wired into `npm run build`, where a failure is a warning rather than an
 * error — see the --soft flag.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const soft = process.argv.includes("--soft");
const OUT = "content";
const SECTIONS = ["home", "products", "projects", "blog", "faq", "career"];

/** A failure that should not stop a build. */
function give_up(message) {
  if (soft) {
    console.warn(`!  ${message}`);
    console.warn("   Building from the files already in content/.");
    process.exitCode = 0;
  } else {
    console.error(`x  ${message}`);
    process.exitCode = 1;
  }
}

const env = {};
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match) env[match[1]] = match[2].trim();
  }
}

/* On Netlify there is no .env.local — the values come from the build
   environment, so both are read, with the real environment winning. */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const looksMock = (value) => !value || /mock|replace-me/i.test(value);

if (looksMock(url) || looksMock(key)) {
  give_up("Supabase is not configured.");
} else {
  /* The publishable key is deliberate: the content policy allows anyone to
     read, so a build needs no privileged credential. Nothing secret belongs in
     a CI environment that does not need it. */
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.from("content").select("key, data, updated_at");

  if (error) {
    give_up(`Could not read content — ${error.message}`);
  } else if (!data || data.length === 0) {
    give_up("The content table is empty. Run `npm run db:push` first.");
  } else {
    mkdirSync(OUT, { recursive: true });

    let written = 0;
    for (const section of SECTIONS) {
      const row = data.find((entry) => entry.key === section);
      if (!row) {
        console.warn(`!  ${section.padEnd(9)} no row — the site will use what it ships with`);
        continue;
      }

      const file = path.join(OUT, `${section}.json`);
      const body = JSON.stringify(row.data, null, 2) + "\n";

      /* Only written when it differs, so a pull that changes nothing leaves
         the working tree clean and `git status` stays meaningful. */
      const before = existsSync(file) ? readFileSync(file, "utf8") : null;
      if (before === body) {
        console.log(`   ${section.padEnd(9)} unchanged`);
        continue;
      }

      writeFileSync(file, body);
      const kb = (Buffer.byteLength(body) / 1024).toFixed(1);
      console.log(`   ${section.padEnd(9)} written (${kb} KB)`);
      written += 1;
    }

    console.log(
      written === 0
        ? "\nUp to date — nothing changed."
        : `\n${written} file(s) updated. Commit them to publish.`,
    );
  }
}
