/**
 * Translate the built site.
 *
 *   npm run i18n:pages            collect, translate what is new, apply
 *   npm run i18n:pages -- --dry   collect and cost it, send nothing
 *   npm run i18n:pages -- --apply apply what is cached, translate nothing
 *
 * Runs after `next build`, over `out/`. The English tree is read and never
 * written; out/mr and out/hi are rewritten in place.
 *
 * Why the HTML rather than the content files: the pages render from the CMS
 * rows, the defaults in content.ts, productDetails.ts and blogDetails.ts, and
 * following each source would mean knowing about all of them for ever. The
 * HTML is where they all arrive. It also guarantees every string collected is
 * a string that can be matched again on the way back in — see html-text.mjs
 * for why replacement is exact-match only.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { alternates, apply, collect, setLang } from "./lib/html-text.mjs";
import { hashOf, LOCALE_NAMES, readProvider, translateBatch } from "./lib/translate.mjs";

const OUT = "out";
const LOCALES = ["mr", "hi"];
const TAGS = { mr: "mr-IN", hi: "hi-IN" };
/* Strings per request.
 *
 * The Gemini free tier allows 20 generate_content requests PER DAY per model —
 * not per minute, which is what the backoff in translate.mjs was built for and
 * what I first assumed when a run crawled. A 429 here says "retry in 11h44m".
 *
 * So the only number that matters is how many strings ride in each of those 20
 * requests. At 40 a day's quota moves 800 strings and this site needs 17,668.
 * At 500 it moves 10,000, which is the whole site in two days.
 *
 * Why not 1,000, which would fit in a single day: the output is the limit, not
 * the input. 500 short strings is ~13k input tokens against a 1M window, but
 * the Devanagari that comes back tokenises far worse than the English going in
 * — roughly 60 tokens a string — so 500 lands near 30k output tokens against a
 * 65k cap. 1,000 would exceed it, and a truncated response fails the
 * length check in translate.mjs and throws away the whole batch.
 *
 * With billing enabled this limit disappears and the batch size stops
 * mattering; 500 is simply safe either way. */
const BATCH = 500;

/* The canonical origin, which hreflang links must be absolute against — a
   relative hreflang is ignored. Matches site.url in src/lib/content.ts; kept
   here as a literal because this script runs outside the bundle and cannot
   import a TS module. */
const ORIGIN = "https://buildon.co.in";

const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const applyOnly = argv.includes("--apply");
/* One page at a time, for checking the output before committing to a run over
   three hundred of them. */
const onlyAt = argv.indexOf("--page");
const onlyPage = onlyAt === -1 ? null : argv[onlyAt + 1];

/* ------------------------------------------------------------ environment */

const env = {};
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match) env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}
for (const key of Object.keys(process.env)) {
  if (/^(NEXT_PUBLIC_SUPABASE|SUPABASE_|GEMINI_|AZURE_)/.test(key)) env[key] = process.env[key];
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const writeKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

function stop(message) {
  console.warn("");
  console.warn("  ================================================================");
  console.warn("   PAGES NOT TRANSLATED");
  console.warn("");
  console.warn(`   ${message}`);
  console.warn("");
  console.warn("   out/mr and out/hi are built and served; they read in English.");
  console.warn("  ================================================================");
  console.warn("");
  process.exit(0);
}

if (!existsSync(OUT)) stop("There is no out/ — run npm run build first.");
if (!url || !writeKey) stop("Supabase is not configured, so there is no cache to read.");

/* --------------------------------------------------------------- the pages */

/** Every page of a tree, as paths relative to it. */
function pagesIn(dir, base = dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      /* The locale trees are the output, not the input. */
      if (base === OUT && LOCALES.includes(entry)) continue;
      if (entry === "_next") continue;
      pagesIn(full, base, found);
    } else if (entry.endsWith(".html")) {
      const name = relative(base, full).split(sep).join("/");
      /* `out/mr.html` is the Marathi home page and sits BESIDE the mr/
         directory rather than inside it — a static export writes "/" as
         <name>.html, not <name>/index.html. Skipped here so it is not read as
         an English page, and found by localeFile below instead. */
      if (base === OUT && LOCALES.some((l) => name === `${l}.html`)) continue;
      found.push(name);
    }
  }
  return found;
}

