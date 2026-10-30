/**
 * Turning English strings into Marathi and Hindi, once each.
 *
 * Two providers behind one function, because the cache is keyed on the English
 * text rather than on who translated it — so swapping one for the other costs
 * nothing already stored.
 *
 *   gemini   instruction-following, which is what keeps "Bondit-151" from
 *            coming back in Devanagari. Preferred.
 *   azure    a plain translation API, 2M characters a month free. No glossary
 *            control, so DO_NOT_TRANSLATE is enforced by substitution instead.
 */

import { createHash } from "node:crypto";

export const LOCALES = ["mr", "hi"];

export const LOCALE_NAMES = { mr: "Marathi", hi: "Hindi" };

/**
 * Words a machine must not touch.
 *
 * Product names first: a dealer who reads जिप्सम प्लास्टर वन कोट on a page does
 * not recognise the product they were sold, and that is worse than English.
 * Then the trade terms the industry says in English regardless of the language
 * the rest of the sentence is in.
 */
export const DO_NOT_TRANSLATE = [
  /* The brand, and the codes that identify a specific bag.
   *
   * This list used to carry the full descriptive product names too — Gypsum
   * Plaster One Coat, Imported Gypsum Plaster, Gypsum Master Plaster — on the
   * reasoning that a dealer would not recognise जिप्सम प्लास्टर वन कोट. The
   * effect on the page was the opposite of the intent: a reader who had chosen
   * Marathi saw a grid of English headings over Marathi descriptions, which
   * reads as a half-finished translation rather than as a product name.
   *
   * So what stays in Latin script is now only what a reader could not match to
   * the bag any other way: the maker's name, the alphanumeric codes, and the
   * acronyms. A descriptive name transliterates into Devanagari and stays
   * recognisable, because it is the same sounds in the same order. */
  "Buildon Plasters",
  "Buildon",
  "Bondit-151",
  "Bondit",
  "P-20",
  "POP",
  "ISO",
  "IGBC",
  /* Social networks are brand names, not words. यूट्यूब helps nobody find the
     channel. */
  "Facebook",
  "Instagram",
  "LinkedIn",
  "YouTube",
  "WhatsApp",
];

/** The cache key. Hex sha256 of the exact source, so whitespace counts. */
export const hashOf = (text) => createHash("sha256").update(text, "utf8").digest("hex");

/**
 * Worth sending?
 *
 * A URL, a path, a number or a lone symbol costs money to send and comes back
 * either identical or wrong. "Read More >" is worth translating; "/products"
 * is not.
 *
 * NOT the same function as the one in html-text.mjs, which is stricter: that
 * one also requires a Latin letter and rejects anything already in Devanagari.
 * This one is used by i18n-translate.mjs over the CMS JSON; html-text.mjs's is
 * used over built HTML. If you are changing the rules, check whether both need
 * it — the names being identical is the trap here.
 */
