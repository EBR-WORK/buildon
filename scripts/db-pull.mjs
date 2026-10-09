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
    /* Loud, because the failure is silent by nature: the build carries on, the
       deploy succeeds, and the site serves whatever content was last committed.
       An editor who saved an hour ago sees their change simply not appear, with
       a green deploy and nothing anywhere to explain it. */
    console.warn("");
    console.warn("  ==================================================================");
    console.warn("   CONTENT NOT PULLED FROM THE DATABASE");
    console.warn("");
    console.warn(`   ${reason}`);
    console.warn("");
    console.warn("   Building from the committed files in content/ instead. Anything");
    console.warn("   saved in the admin panel since those were committed will NOT be");
    console.warn("   on the deployed site.");
    console.warn("  ==================================================================");
    console.warn("");
  } else {
    console.error(`x  ${reason}`);
    process.exitCode = 1;
  }
} else if (soft) {
  /* Said on every build, so the log always answers "where did this content
     come from" without anyone having to infer it from silence. */
  console.log(
    written.length === 0
      ? "   content: read from the database, already matching"
      : `   content: ${written.length} section(s) refreshed from the database`,
  );
} else {
  console.log(
    written.length === 0
      ? "Up to date — nothing changed."
      : `\n${written.length} file(s) updated. Commit them to publish.`,
  );
}
