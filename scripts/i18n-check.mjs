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
import { DO_NOT_TRANSLATE, LOCALE_NAMES, LOCALES } from "./lib/translate.mjs";

const OUT = "out";
const strict = process.argv.includes("--strict");
const verbose = process.argv.includes("--all");

/**
 * Latin script that is not a translation failure.
 *
 * The product names come from the list the translator is given, so the two
 * cannot drift: adding a product there exempts it here by the same edit.
 *
 * The rest are things no language translates. Units are written in Latin on an
 * Indian site whatever the surrounding script — a builder reads 12 mm, not
 * १२ मिमी — and an address, an email and a phone number are not prose.
 */
const UNITS = [
  "mm", "cm", "m", "sq", "ft", "kg", "g", "ml", "l", "hrs", "hr", "min",
  "am", "pm", "ac", "ph", "no", "nos",
];

const ALLOWED = new Set(
  [...DO_NOT_TRANSLATE.flatMap((term) => term.split(/[\s-]+/)), ...UNITS]
    .map((word) => word.toLowerCase())
    .filter(Boolean),
);

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

/**
 * The Latin words in a string that should not be there.
 *
 * Whole strings go first: an email, a URL or a filename is Latin from end to
 * end and reporting its every word as untranslated is noise, not a finding.
 */
function englishIn(text) {
  if (/^[^\s@]+@[^\s@]+$/.test(text)) return [];
  if (/^(https?:|www\.|\/)/.test(text)) return [];
  if (/^[A-Za-z0-9._-]+\.[a-z]{2,5}$/.test(text)) return [];

  return [...text.matchAll(/[A-Za-z][A-Za-z'’]*/g)]
    .map((match) => match[0])
    /* A lone letter is a bullet, an initial or a size — never a word. */
    .filter((word) => word.length > 1)
    .filter((word) => !ALLOWED.has(word.toLowerCase()));
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
      const words = englishIn(text);
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