export function translatable(text) {
  const value = String(text ?? "").trim();
  if (value.length < 2) return false;
  if (/^[\d\s.,%+\-/:()]+$/.test(value)) return false;
  if (/^(https?:|mailto:|tel:|data:|\/|#)/.test(value)) return false;
  if (/^[\w.-]+\.(webp|png|jpe?g|svg|mp4|pdf|docx?)$/i.test(value)) return false;
  /* A slug: lowercase words joined by hyphens, no spaces. */
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(value)) return false;
  return true;
}

/* ----------------------------------------------------------------- gemini */

/* 2.5, not 2.0: a key issued today lists 2.5-flash and not 2.0, so naming the
   older one fails with a model-not-found that reads like a key problem. */
const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * The instructions are the reason this is worth more than a translation API.
 *
 * Everything below is a mistake a machine makes by default on this content:
 * rendering product names phonetically, choosing literary register over the
 * one a builder reads, and translating the technical terms the trade says in
 * English whatever language it is speaking.
 */
function geminiPrompt(locale, items) {
  return `You are translating the website of Buildon Plasters, an Indian manufacturer of gypsum plaster, from English into ${LOCALE_NAMES[locale]}.

Rules:
- Keep these exactly as written, in Latin script: ${DO_NOT_TRANSLATE.join(", ")}. These are product and standard names; a dealer has to recognise them.
- EVERYTHING else must be in ${LOCALE_NAMES[locale]}, in Devanagari script. Do not leave a word in English because it is technical, because Indian English says it that way, or because the translation is longer. coverage, bag, false ceiling, brand, lighting, air conditioning, workforce, compliance, dealer, distributor, market leader, project and every word like them are translated or transliterated like any other word.
- Where the trade really does say a word in English and ${LOCALE_NAMES[locale]} has no word in everyday use, write it in Devanagari rather than Latin script: false ceiling as a Devanagari transliteration, not "false ceiling".
- A reader who has chosen ${LOCALE_NAMES[locale]} should see no Latin script on the page except the names listed above.
- Write the way a builder, contractor or architect in Maharashtra actually reads — plain and direct. Not formal literary ${LOCALE_NAMES[locale]}.
- Keep the tone of the original. Marketing copy stays marketing copy; a field label stays a label.
- Preserve leading and trailing whitespace, and any punctuation that carries meaning (a trailing ">" or "*" or ":").
- Do not add anything. Do not explain. Do not translate a name, an address, a phone number or an email.

Return ONLY a JSON object whose keys are the index numbers below, as strings, and whose values are the translations. Include every index. No markdown fence, no commentary.

Example shape: {"0": "...", "1": "...", "2": "..."}

Input:
${JSON.stringify(Object.fromEntries(items.map((text, index) => [index, text])), null, 0)}`;
}

/**
 * The free tier is rate-limited by the minute, and a run of this size will
 * meet it. A 429 is "later", not "no": waiting and retrying is the difference
 * between a translated site and 80 strings.
 */
export async function withRetry(run, attempts = 5) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      const message = String(error?.message ?? "");

      /* A DAILY quota is not "later", it is tomorrow. Waiting 20, 40, 80 then
         160 seconds for it achieves nothing but five wasted minutes, and with
         a queue of batches behind it that is the difference between a run that
         reports the problem and one that appears to hang. quotaError() has
         already read Google's own quotaId and retryDelay, so this is a flag
         rather than another guess at the text. */
      if (error?.daily) throw error;

      /* Worth another go: a per-minute rate limit, or the server having a bad
         moment. 2.5 Flash returns 503 "model is overloaded" routinely, and that
         used to end the batch on the first attempt — 500 strings discarded and
         one of the day's 20 requests spent on a condition that a 20-second
         wait would have cleared. On a 20-a-day budget that is 5% of capacity
         thrown away for nothing. */
      const retryable =
        /429|quota|rate/i.test(message) || /Gemini (500|502|503|504)\b/.test(message);
      if (!retryable || attempt >= attempts) throw error;

      /* 20s, 40s, 80s, 160s. The per-minute window is what is being waited
         out, so the first wait is already most of one. */
      const wait = 20_000 * 2 ** (attempt - 1);
      process.stdout.write(`
   ${/429|quota|rate/i.test(message) ? "rate limited" : "server busy"}, waiting ${wait / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

/**
 * A Gemini error, with the one fact that decides what to do about it.
 *
 * A 429 is either "you are going too fast" or "you are done for today", and
 * those need opposite responses — wait a moment, or stop and come back
 * tomorrow. Google distinguishes them clearly, but only in the structured part
 * of the body: a quotaId of "GenerateRequestsPerDayPerProjectPerModel-FreeTier"
 * and a retryDelay in the tens of thousands of seconds.
 *
 * This used to throw `body.slice(0, 300)` and the caller looked for "PerDay" in
 * the text. That could never work: the quotaId sits roughly 900 characters into
 * the response, so the slice cut it off and every daily-quota error was treated
 * as a momentary one — four pointless waits totalling five minutes, per batch.
 * Hence reading the fields rather than searching the prose.
 */
function quotaError(status, body) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    /* Not JSON — nothing to read, so report it as it came. */
    const error = new Error(`Gemini ${status}: ${body.slice(0, 300)}`);
    error.daily = false;
    return error;
  }

  const detail = parsed?.error?.details ?? [];
  const violation = detail
    .flatMap((entry) => entry.violations ?? [])
    .find((v) => v.quotaId);
  const retryDelay = detail.find((entry) => entry.retryDelay)?.retryDelay ?? "";
  const seconds = Number.parseFloat(retryDelay) || 0;

  /* Either signal is enough. The quotaId is the explicit one; the delay is the
     fallback for a quota Google names differently in future — anything asking
     for more than an hour is not something a run should sit and wait for. */
  const daily = /PerDay/i.test(violation?.quotaId ?? "") || seconds > 3600;

  const error = new Error(
    `Gemini ${status}: ${(parsed?.error?.message?.split(". ")[0] || "quota exceeded")}` +
      (violation?.quotaId ? ` [${violation.quotaId}` : "") +
      (violation?.quotaValue ? `, limit ${violation.quotaValue}]` : violation?.quotaId ? "]" : "") +
      (seconds ? ` — retry in ${Math.round(seconds / 3600)}h` : ""),
  );
  error.daily = daily;
  error.retryAfterSeconds = seconds;
  return error;
}

async function geminiTranslate(items, locale, key) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt(locale, items) }] }],
        generationConfig: {
          /* Zero, because the same sentence should translate the same way
             every time: the cache stores one answer and the site shows it for
             years. Creativity here is drift. */
          temperature: 0,
          responseMimeType: "application/json",

          /* 2.5 Flash thinks by default, and thinking tokens come out of the
             SAME output budget the translations need. A batch of 500 strings
             sized against the 65k cap can be pushed over it by a thinking-heavy
             response, which truncates the JSON, fails the parse below, and
             loses the batch along with one of the day's 20 requests. There is
             nothing to reason about here — it is translation against a fixed
             glossary — so the budget is spent on output instead. */
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw quotaError(response.status, body);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text ?? "";

  /* Why the response stopped, before trying to parse it. A MAX_TOKENS or
     SAFETY stop produces text that is not JSON, and reporting that as "not
     JSON" sends whoever reads the log looking for a prompt bug instead of a
     truncated answer. */
  const reason = candidate?.finishReason;
  if (reason && reason !== "STOP") {
    throw new Error(
      `Gemini stopped with finishReason ${reason} after ${items.length} strings` +
        (reason === "MAX_TOKENS" ? " — lower the gemini batch in readProviders()" : ""),
    );
  }

  let out;
  try {
    out = JSON.parse(text.replace(/^```(?:json)?|```$/g, "").trim());
  } catch {
    throw new Error(`Gemini returned something that is not JSON: ${text.slice(0, 200)}`);
  }

  /* Keyed by index, so a dropped item costs ONE string instead of the batch.

     This used to ask for a bare array and require out.length === items.length,
     because position was the only thing tying a translation to its source. The
     model drops an item now and then — it returned 499 for 500 on the first
     real run — and with a positional array there is no way to know WHICH one
     went missing, so everything after it is misaligned and the only safe
     response is to discard all 500. On a budget of 20 requests a day that is
     5% of the day's capacity lost to one missing string.

     An index key removes the ambiguity: whatever comes back is placed where it
     belongs, and a gap is just a gap. The missing string stays uncached and is
     picked up by the next run. */
  if (!out || typeof out !== "object" || Array.isArray(out)) {
    throw new Error(`Gemini returned ${Array.isArray(out) ? "an array" : typeof out}, expected an object keyed by index`);
  }

  /* A value is taken only if it is a non-empty string. The cache is write-once
     — the upsert uses ignoreDuplicates so a hand-corrected translation is
     never overwritten — which makes a bad value permanent:

       null  becomes the literal "null" if stringified, and the page renders
             the word null where a heading was.
       ""    apply() treats as a miss and leaves the page English, but the row
             exists, so the string is never queued again. English for ever,
             with nothing to show why.

     Dropping it here means it is simply retried next time. */
  const result = new Array(items.length);
  let got = 0;
  for (let i = 0; i < items.length; i += 1) {
    const value = out[String(i)];
    if (typeof value === "string" && value.trim() !== "") {
      result[i] = value;
      got += 1;
    }
  }

  /* Nothing usable means something is wrong with the request itself, not with
     one stray item — worth failing loudly rather than silently caching none. */
  if (got === 0) {
    throw new Error(`Gemini returned no usable translations for ${items.length} strings`);
  }

  result.missing = items.length - got;
  return result;
}

/* ------------------------------------------------------------------ azure */

/**
 * No instructions, so the do-not-translate list is enforced by hiding those
 * words before sending and putting them back after. Azure honours the HTML
 * `translate="no"` attribute, which is what the markers become.
 */
async function azureTranslate(items, locale, key, region) {
  const marked = items.map((text) =>
    DO_NOT_TRANSLATE.reduce(
      (acc, term) =>
        acc.replaceAll(term, `<span translate="no">${term}</span>`),
      text,
    ),
  );

  const response = await fetch(
    `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=${locale}&textType=html`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": key,
        ...(region ? { "Ocp-Apim-Subscription-Region": region } : {}),
      },
      body: JSON.stringify(marked.map((text) => ({ text }))),
    },
  );

  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    const error = new Error(`Azure ${response.status}: ${body}`);

    /* 403 on F0 means the month's 2M characters are gone, and no amount of
       waiting inside this run brings them back — so it is flagged the same way
       Gemini's per-day quota is, and withRetry throws rather than sleeping
       through four doublings for nothing.
    
       429 is left alone: that is the per-hour character rate, which a wait
       does clear. */
    error.daily = response.status === 403;
    throw error;
  }

  const data = await response.json();
  return data.map((entry) =>
    String(entry.translations[0].text).replace(/<span translate="no">(.*?)<\/span>/g, "$1"),
  );
}

/* --------------------------------------------------------------- dispatch */

/**
 * Every provider that is configured, best first.
 *
 * readProvider() answers "which one", which was the right question while there
 * was only ever one. The run needs "which one, and what then": Gemini's free
 * tier allows 20 requests a day, and the batch that meets that limit should
 * carry on against Azure rather than ending the run — the strings are the same
 * strings, and the cache does not care which provider filled them in.
 *
 * Order is deliberate and not a preference: Gemini is first because it is free
 * without a card and its limit resets daily, so a day's backlog clears by
 * itself. Azure's free tier is monthly, which makes it the better thing to
 * spend second and the worse thing to spend first.
 *
 * `batch` rides along because the two have incompatible limits and the limit
 * belongs with the provider, not with the loop: Gemini's cap is output tokens
 * (~65k, which 500 Devanagari strings nearly fill) and Azure's is 50,000
 * characters per request (which 500 strings at this site's average of 88 would
 * come within 6,000 of, and a batch of long blog paragraphs would exceed).
 */
export function readProviders(env) {
  const found = [];
  const notes = [];

  const gemini = env.GEMINI_API_KEY;
  if (gemini && !/^AIza/.test(gemini)) {
    notes.push(
      `GEMINI_API_KEY does not look like one: it starts "${gemini.slice(0, 4)}" and a Gemini key starts "AIza". ` +
        "Get one at https://aistudio.google.com/apikey",
    );
  } else if (gemini) {
    found.push({ name: "gemini", key: gemini, batch: 500 });
  }

  const azure = env.AZURE_TRANSLATOR_KEY;
  if (azure) {
    found.push({
      name: "azure",
      key: azure,
      region: env.AZURE_TRANSLATOR_REGION,
      batch: 250,
    });
  }

  return {
    found,
    reason: notes.length
      ? notes.join(" ")
      : "No GEMINI_API_KEY or AZURE_TRANSLATOR_KEY.",
  };
}

export function readProvider(env) {
  const gemini = env.GEMINI_API_KEY;
  const azure = env.AZURE_TRANSLATOR_KEY;

  if (gemini && !/^AIza/.test(gemini)) {
    return {
      name: null,
      reason:
        `GEMINI_API_KEY does not look like one: it starts "${gemini.slice(0, 4)}" and a Gemini key starts "AIza". ` +
        "Get one at https://aistudio.google.com/apikey",
    };
  }
  if (gemini) return { name: "gemini", key: gemini };
  if (azure) {
    return { name: "azure", key: azure, region: env.AZURE_TRANSLATOR_REGION };
  }

  return {
    name: null,
    reason: "No GEMINI_API_KEY or AZURE_TRANSLATOR_KEY in .env.local.",
  };
}

/** Translate a batch. Throws rather than returning half an answer. */
export async function translateBatch(items, locale, provider) {
  if (provider.name === "gemini") {
    return withRetry(() => geminiTranslate(items, locale, provider.key));
  }
  if (provider.name === "azure") {
    return withRetry(() => azureTranslate(items, locale, provider.key, provider.region));
  }
  throw new Error(provider.reason ?? "No translation provider configured.");
}
