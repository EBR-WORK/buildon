/**
 * The dictionary for a language, merged over English.
 *
 * Anything a language has not translated falls back to the English value, per
 * field rather than per section — so one new button added in English appears
 * in English on the Marathi page, in the right place, rather than leaving a
 * hole or discarding a page's worth of Marathi.
 */

import { DEFAULT_LOCALE, type Locale } from "./config";
import { en, hi, mr, type Dictionary } from "./ui";

const BY_LOCALE: Record<Locale, unknown> = { en, mr, hi };

/** Deep merge of plain objects. Arrays and primitives replace wholesale. */
function merge<T>(base: T, over: unknown): T {
  if (!over || typeof over !== "object" || Array.isArray(over)) return base;

  const out = { ...(base as object) } as Record<string, unknown>;
  for (const [key, value] of Object.entries(over as Record<string, unknown>)) {
    /* An empty string is not a translation. A key somebody cleared should show
       the English rather than nothing at all. */
    if (value === undefined || value === null || value === "") continue;

    const current = out[key];
    out[key] =
      current && typeof current === "object" && !Array.isArray(current)
        ? merge(current, value)
        : value;
  }
  return out as T;
}

/* Built once per locale. The dictionaries are static, so merging on every
   render would be the same work for the same answer. */
const cache = new Map<Locale, Dictionary>();

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  const hit = cache.get(locale);
  if (hit) return hit;

  const built = locale === DEFAULT_LOCALE ? en : merge(en, BY_LOCALE[locale]);
  cache.set(locale, built);
  return built;
}

export type { Dictionary };