/**
 * Pages that must never be translated.
 *
 * The admin panel is staff UI, not the website. A content editor, a salesperson
 * and an HR manager all work in English here, the labels match what this
 * codebase calls things, and a half-translated CRM is harder to use than an
 * English one. It is only ~25 strings, so this is about correctness rather than
 * quota.
 *
 * The rest are pages no visitor is meant to read as content: Next's own error
 * pages and __measure.html, a build artefact.
 */
const SKIP = [
  /^admin(\/|\.html$)/,
  /^(404|_not-found|__measure)\.html$/,
];

/**
 * The order strings get sent in.
 *
 * This matters because the free Gemini tier is a daily budget: if it runs out
 * mid-run, what has been translated is whatever went first. So the pages a
 * visitor actually lands on go first, and the long tail of blog posts — 3,336
 * of the site's 4,457 strings, three quarters of the whole job — goes last.
 *
 * A page not listed here sorts between products and the blog, so a new page
 * added later is neither first nor stranded at the back.
 */
const PRIORITY = [
  /^index\.html$/,                       // the home page
  /^(about-us|contact-us|contact)\.html$/,
  /^products\.html$/,
  /^products\//,
  /^(download-catalogue|dealers|projects|team|faq|career)\.html$/,
  /^blog\.html$/,
  /^blog\//,                             // 33 posts, the bulk of the work
];

const rank = (page) => {
  const found = PRIORITY.findIndex((re) => re.test(page));
  /* Unlisted pages sit just before the blog rather than after everything. */
  return found === -1 ? PRIORITY.length - 2.5 : found;
};

const pages = pagesIn(OUT)
  .filter((page) => !onlyPage || page === onlyPage)
  .filter((page) => !SKIP.some((re) => re.test(page)))
  .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

console.log(`   ${pages.length} page${pages.length === 1 ? "" : "s"} to translate, most-visited first`);

/* A Set keeps insertion order, and `pages` is already sorted by priority — so
   simply collecting in that order puts the home page's words at the front of
   the queue and the blog's at the back. Nothing further to sort. */
const strings = new Set();
for (const page of pages) collect(readFileSync(join(OUT, page), "utf8"), strings);

const all = [...strings];
const characters = all.reduce((sum, text) => sum + text.length, 0);
console.log(`   ${all.length.toLocaleString()} unique strings, ${characters.toLocaleString()} characters\n`);

/* ------------------------------------------------------------- the cache */

const supabase = createClient(url, writeKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const hashes = new Map(all.map((text) => [text, hashOf(text)]));

/** Everything already translated, as locale -> (english -> translated). */
async function readCache() {
  const byLocale = new Map(LOCALES.map((locale) => [locale, new Map()]));

  /* In pages: PostgREST caps a response, and asking for six thousand rows in
     one go silently returns the first thousand. */
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("translations")
      .select("source, translated, locale")
      .in("locale", LOCALES)
      .range(from, from + 999);

    if (error) {
      stop(
        /schema cache|does not exist/i.test(error.message)
          ? "The translations table is missing. Run supabase/migrations/0008_translations.sql."
          : `Could not read the cache — ${error.message}`,
      );
    }
    if (!data?.length) break;
    for (const row of data) byLocale.get(row.locale)?.set(row.source, row.translated);
    if (data.length < 1000) break;
  }

  return byLocale;
}

const cached = await readCache();

const todo = [];
for (const locale of LOCALES) {
  const have = cached.get(locale);
  for (const text of all) if (!have.has(text)) todo.push({ locale, text });
}

const newCharacters = todo.reduce((sum, item) => sum + item.text.length, 0);
console.log(`   cached   ${[...cached.values()].reduce((n, m) => n + m.size, 0).toLocaleString()}`);
console.log(`   to send  ${todo.length.toLocaleString()} (${newCharacters.toLocaleString()} characters)`);

