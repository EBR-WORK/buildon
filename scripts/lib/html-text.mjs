/**
 * The translatable text inside a built page, and how to put it back.
 *
 * Working on the built HTML rather than on the content files is what makes
 * this cover the whole site. The pages render from several sources — the CMS
 * rows, the defaults in content.ts, productDetails.ts, blogDetails.ts — and
 * chasing each one would mean knowing about all of them for ever. The HTML is
 * where they all end up.
 *
 * Replacement is EXACT MATCH ONLY. A text node is swapped when the whole of
 * its trimmed content is a string we have a translation for, and left alone
 * otherwise. Nothing is substituted inside a longer sentence, so a word that
 * happens to appear in a paragraph cannot corrupt it, and a string that was
 * not collected simply stays in English.
 */

/** Tags whose contents are code or data, never prose. */
const OPAQUE = /<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi;

/** Attributes that hold words a visitor reads. */
const ATTRS = ["alt", "title", "placeholder", "aria-label"];

/**
 * The only <meta> values that are prose.
 *
 * `content` is deliberately NOT in ATTRS, because it is the one attribute that
 * is usually machine-readable. It used to be, guarded by "skip it if it has no
 * spaces" — and that guard was wrong in the way that matters, because two
 * values on every page have spaces and are not prose:
 *
 *   <meta name="viewport" content="width=device-width, initial-scale=1">
 *   <meta name="robots"   content="index, follow">
 *
 * Both were collected and sent to be translated. The robots one came back as
 * "इंडेक्स, फॉलो" and was written into 23 Hindi pages, telling a crawler
 * nothing at all on exactly the pages meant to be indexed. The viewport
 * escaped only because the model happened to echo it back unchanged; had it
 * not, every locale page would have fallen back to a 980px desktop viewport
 * and the entire Marathi and Hindi site would render zoomed out on a phone.
 *
 * So: an allowlist, checked against the tag's own name/property. A value is
 * translated because it is known to be prose, never because it looks like it.
 */
const META_PROSE = new Set([
  "description",
  "keywords",
  "og:title",
  "og:description",
  "og:site_name",
  "og:image:alt",
  "twitter:title",
  "twitter:description",
  "twitter:image:alt",
  "apple-mobile-web-app-title",
  "application-name",
]);

/** The name/property a <meta> tag identifies itself by, if any. */
const metaKey = (tag) =>
  (/\b(?:name|property)="([^"]*)"/.exec(tag)?.[1] ?? "").toLowerCase();

/** Is this <meta> tag's content attribute prose that a visitor reads? */
const metaIsProse = (tag) => META_PROSE.has(metaKey(tag));

/**
 * Is this worth sending to a translator?
 *
 * The same test the content collector uses: a URL, a number, a path or a
 * single symbol costs money to send and comes back either identical or wrong.
 */
export function translatable(text) {
  const value = String(text ?? "").trim();
  if (value.length < 2) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (/^[\d\s.,%+\-/:()]+$/.test(value)) return false;
  if (/^(https?:|mailto:|tel:|data:|#|\/)/.test(value)) return false;
  if (/^[\w.-]+\.(webp|png|jpe?g|svg|mp4|pdf|docx?|css|js)$/i.test(value)) return false;
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(value)) return false;
  /* Already Devanagari: a page being re-applied, or a brand that is written
     that way to begin with. */
  if (/[ऀ-ॿ]/.test(value)) return false;
  return true;
}

/** Blank out the opaque regions so their contents are never matched. */
function mask(html) {
  const holes = [];
  const masked = html.replace(OPAQUE, (block) => {
    holes.push(block);
    return `\u0000${holes.length - 1}\u0000`;
  });
  return { masked, holes };
}

const unmask = (masked, holes) =>
  masked.replace(/\u0000(\d+)\u0000/g, (_, index) => holes[Number(index)]);

/** Every distinct piece of readable text in a page. */
export function collect(html, into = new Set()) {
  const { masked } = mask(html);

  /* Text nodes: everything between a > and the next <. */
  for (const match of masked.matchAll(/>([^<>]+)</g)) {
    const text = match[1].trim();
    if (translatable(text)) into.add(decode(text));
  }

  for (const attr of ATTRS) {
    const pattern = new RegExp(`\\b${attr}="([^"]*)"`, "g");
    for (const match of masked.matchAll(pattern)) {
      const text = match[1].trim();
      if (translatable(text)) into.add(decode(text));
    }
  }

  /* <meta content="..."> only where the tag names itself as prose. */
  for (const tag of masked.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!metaIsProse(tag)) continue;
    const text = (/\bcontent="([^"]*)"/.exec(tag)?.[1] ?? "").trim();
    if (translatable(text)) into.add(decode(text));
  }

  return into;
}

