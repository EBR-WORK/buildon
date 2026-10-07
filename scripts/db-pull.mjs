/**
 * Pull published content out of Supabase into content/*.json, once.
 *
 *   npm run db:pull
 *   npm run db:pull -- --soft    warn instead of failing
 *
 * The --soft form is what `npm run build` uses: a database that is briefly
 * unreachable should not fail a deploy, because the last good files are still
 * on disk and the site builds from those.
 *
 * To see edits appear on localhost without running this by hand, use
 * `npm run db:watch` instead — or just run `npm run dev`, which starts a
 * watcher alongside it.
 */

import { pull } from "./lib/pull.mjs";

const soft = process.argv.includes("--soft");

const { ok, reason, written } = await pull({ log: (line) => console.log(line) });

if (!ok) {
  if (soft) {
    console.warn(`!  ${reason}`);
    console.warn("   Building from the files already in content/.");
  } else {
    console.error(`x  ${reason}`);
    process.exitCode = 1;
  }
} else {
  console.log(
    written.length === 0
      ? "Up to date — nothing changed."
      : `\n${written.length} file(s) updated. Commit them to publish.`,
  );
}