if (dry) {
  console.log(`\n   --dry: nothing sent. Roughly $${((newCharacters / 4 / 1_000_000) * 0.4).toFixed(2)} on Gemini Flash.\n`);
  process.exit(0);
}

/* ------------------------------------------------------------ translating */

if (!applyOnly && todo.length > 0) {
  const provider = readProvider(env);
  if (!provider.name) stop(provider.reason);
  console.log(`\n   provider: ${provider.name}\n`);

  let done = 0;
  let failed = 0;

  /* Both languages, alternating, each working through its own queue in
     priority order. Taking Marathi to completion before starting Hindi would
     mean that a run which runs out of quota leaves Hindi untouched — one
     finished language and one English site. Alternating means a short run
     leaves BOTH languages correct on the pages that matter, and English on the
     blog, which is the better half-finished state to be caught in. */
  const queues = new Map(
    LOCALES.map((locale) => [locale, todo.filter((item) => item.locale === locale)]),
  );

  let exhausted = null;

  outer: while ([...queues.values()].some((q) => q.length > 0)) {
    for (const locale of LOCALES) {
      const queue = queues.get(locale);
      if (queue.length === 0) continue;

      const batch = queue.splice(0, BATCH);

      let out;
      try {
        out = await translateBatch(batch.map((item) => item.text), locale, provider);
      } catch (e) {
        /* The day's budget is spent. Every remaining batch would fail the same
           way, so the run ends here rather than pretending to continue. What
           is already cached stays cached, because each batch is saved as it
           returns rather than all of them at the end. */
        if (e.daily) {
          exhausted = e.message;
          /* Put the batch back, so the count of what is left is honest. */
          queue.unshift(...batch);
          break outer;
        }

        /* Anything else is this batch's problem, not the run's. A batch missing
           renders in English; a thrown run leaves every later one missing. */
        failed += batch.length;
        console.warn("   x " + LOCALE_NAMES[locale] + ": " + e.message.slice(0, 160));
        continue;
      }

      /* A gap is a string the model skipped. It stays uncached, so the next
         run picks it up — the alternative, caching a hole, would leave it
         English for ever because the upsert never overwrites. */
      const rows = batch
        .map((item, index) => ({
          source_hash: hashes.get(item.text),
          locale,
          source: item.text,
          translated: out[index],
          provider: provider.name,
        }))
        .filter((row) => typeof row.translated === "string");

      if (out.missing) {
        console.warn(`   ${out.missing} string(s) skipped by the model — they stay queued`);
      }

      const { error } = await supabase
        .from("translations")
        /* ignoreDuplicates, so a string an editor corrected between the read
           above and this write is not replaced by the machine. */
        .upsert(rows, { onConflict: "source_hash,locale", ignoreDuplicates: true });

      if (error) {
        failed += batch.length;
        console.warn("   x could not cache " + LOCALE_NAMES[locale] + ": " + error.message);
        continue;
      }

      for (const [index, item] of batch.entries()) {
        if (typeof out[index] === "string") cached.get(locale).set(item.text, out[index]);
      }

      /* What was actually stored, not what was asked for — a skipped string is
         still to do, and counting it as done would make the run look complete
         while leaving English on the page. */
      done += rows.length;
      /* `done` is both locales, so the locale goes in parentheses as the batch
         that just landed — not as a label for the number, which it is not. */
      console.log(
        "   " + done.toLocaleString() + " / " + todo.length.toLocaleString() +
          "   (" + LOCALE_NAMES[locale] + ")",
      );
    }
  }

  if (exhausted) {
    const left = [...queues.values()].reduce((n, q) => n + q.length, 0);
    const when = /retry in [^\s]+/i.exec(exhausted);
    console.warn("");
    console.warn("   ----------------------------------------------------------------");
    console.warn("   DAILY QUOTA SPENT");
    console.warn("");
    console.warn("   " + done.toLocaleString() + " strings translated and saved. " + left.toLocaleString() + " still to do.");
    console.warn("");
    console.warn("   The Gemini free tier allows 20 requests a day. Everything above");
    console.warn("   is cached, so running this again tomorrow carries on exactly");
    console.warn("   where it stopped. Nothing is translated or paid for twice.");
    console.warn("");
    console.warn("   Google said: " + (when ? when[0] : "retry tomorrow"));
    console.warn("   ----------------------------------------------------------------");
    console.warn("");
  }

  console.log(`\n\n   ${done.toLocaleString()} translated${failed ? `, ${failed} failed` : ""}.\n`);
}