/* The entities Next emits in text. Decoded for collection so the string sent
   to the translator is what a reader sees, and re-encoded on the way back. */
const DECODE = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'", "&#39;": "'" };
const decode = (text) => text.replace(/&(amp|lt|gt|quot|#x27|#39);/g, (m) => DECODE[m] ?? m);
const encode = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Put the translations in.
 *
 * `lookup` is a Map from the exact English string to its translation. Anything
 * missing is left exactly as it was, which is the fallback working rather than
 * a failure.
 */
export function apply(html, lookup) {
  const { masked, holes } = mask(html);
  let hits = 0;
  let misses = 0;

  let out = masked.replace(/>([^<>]+)</g, (whole, inner) => {
    const text = inner.trim();
    if (!translatable(text)) return whole;

    const translated = lookup.get(decode(text));
    if (!translated) {
      misses += 1;
      return whole;
    }

    hits += 1;
    /* The surrounding whitespace is kept: it is what separates inline
       elements, and collapsing it joins words that were apart. */
    const [, lead = "", , trail = ""] = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner) ?? [];
    return `>${lead}${encode(translated)}${trail}<`;
  });

  /* A quote inside an attribute value would end the attribute early. */
  const forAttribute = (translated) => encode(translated).replace(/"/g, "&quot;");

  for (const attr of ATTRS) {
    const pattern = new RegExp(`(\\b${attr}=")([^"]*)(")`, "g");
    out = out.replace(pattern, (whole, open, value, close) => {
      const text = value.trim();
      if (!translatable(text)) return whole;
      const translated = lookup.get(decode(text));
      if (!translated) {
        misses += 1;
        return whole;
      }
      hits += 1;
      return `${open}${forAttribute(translated)}${close}`;
    });
  }

  /* The <meta> pass, matching collect() exactly.

     This has to use the same allowlist and the same tag-level test, not a bare
     content="..." regex. The two functions diverging IS the bug class: collect
     skipped some content values and apply replaced any of them it happened to
     have a translation for, so a text node reading "website" anywhere on the
     site could overwrite og:type everywhere. Whatever guard one side gains,
     the other gains too. */
  out = out.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (!metaIsProse(tag)) return tag;
    return tag.replace(/(\bcontent=")([^"]*)(")/, (whole, open, value, close) => {
      const text = value.trim();
      if (!translatable(text)) return whole;
      const translated = lookup.get(decode(text));
      if (!translated) {
        misses += 1;
        return whole;
      }
      hits += 1;
      return `${open}${forAttribute(translated)}${close}`;
    });
  });

  const applied = applyPayload(unmask(out, holes), lookup);
  return { html: applied.html, hits: hits + applied.hits, misses, skipped: applied.skipped };
}

