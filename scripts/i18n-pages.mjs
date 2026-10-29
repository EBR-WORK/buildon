/**
 * Translate the built site.
 *
 *   npm run i18n:pages            collect, translate what is new, apply
 *   npm run i18n:pages -- --dry   collect and cost it, send nothing
 *   npm run i18n:pages -- --apply apply what is cached, translate nothing
 *   npm run i18n:pages -- --again send every string again, replacing the cache
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
import {
  alternates,
  apply,
  collect,
  prefixLinks,
  prefixLinksInFlight,
  setLang,
  setLangInFlight,
  translateFlight,
} from "./lib/html-text.mjs";
import { hashOf, LOCALE_NAMES, readProviders, translateBatch } from "./lib/translate.mjs";

const OUT = "out";
const LOCALES = ["mr", "hi"];
const TAGS = { mr: "mr-IN", hi: "hi-IN" };
/* Strings per request is now a property of the provider, not of this script:
   Gemini's limit is output tokens and Azure's is characters, and the two want
   different numbers. See readProviders() in lib/translate.mjs. */

/* The canonical origin, which hreflang links must be absolute against — a
   relative hreflang is ignored. Matches site.url in src/lib/content.ts; kept
   here as a literal because this script runs outside the bundle and cannot
   import a TS module. */
const ORIGIN = "https://buildon.co.in";

const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const applyOnly = argv.includes("--apply");
/* Send every string again, cache or no cache.
 *
 * The cache is keyed by the English sentence, which is exactly right while the
 * only thing that changes is the content — but the prompt is an input too, and
 * changing it changes what the right answer is. Without this flag a reworded
 * instruction reaches nothing already translated, which is to say almost
 * nothing.
 *
 * Deliberately not a cache wipe. Rows are overwritten as the new ones arrive
 * (see ignoreDuplicates below), so a run that stops halfway leaves the older
 * translation in place rather than an English page. There is no moment at
 * which the site is less translated than it was. */
const retranslate = argv.includes("--again");
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

/* A deploy is not a local build.

   This exited 0 whatever happened, so a Netlify build with no Supabase
   variables set printed the banner into a log nobody reads, went green, and
   published 93 Marathi pages and 93 Hindi pages in English. The site looked
   live and correct and the language did not work, with nothing failing
   anywhere to say so.

   On a build server it now fails. Locally it still only warns: a developer
   with no keys is working on something else and should not be blocked by it,
   and they can see the banner on their own screen. */
const CI = Boolean(process.env.CI || process.env.NETLIFY || process.env.VERCEL);

/**
 * Say what is wrong, and decide whether it is worth a failed deploy.
 *
 * `fix` is the thing to actually do about it — named here rather than in a
 * fixed sentence at the bottom, because the first version of this printed
 * "set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY" at somebody whose
 * Supabase variables were fine and whose Gemini key was missing. It cost a
 * build and an afternoon of looking at the wrong setting.
 *
 * `fatal` is false where the site still reads correctly. A missing Gemini key
 * with a full cache means a handful of new strings stay English on pages that
 * are otherwise translated; failing the deploy over that is worse than
 * shipping it, because it also blocks every other change in the push.
 */
function banner(title, message, fix, closing) {
  console.warn("");
  console.warn("  ================================================================");
  console.warn(`   ${title}`);
  console.warn("");
  console.warn(`   ${message}`);
  if (fix) {
    console.warn("");
    console.warn(`   ${fix}`);
  }
  console.warn("");
  console.warn(`   ${closing}`);
  console.warn("  ================================================================");
  console.warn("");
}

/* Nothing can be translated from here, so the run ends. */
function stop(message, fix = "") {
  banner(
    "PAGES NOT TRANSLATED",
    message,
    fix,
    CI
      ? "Failing the build rather than publishing out/mr and out/hi in English."
      : "out/mr and out/hi are built and served; they read in English.",
  );
  process.exit(CI ? 1 : 0);
}

/* Say so loudly and CARRY ON.
 *
 * This must never exit. The run's real work — applying the cache to out/mr and
 * out/hi — happens further down, and skipping it is the all-English deploy the
 * script exists to prevent. That is exactly what an early exit here shipped
 * once: the cache held 9,159 of 9,199 strings and the site went out in English
 * because 40 of them had nowhere to come from. */
function warn(message, fix = "") {
  banner(
    "SOME STRINGS NOT TRANSLATED",
    message,
    fix,
    "Everything already in the cache is translated; the rest stays English.",
  );
}

if (!existsSync(OUT)) stop("There is no out/ — run npm run build first.");
if (!url || !writeKey) {
  stop(
    "Supabase is not configured, so there is no cache to read.",
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in the site's environment variables.",
  );
}

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
/* Strings somebody corrected by hand, as `${locale} ${source}`.
 *
 * A row whose provider is neither gemini nor azure was not written by this
 * script: somebody opened the table and fixed a translation. That is the
 * authority on what the sentence should say, and --again must not drive over
 * it — the whole point of --again is to overwrite machine output, and a
 * correction is the one thing in there that is not machine output.
 *
 * Set provider to "manual" on a row to pin it for good. */
