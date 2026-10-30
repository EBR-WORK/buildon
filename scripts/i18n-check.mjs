/**
 * Is there English left on a translated page?
 *
 *   npm run i18n:check            report every page with Latin script left
 *   npm run i18n:check -- --strict exit 1 if there is any
 *
 * Runs over out/, after a build. The translator's own counters say how many
 * strings were REPLACED, which is a different question: a string replaced with
 * a translation that still carries English words counts as a success there and
 * is exactly the failure a reader sees.
 *
 * So this reads the finished pages the way a reader does and looks for Latin
 * letters. Anything it finds is either a name that belongs in Latin script —
 * the DO_NOT_TRANSLATE list, a unit, an email — or a string the translator let
 * through, and the two are easy to tell apart once they are side by side.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { collect } from "./lib/html-text.mjs";
import { latinLeftIn, LOCALE_NAMES, LOCALES } from "./lib/translate.mjs";

const OUT = "out";
const strict = process.argv.includes("--strict");
const verbose = process.argv.includes("--all");

/* What counts as a leak lives next to the DO_NOT_TRANSLATE list it is derived
   from, in lib/translate.mjs, because the translator's --stale flag asks the
   same question of the cache that this asks of the pages. One definition, so a
   name added there is exempt in both places by the same edit. */

/** Every .html page of a tree, as paths relative to out/. */
function pagesIn(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) pagesIn(full, found);
    else if (entry.endsWith(".html")) found.push(full);
  }
  return found;
}

let findings = 0;
let clean = 0;

for (const locale of LOCALES) {
  const root = join(OUT, locale);
  /* The home page sits beside the directory, not in it: out/mr.html. */
  const pages = [...pagesIn(root), `${root}.html`].filter((page) => existsSync(page));

  console.log(`\n   ${LOCALE_NAMES[locale]}  ${pages.length} pages\n`);

  for (const page of pages) {
    const offenders = new Map();

    for (const text of collect(readFileSync(page, "utf8"))) {
      const words = latinLeftIn(text);
      if (words.length) offenders.set(text, words);
    }

    if (offenders.size === 0) {
      clean += 1;
      if (verbose) console.log(`   ok    ${page}`);
      continue;
    }

    findings += offenders.size;
    console.log(`   ${String(offenders.size).padStart(4)}  ${page}`);

    /* Three examples, because the point is to show WHAT is leaking, and the
       fourth tells you nothing the third did not. --all prints every one. */
    const shown = verbose ? [...offenders] : [...offenders].slice(0, 3);
    for (const [text, words] of shown) {
      console.log(`         ${text.length > 90 ? text.slice(0, 90) + "…" : text}`);
      console.log(`         ^ ${[...new Set(words)].join(", ")}`);
    }
  }
}

console.log("");
if (findings === 0) {
  console.log(`   No English left. ${clean} pages checked.\n`);
} else {
  console.log(`   ${findings} strings with English in them, across ${LOCALES.length} languages.`);
  console.log(`   ${clean} pages are clean.\n`);
  console.log("   A name that belongs in English goes in DO_NOT_TRANSLATE in");
  console.log("   scripts/lib/translate.mjs, which exempts it here too. Anything");
  console.log("   else needs re-sending: npm run i18n:pages -- --again\n");
}

process.exit(strict && findings > 0 ? 1 : 0);
