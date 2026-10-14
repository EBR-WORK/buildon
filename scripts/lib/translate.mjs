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
  "Buildon",
  "Bondit-151",
  "Bondit Plaster Bond+",
  "Gypsum Plaster One Coat",
  "Imported Gypsum Plaster",
  "Gypsum Master Plaster",
  "Gypsum Plaster Perlite One-Coat Super 200",
  "Gypsum Plaster Vermiculite",
  "Classic Gypsum Plaster",
  "Buildon P-20 Ready Mix Plaster",
  "P-20",
  "POP",
  "ISO",
  "IGBC",
];

/** The cache key. Hex sha256 of the exact source, so whitespace counts. */
export const hashOf = (text) => createHash("sha256").update(text, "utf8").digest("hex");

/**
 * Worth sending?
 *
 * A URL, a path, a number or a lone symbol costs money to send and comes back
 * either identical or wrong. "Read More >" is worth translating; "/products"
 * is not.
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

const GEMINI_MODEL = "gemini-2.0-flash";

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
- Keep these exactly as written, in English: ${DO_NOT_TRANSLATE.join(", ")}.
- Technical and trade terms that Indian construction says in English stay in English or are transliterated, never translated: gypsum, plaster, one coat, setting time, coverage, bonding agent, primer, POP, mesh, bag, dealer, distributor.
- Write the way a builder, contractor or architect in Maharashtra actually reads — plain and direct. Not formal literary ${LOCALE_NAMES[locale]}.
- Keep the tone of the original. Marketing copy stays marketing copy; a field label stays a label.
- Preserve leading and trailing whitespace, and any punctuation that carries meaning (a trailing ">" or "*" or ":").
- Do not add anything. Do not explain. Do not translate a name, an address, a phone number or an email.

Return ONLY a JSON array of strings, the same length and order as the input. No markdown fence, no commentary.

Input:
${JSON.stringify(items, null, 0)}`;
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
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  let out;
  try {
    out = JSON.parse(text.replace(/^```(?:json)?|```$/g, "").trim());
  } catch {
    throw new Error(`Gemini returned something that is not JSON: ${text.slice(0, 200)}`);
  }

  /* Length mismatch means the model dropped or merged an item, and silently
     writing those to the cache would misalign every string after it. */
  if (!Array.isArray(out) || out.length !== items.length) {
    throw new Error(`Gemini returned ${out?.length} strings for ${items.length}`);
  }

  return out.map(String);
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
    throw new Error(`Azure ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const data = await response.json();
  return data.map((entry) =>
    String(entry.translations[0].text).replace(/<span translate="no">(.*?)<\/span>/g, "$1"),
  );
}

/* --------------------------------------------------------------- dispatch */

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
  if (provider.name === "gemini") return geminiTranslate(items, locale, provider.key);
  if (provider.name === "azure") {
    return azureTranslate(items, locale, provider.key, provider.region);
  }
  throw new Error(provider.reason ?? "No translation provider configured.");
}