const pinned = new Set();
const pinKey = (locale, source) => `${locale} ${source}`;

async function readCache() {
  const byLocale = new Map(LOCALES.map((locale) => [locale, new Map()]));

  /* In pages: PostgREST caps a response, and asking for six thousand rows in
     one go silently returns the first thousand.

     The order() is not decoration — without it this reads the cache WRONG.
     Postgres makes no promise about row order absent an ORDER BY, so each
     range() is free to return a different slice of the same set: pages overlap,
     other rows never appear, and the result is an incomplete lookup with no
     error anywhere. Measured on this project: 2,158 Hindi rows read as 2,000.

     The damage is invisible in the worst way. Every missing row is a string
     that stays English on the page while sitting translated in the database,
     and WHICH strings go missing changes between runs — so a page can look
     fine, then lose a paragraph on the next build for no reason a person could
     see. source_hash is the primary key, so ordering by it is stable and
     unique, which is what makes the paging total. */
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("translations")
      .select("source, translated, locale, provider")
      .in("locale", LOCALES)
      .order("source_hash", { ascending: true })
      .range(from, from + 999);

    if (error) {
      stop(
        /schema cache|does not exist/i.test(error.message)
          ? "The translations table is missing. Run supabase/migrations/0008_translations.sql."
          : `Could not read the cache — ${error.message}`,
      );
    }
    if (!data?.length) break;
    for (const row of data) {
      byLocale.get(row.locale)?.set(row.source, row.translated);
      if (row.provider !== "gemini" && row.provider !== "azure") {
        pinned.add(pinKey(row.locale, row.source));
      }
    }
    if (data.length < 1000) break;
  }

  return byLocale;
}

const cached = await readCache();

const todo = [];
for (const locale of LOCALES) {
  const have = cached.get(locale);
  for (const text of all) {
    if (pinned.has(pinKey(locale, text))) continue;
    if (retranslate || !have.has(text)) todo.push({ locale, text });
  }
}

const newCharacters = todo.reduce((sum, item) => sum + item.text.length, 0);
console.log(`   cached   ${[...cached.values()].reduce((n, m) => n + m.size, 0).toLocaleString()}`);
if (pinned.size) console.log(`   pinned   ${pinned.size.toLocaleString()} corrected by hand, left alone`);
console.log(`   to send  ${todo.length.toLocaleString()} (${newCharacters.toLocaleString()} characters)`);

if (dry) {
  console.log(`\n   --dry: nothing sent. Roughly $${((newCharacters / 4 / 1_000_000) * 0.4).toFixed(2)} on Gemini Flash.\n`);
  process.exit(0);
}

/* ------------------------------------------------------------ translating */

if (!applyOnly && todo.length > 0) {
  const providers = readProviders(env);
  if (providers.found.length === 0) {
    /* Not fatal when the cache answered. 9,159 strings came back and 40 did
       not: those forty stay English on pages that are otherwise translated,
       which is a gap worth a loud warning and not worth blocking the deploy —
       and with it every other change in the same push.
    
       Fatal when the cache gave nothing, because then no provider means no
       translation at all, and that is the silent all-English deploy this
       script exists to prevent. */
    const cachedCount = [...cached.values()].reduce((n, m) => n + m.size, 0);
    const reason = providers.reason;
    const fix = "Set GEMINI_API_KEY in the site's environment variables.";
    if (cachedCount === 0) stop(reason, fix);
    warn(reason, fix);
  } else {
  /* The one in use, and the ones left to fall back to. */
  let provider = providers.found[0];
  const spare = providers.found.slice(1);
  console.log(
    `\n   provider: ${provider.name}` +
      (spare.length ? ` (then ${spare.map((p) => p.name).join(", ")})` : "") +
      "\n",
  );

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

      const batch = queue.splice(0, provider.batch);

      let out;
      try {
        out = await translateBatch(batch.map((item) => item.text), locale, provider);
      } catch (e) {
        /* The day's budget is spent. Every remaining batch would fail the same
           way, so the run ends here rather than pretending to continue. What
           is already cached stays cached, because each batch is saved as it
           returns rather than all of them at the end. */
        if (e.daily) {
          /* Put the batch back either way: it is going to be sent again, by
             the next provider or by tomorrow's run. */
          queue.unshift(...batch);

          /* Another provider configured? Then this is not the end of the run,
             it is a change of provider. Everything translated so far is
             already saved and keyed by the English sentence, so the two fill
             the same cache between them with no reconciliation needed —
             nothing is sent twice and nothing is lost in the handover. */
          const next = spare.shift();
          if (next) {
            const left = [...queues.values()].reduce((n, q) => n + q.length, 0);
            console.warn("");
            console.warn(`   ${provider.name} is out: ${e.message}`);
            console.warn(`   Switching to ${next.name} for the remaining ${left.toLocaleString()} strings.`);
            console.warn("");
            provider = next;
            continue;
          }

          exhausted = e.message;
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
        .upsert(rows, {
          onConflict: "source_hash,locale",
          /* Normally a row that exists is the answer and must not be touched.
             On --again the whole point is that it is no longer the answer. */
          ignoreDuplicates: !retranslate,
        });

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
    console.warn("   Every provider configured here is spent: " + providers.found.map((p) => p.name).join(", ") + ".");
    console.warn("");
    console.warn("   Everything above is cached, so the next run carries on exactly where");
    console.warn("   this one stopped. Nothing is translated or paid for twice. The daily");
    console.warn("   job in .github/workflows picks the rest up on its own.");
    console.warn("");
    console.warn("   The provider said: " + (when ? when[0] : exhausted.slice(0, 120)));
    console.warn("   ----------------------------------------------------------------");
    console.warn("");
  }

  console.log(`\n\n   ${done.toLocaleString()} translated${failed ? `, ${failed} failed` : ""}.\n`);
  }
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

/**
 * Every React navigation payload belonging to a locale.
 *
 * Next writes these as .txt files beside the routes: out/hi.txt for the home
 * page, out/hi/about-us.txt and the __next._*.txt variants beneath it. They
 * are what a clicked link fetches, so a locale whose .html is translated and
 * whose .txt is not reads correctly until the visitor goes anywhere.
 */
function flightFilesFor(locale) {
  const found = [];

  /* The home page's, which sits beside the directory rather than in it — the
     same quirk that localeFile exists for. */
  const home = join(OUT, `${locale}.txt`);
  if (existsSync(home)) found.push(home);

  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".txt")) found.push(full);
    }
  };
  walk(join(OUT, locale));

  /* A page left out of SKIP must be left out here too.

     These are the payloads a CLICKED link fetches. Translating one whose .html
     was deliberately skipped would hand the browser Hindi for a page whose
     markup is English — the same mismatch the skip exists to avoid, arriving
     by a different road. */
  return found.filter((file) => {
    const page = relative(join(OUT, locale), file).split(sep).join("/");
    const asEnglish = page === `../${locale}.txt` ? "index.html" : page.replace(/\.txt$/, ".html");
    return !SKIP.some((re) => re.test(asEnglish));
  });
}

