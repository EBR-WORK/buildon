/**
 * Read published content out of Supabase and into content/*.json.
 *
 * Shared by `npm run db:pull` (once) and `npm run db:watch` (on a loop), so the
 * two cannot disagree about what a pull is.
 *
 * Why files at all, rather than the pages querying Supabase while they render:
 * the site is a static export, so the build is the only moment content can be
 * read. Keeping that moment as a file write buys three things — a build cannot
 * fail because the database blinked, a deploy is reviewable in a pull request
 * and revertible with git, and the project still builds with no credentials.
 *
 * The files are also an import in the module graph, which is what makes the dev
 * server notice: rewriting one while `next dev` is running hot-reloads the page
 * without a rebuild.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const OUT = "content";
export const SECTIONS = ["home", "products", "projects", "blog", "faq", "career"];

const looksMock = (value) => !value || /mock|replace-me/i.test(value);

/** Credentials from .env.local, or from the real environment on a CI build. */
export function readEnv() {
  const env = {};
  if (existsSync(".env.local")) {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (match) env[match[1]] = match[2].trim();
    }
  }

  /* On Netlify there is no .env.local — the values come from the build
     environment, which wins where both exist. */
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key, configured: !looksMock(url) && !looksMock(key) };
}

/**
 * Write every section whose content has changed.
 *
 * Returns the names written, or null when it could not read at all — the
 * caller decides whether that is fatal. Unchanged files are left alone so a
 * pull that changes nothing keeps the working tree clean and `git status`
 * stays meaningful.
 */
export async function pull({ log = () => {} } = {}) {
  const { url, key, configured } = readEnv();
  if (!configured) return { ok: false, reason: "Supabase is not configured.", written: [] };

  /* The publishable key is deliberate: content is public-read, so a build needs
     no privileged credential and nothing secret has to reach CI. */
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.from("content").select("key, data");

  if (error) return { ok: false, reason: `Could not read content — ${error.message}`, written: [] };
  if (!data || data.length === 0) {
    return { ok: false, reason: "The content table is empty. Run `npm run db:push` first.", written: [] };
  }

  mkdirSync(OUT, { recursive: true });
  const written = [];

  for (const section of SECTIONS) {
    const row = data.find((entry) => entry.key === section);
    if (!row) {
      log(`!  ${section.padEnd(9)} no row — the site will use what it ships with`);
      continue;
    }

    const file = path.join(OUT, `${section}.json`);
    const body = JSON.stringify(row.data, null, 2) + "\n";
    const before = existsSync(file) ? readFileSync(file, "utf8") : null;

    if (before === body) continue;

    writeFileSync(file, body);
    written.push(section);
    log(`   ${section.padEnd(9)} written (${(Buffer.byteLength(body) / 1024).toFixed(1)} KB)`);
  }

  return { ok: true, written };
}
