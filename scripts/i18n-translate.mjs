/**
 * Fill the translation cache from the English content.
 *
 *   npm run i18n:translate            translate whatever is missing
 *   npm run i18n:translate -- --dry   count it and cost it, send nothing
 *   npm run i18n:translate -- --only home   one section
 *   npm run i18n:translate -- --soft  warn instead of failing (the build uses this)
 *
 * Editors only ever write English. This reads what they wrote, finds the
 * strings no language has yet, and asks the provider for those and nothing
 * else — the cache is keyed by a hash of the English, so an unchanged sentence
 * is never sent twice however many times this runs.
 *
 * It does not touch a string an editor has corrected: `reviewed` rows are left
 * exactly as they are.
 */

import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  hashOf,
  LOCALES,
  LOCALE_NAMES,
  readProvider,
  translatable,
  translateBatch,
} from "./lib/translate.mjs";
import { SECTIONS } from "./lib/pull.mjs";

const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const soft = argv.includes("--soft");
/* undefined unless --only is actually present: indexOf returns -1 when it is
   not, and argv[0] is then whatever flag came first. */
const onlyAt = argv.indexOf("--only");
const only = onlyAt === -1 ? undefined : argv[onlyAt + 1];

/** How many strings go in one request. Small enough to retry cheaply. */
const BATCH = 40;

/* ------------------------------------------------------------ environment */

const env = {};
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match) env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}
/* Netlify has no .env.local; there the values are in the build environment. */
for (const key of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "AZURE_TRANSLATOR_KEY",
  "AZURE_TRANSLATOR_REGION",
]) {
  if (process.env[key]) env[key] = process.env[key];
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const writeKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

function stop(message) {
  if (soft) {
    console.warn("");
    console.warn("  ================================================================");
    console.warn("   TRANSLATIONS NOT UPDATED");
    console.warn("");
    console.warn(`   ${message}`);
    console.warn("");
    console.warn("   The build carries on. Pages in Marathi and Hindi fall back to");
    console.warn("   English for anything not already in the cache.");
    console.warn("  ================================================================");
    console.warn("");
    process.exit(0);
  }
  console.error(`x  ${message}`);
  process.exit(1);
}

/* ------------------------------------------------------ collect the strings */

/** Every translatable string in a value, in document order, deduplicated. */
function stringsIn(value, found = new Map()) {
  if (typeof value === "string") {
    if (translatable(value)) found.set(value, (found.get(value) ?? 0) + 1);
  } else if (Array.isArray(value)) {
    for (const item of value) stringsIn(item, found);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      /* Keys that are never prose, whatever they contain. A slug translated is
         a URL that 404s; an image path translated is a broken picture. */
      if (/^(id|slug|href|src|image|video|poster|icon|url|path|key|type|kind|date|published|modified|live|alt)$/i.test(key)) {
        continue;
      }
      stringsIn(item, found);
    }
  }
  return found;
}

const sections = only ? [only] : SECTIONS;
const sources = new Map();

for (const section of sections) {
  const file = `content/${section}.json`;
  if (!existsSync(file)) {
    console.warn(`   skipped ${section}: ${file} is not there. Run npm run db:pull first.`);
    continue;
  }
  const data = JSON.parse(readFileSync(file, "utf8"));
  const found = stringsIn(data);
  console.log(`   ${section.padEnd(9)} ${String(found.size).padStart(5)} strings`);
  for (const text of found.keys()) sources.set(text, hashOf(text));
}

if (sources.size === 0) stop("Nothing to translate. Is content/ populated?");

const characters = [...sources.keys()].reduce((sum, text) => sum + text.length, 0);
console.log(
  `\n   ${sources.size.toLocaleString()} unique strings, ${characters.toLocaleString()} characters` +
    `, x ${LOCALES.length} languages\n`,
);

/* ------------------------------------------------------------- what is new */

if (!url || !writeKey) stop("Supabase is not configured, so there is nowhere to cache translations.");

const supabase = createClient(url, writeKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: cached, error } = await supabase
  .from("translations")
  .select("source_hash, locale")
  .in("locale", LOCALES);

const noTable = error && /schema cache|does not exist/i.test(error.message);

if (error && !(noTable && dry)) {
  stop(
    noTable
      ? "The translations table is not there yet. Run supabase/migrations/0008_translations.sql."
      : `Could not read the cache — ${error.message}`,
  );
}

/* --dry still answers with no table: "what would this cost" is the question
   asked before deciding to create one. */
if (noTable) console.log("   (no cache table yet, so everything counts as new)");

const have = new Set((cached ?? []).map((row) => `${row.locale}:${row.source_hash}`));

const todo = [];
for (const locale of LOCALES) {
  for (const [text, hash] of sources) {
    if (!have.has(`${locale}:${hash}`)) todo.push({ locale, text, hash });
  }
}

const newCharacters = todo.reduce((sum, item) => sum + item.text.length, 0);

console.log(`   cached   ${have.size.toLocaleString()}`);
console.log(`   to send  ${todo.length.toLocaleString()} (${newCharacters.toLocaleString()} characters)`);

if (todo.length === 0) {
  console.log("\n   Everything is already translated. Nothing sent.\n");
  process.exit(0);
}

if (dry) {
  /* Gemini Flash, at its published rate, rounded up. Said out loud because
     "it will cost about this" is the question anyone asks before the first
     run, and the answer is usually surprisingly small. */
  console.log(`\n   --dry: nothing sent. That would be roughly $${(newCharacters / 4 / 1_000_000 * 0.4).toFixed(2)} on Gemini Flash.\n`);
  process.exit(0);
}

/* ------------------------------------------------------------- translate */

const provider = readProvider(env);
if (!provider.name) stop(provider.reason);

console.log(`\n   provider: ${provider.name}\n`);

let done = 0;
let failed = 0;

for (const locale of LOCALES) {
  const queue = todo.filter((item) => item.locale === locale);
  if (queue.length === 0) continue;

  for (let i = 0; i < queue.length; i += BATCH) {
    const batch = queue.slice(i, i + BATCH);

    let out;
    try {
      out = await translateBatch(batch.map((item) => item.text), locale, provider);
    } catch (e) {
      /* One batch, not the run. Forty strings missing from the cache render in
         English; a thrown run leaves the other nine hundred missing too. */
      failed += batch.length;
      console.warn(`   x ${LOCALE_NAMES[locale]} ${i}-${i + batch.length}: ${e.message}`);
      continue;
    }

    const rows = batch.map((item, index) => ({
      source_hash: item.hash,
      locale,
      source: item.text,
      translated: out[index],
      provider: provider.name,
    }));

    /* ignoreDuplicates, so a row an editor reviewed between the read above and
       this write is not quietly replaced by the machine. */
    const { error: writeError } = await supabase
      .from("translations")
      .upsert(rows, { onConflict: "source_hash,locale", ignoreDuplicates: true });

    if (writeError) {
      failed += batch.length;
      console.warn(`   x could not cache ${LOCALE_NAMES[locale]} ${i}: ${writeError.message}`);
      continue;
    }

    done += batch.length;
    process.stdout.write(`\r   ${LOCALE_NAMES[locale]}: ${done.toLocaleString()} / ${todo.length.toLocaleString()}   `);
  }
}

console.log(`\n\n   ${done.toLocaleString()} translated${failed ? `, ${failed} failed` : ""}.\n`);
if (failed && !soft) process.exitCode = 1;