/**
 * The clean paths this locale actually has a built page for.
 *
 * The link pass asks this before moving an href, so a link can only ever be
 * pointed at a page that exists. A route that was skipped, or that has no
 * Marathi version yet, keeps its English href — the wrong language being a
 * great deal better than a 404.
 */
function builtPagesFor(locale) {
  const found = new Set();

  /* The home page sits beside the directory, not inside it. */
  if (existsSync(join(OUT, `${locale}.html`))) found.add(`/${locale}`);

  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".html")) {
        const rel = relative(OUT, full).split(sep).join("/").replace(/\.html$/, "");
        found.add(`/${rel}`);
      }
    }
  };
  walk(join(OUT, locale));

  return found;
}

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
  let links = 0;

  const built = builtPagesFor(locale);
  const hasPage = (path) => built.has(path);

  for (const page of pages) {
    const file = join(OUT, localeFile(page, locale));
    if (!existsSync(file)) {
      absent += 1;
      continue;
    }
    const result = apply(readFileSync(file, "utf8"), lookup);
    hits += result.hits;
    misses += result.misses;

    /* Translating the words is half of it. Every link on the page still
       pointed at the English URL, so the first click left the language. */
    const linked = prefixLinks(result.html, locale, hasPage);
    links += linked.hits;

    const tagged = setLang(linked.html, locale, TAGS[locale]);
    writeFileSync(file, alternates(tagged, page, ORIGIN, locale), "utf8");
    written += 1;
  }

  /* And the navigation payloads.
     
     Next writes a .txt beside every route holding the React payload it fetches
     when a link is clicked, instead of reloading the document. Translating
     only the .html left those in English, so the pages were right on arrival
     and reverted the moment anyone navigated — switch to Hindi and it worked;
     click "About Us" and you were reading English again. Refreshing fixed it,
     which is exactly what made it look like a caching problem.
     
     Same content, same lookup; only the wrapper differs. A .txt IS the flight
     text, where in the HTML it arrives inside a JS string literal. */
  let navFiles = 0;
  let navHits = 0;

  for (const file of flightFilesFor(locale)) {
    const before = readFileSync(file, "utf8");
    const result = translateFlight(before, lookup);

    /* And the hrefs inside it, for the same reason they are rewritten in the
       markup: this payload is what a clicked link renders from, so a link left
       in English here walks the visitor out of the language even though the
       document it came from was right. */
    const linked = prefixLinksInFlight(result.flight, locale, hasPage);
    links += linked.hits;

    /* And <html lang>, which this payload also carries. */
    const tagged = setLangInFlight(linked.flight, TAGS[locale]);

    if (tagged === before) continue;
    writeFileSync(file, tagged, "utf8");
    navFiles += 1;
    navHits += result.hits;
  }

  const share = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;
  console.log(
    `   ${LOCALE_NAMES[locale].padEnd(8)} ${written} pages, ${hits.toLocaleString()} strings replaced (${share}%)` +
      (absent ? `, ${absent} page(s) have no ${locale} copy` : "") +
      `, ${navHits.toLocaleString()} in ${navFiles} navigation payloads` +
      `, ${links.toLocaleString()} links kept in ${locale}`,
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