/* Leave the size of the backlog somewhere a scheduled job can read it.

   The daily workflow in .github/workflows needs to know whether another build
   is worth starting, and it has no built site to count from — only the
   database. This run does know, exactly, so it writes the number down rather
   than making something else guess it.

   Written on every run, including the ones that finish the job, because 0 is
   the answer that stops the workflow rebuilding for nothing. */
{
  const have = await readCache();
  const pending = LOCALES.reduce(
    (n, locale) => n + all.filter((text) => !have.get(locale).has(text)).length,
    0,
  );

  const { error } = await supabase
    .from("settings")
    .upsert({ key: "translation_backlog", value: String(pending) }, { onConflict: "key" });

  if (error) {
    /* Not fatal: the pages are translated either way, and a stale number only
       means the scheduled job starts one build it did not need. */
    console.warn(`   (could not record the backlog: ${error.message})`);
  } else if (pending > 0) {
    console.log(`   ${pending.toLocaleString()} strings still to translate — the daily job will pick them up.\n`);
  }
}

/**
 * Where the same page lives in another language.
 *
 *   index.html     ->  mr.html        the home page, beside the directory
 *   about-us.html  ->  mr/about-us.html
 *
 * Derived from the English page rather than discovered, so the two trees
 * cannot drift: a page with no counterpart is a missing route, which is worth
 * saying out loud rather than quietly translating 22 of 23 pages.
 */
const localeFile = (page, locale) =>
  page === "index.html" ? `${locale}.html` : join(locale, page);

/* -------------------------------------------------------------- applying */

for (const locale of LOCALES) {
  const lookup = cached.get(locale);
  const tree = join(OUT, locale);
  if (!existsSync(tree)) {
    console.warn(`   skipped ${locale}: out/${locale} is not there. Run npm run i18n:routes and rebuild.`);
    continue;
  }

  let hits = 0;
  let misses = 0;
  let written = 0;
  let absent = 0;

  for (const page of pages) {
    const file = join(OUT, localeFile(page, locale));
    if (!existsSync(file)) {
      absent += 1;
      continue;
    }
    const result = apply(readFileSync(file, "utf8"), lookup);
    hits += result.hits;
    misses += result.misses;
    const tagged = setLang(result.html, locale, TAGS[locale]);
    writeFileSync(file, alternates(tagged, page, ORIGIN, locale), "utf8");
    written += 1;
  }

  const share = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;
  console.log(
    `   ${LOCALE_NAMES[locale].padEnd(8)} ${written} pages, ${hits.toLocaleString()} strings replaced (${share}%)` +
      (absent ? `, ${absent} page(s) have no ${locale} copy` : ""),
  );
}

/* ------------------------------------------------------- hreflang, English

   The English tree is translated by nobody, but it still has to take part in
   the hreflang cluster: a group where /mr and /hi point at the original and
   the original points back is what tells Google these are one page in three
   languages rather than three competing pages. Leaving English out breaks the
   cluster for all three.

   This is the one thing in this script that writes to the English tree, and it
   changes only the <head>. */

let tagged = 0;
for (const page of pages) {
  const file = join(OUT, page);
  const html = readFileSync(file, "utf8");
  const next = alternates(html, page, ORIGIN, "en");
  if (next !== html) {
    writeFileSync(file, next, "utf8");
    tagged += 1;
  }
}
console.log(
  tagged === 0
    ? `   English  hreflang already present on all ${pages.length} pages`
    : `   English  ${tagged} pages given hreflang links`,
);

console.log("");