/**
 * Translate React's hydration payload too, or the page speaks English a
 * heartbeat after it loads.
 *
 * This is the step whose absence made everything above look like it worked and
 * not work. A static export ships the rendered markup AND the data React needs
 * to take the page over — the `self.__next_f.push([...])` blocks. mask() blanks
 * those out, correctly, because they are code. But they also carry every string
 * the page renders, in English.
 *
 * So the browser painted the Hindi heading from the markup, React hydrated a
 * moment later, found "Guaranteed Quality" in the payload where the DOM said
 * "गारंटीशुदा क्वालिटी", and put the English back. Visibly: the page loads
 * translated and reverts. Checking the built file showed the Hindi present and
 * correct, which is exactly why this survived every check I made.
 *
 * ONLY whole JSON string values are replaced — `\"text\"` as it appears inside
 * the payload's JS string literal — so this keeps the same exact-match promise
 * as the markup pass and cannot corrupt a class name or a prop.
 *
 * Strings containing a quote or a backslash are skipped rather than escaped.
 * Getting the escaping wrong here does not produce a wrong word, it produces a
 * payload React cannot parse — a blank page. The count comes back so the
 * caller can say how many were left behind.
 */
/* Built from a string rather than written as a literal: U+2028 and U+2029
   are line terminators, so typing them inside a /regex/ ends the literal. */
const PAYLOAD_ESCAPE = new RegExp("[&<>\\u2028\\u2029]", "g");

const escapeForPayload = (text) =>
  text.replace(PAYLOAD_ESCAPE, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

function applyPayload(html, lookup) {
  let hits = 0;
  let skipped = 0;

  /* The payload is parsed rather than pattern-matched, and that is the whole
     lesson of this function.

     Three regexes were tried here, each one correct about the case that broke
     the last and wrong about the next:

       \\"([^"\\]+)\\"           paired a CLOSING quote with the next OPENING one
                                and captured the punctuation between them
       anchored on [[{,:]       fixed that, but stopped dead at any backslash,
                                so every sentence containing & — which React
                                writes as \\u0026 — was invisible
       plus \\uXXXX             fixed that, and still could not see a string
                                containing a literal " , which is how every
                                testimonial on this site begins

     Each round translated a few more sentences and left a different few in
     English, which is the worst possible failure: it looks like progress. The
     escaping has four levels — JS string literal, JSON, React's own \\uXXXX,
     and HTML — and a regex that handles three of them is simply a slower way
     of being wrong.

     JSON.parse knows all four. The literal is unwrapped once, the flight text
     inside it is walked as JSON strings, and the whole thing is re-serialised
     by JSON.stringify. Nothing is escaped by hand. */
  const out = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (whole, body) => {
    if (!body.includes("self.__next_f.push")) return whole;

    /* self.__next_f.push([1,"...the flight text..."]) — the second argument is
       a JS string literal, which is also valid JSON, so JSON.parse unwraps it
       exactly. */
    const next = body.replace(
      /(self\.__next_f\.push\(\[\d+,)("(?:[^"\\]|\\[\s\S])*")(\]\))/g,
      (call, open, literal, close) => {
        let flight;
        try {
          flight = JSON.parse(literal);
        } catch {
          /* Not a literal this understands. Left exactly as it was: a payload
             that fails to parse here would also fail in the browser, and
             guessing at it would turn a translation gap into a blank page. */
          return call;
        }

        const translatedFlight = flight.replace(
          /"(?:[^"\\]|\\[\s\S])*"/g,
          (jsonString) => {
            let text;
            try {
              text = JSON.parse(jsonString);
            } catch {
              return jsonString;
            }
            const translated = lookup.get(text);
            if (!translated) return jsonString;
            hits += 1;
            /* JSON.stringify leaves < > & raw, and this JSON is going back
               inside a <script>: a translation containing "</script" would end
               the tag early and break the page. The \\uXXXX forms are still
               valid JSON, so the browser reads the same characters. */
            return escapeForPayload(JSON.stringify(translated));
          },
        );

        if (translatedFlight === flight) return call;
        return open + JSON.stringify(translatedFlight) + close;
      },
    );

    return next === body ? whole : whole.replace(body, next);
  });

  return { html: out, hits, skipped };
}

/**
 * The hreflang block for one page, and the self-referring tags beside it.
 *
 * Without hreflang, Google sees three pages with the same layout and largely
 * the same product names and has to guess whether /mr is a translation or a
 * duplicate. Guessing wrong means one of them is filtered out of results, and
 * the one it keeps is not necessarily the English original.
 *
 * Each page gets a link for every language INCLUDING itself — that is not
 * redundancy, it is the requirement: Google only trusts a cluster where every
 * member points at all the others and back at itself. x-default is the page
 * served to someone whose language we do not publish, which is English.
 *
 * WHY THIS ALSO REWRITES canonical, og:url AND og:locale
 *
 * The locale routes are generated as `export { default, metadata } from
 * "@/app/about-us/page"` — they re-export the ENGLISH metadata object, and
 * canonical is part of it. So out/mr/about-us.html shipped
 *
 *   <link rel="canonical" href="https://buildon.co.in/about-us">
 *
 * A cross-language canonical overrides hreflang: Google reads the Marathi
 * page, is told the real one is the English page, and drops /mr from the index
 * entirely. Every hreflang link added here was doing nothing while that tag
 * stood. Fixing one without the other is worse than doing neither, because it
 * looks finished.
 *
 * og:url and og:locale came through the same way, so a shared Marathi link
 * previewed as the English page.
 *
 * `page` is the English path relative to out/ ("index.html", "products.html"),
 * `locale` is the page being stamped, and the hrefs are the clean URLs a
 * visitor actually sees, not the filenames.
 */
export function alternates(html, page, origin, locale = "en") {
  /* "index.html" is the root; everything else drops the extension, because
     that is how the host serves it and a canonical URL must be the one people
     and links actually use. */
  const slug = page === "index.html" ? "" : "/" + page.replace(/\.html$/, "");

  const href = (locale) =>
    locale === "en" ? origin + (slug || "/") : origin + "/" + locale + slug;

  const links = [
    ...["en", "mr", "hi"].map(
      (locale) =>
        '<link rel="alternate" hreflang="' +
        { en: "en-IN", mr: "mr-IN", hi: "hi-IN" }[locale] +
        '" href="' + href(locale) + '"/>',
    ),
    '<link rel="alternate" hreflang="x-default" href="' + href("en") + '"/>',
  ].join("");

  /* Idempotent: a second pass over an already-processed page replaces the
     block rather than adding a second one. Applying twice is normal — a
     rebuild, or a re-run after a translation top-up. */
  let out = html.replace(
    /<link rel="alternate" hreflang="[^"]*" href="[^"]*"\/?>/g,
    "",
  );

  const self = href(locale);

  /* Point canonical at THIS page, not at its English original. */
  out = out.replace(
    /(<link rel="canonical" href=")[^"]*(")/i,
    (whole, open, close) => open + self + close,
  );

  out = out.replace(
    /(<meta property="og:url" content=")[^"]*(")/i,
    (whole, open, close) => open + self + close,
  );

  out = out.replace(
    /(<meta property="og:locale" content=")[^"]*(")/i,
    (whole, open, close) => open + OG_LOCALE[locale] + close,
  );

  /* A `$` in a replacement string is a capture reference, so the links go in
     through a function rather than inline. ORIGIN holding a `$` is unlikely,
     but silently eating part of a URL is not a failure anyone would look for. */
  return out.replace(/<\/head>/i, () => links + "</head>");
}

/** Open Graph wants the underscored form, not the hyphenated one. */
const OG_LOCALE = { en: "en_IN", mr: "mr_IN", hi: "hi_IN" };

/** Set the page's language, and point the other two at their own copies. */
export function setLang(html, locale, tag) {
  return html.replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${tag}"`)
    .replace(/<html(?![^>]*\slang=)/i, `<html lang="${tag}"`);
}
