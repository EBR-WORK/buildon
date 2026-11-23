/**
 * The languages the site is published in.
 *
 * One list. The routing, the switcher, the sitemap, the font loading and the
 * translation script all read from here, so adding Gujarati later is an entry
 * in this file rather than a hunt through components.
 */

export const LOCALES = ["en", "mr", "hi", "te", "kn"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * In the language itself, not in English.
 *
 * A switcher that offers "Marathi" to somebody who reads Marathi is written
 * for the wrong person — they are looking for मराठी.
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  mr: "मराठी",
  hi: "हिंदी",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
};

/** What goes in `<html lang>` and in hreflang. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-IN",
  mr: "mr-IN",
  hi: "hi-IN",
  te: "te-IN",
  kn: "kn-IN",
};

/**
 * The writing system each language uses, for the font a page has to load.
 *
 * Three scripts now, not one: Marathi and Hindi share Devanagari, Telugu and
 * Kannada have their own, and a page that loads the wrong one shows empty
 * boxes rather than words. Each face is declared in globals.css against the
 * unicode-range of its script, so a browser fetches only the one its page
 * actually contains and an English reader fetches none of them.
 */
export const SCRIPT_OF: Record<Locale, "latin" | "devanagari" | "telugu" | "kannada"> = {
  en: "latin",
  mr: "devanagari",
  hi: "devanagari",
  te: "telugu",
  kn: "kannada",
};

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

/**
 * The same page in another language.
 *
 * English lives at the root and the others under a prefix, so every URL that
 * exists today keeps working and nothing that is already indexed moves.
 *
 *   /products        ->  /mr/products
 *   /mr/products     ->  /hi/products
 *   /hi/products     ->  /products
 */
/* Built from LOCALES, not written out: a language added above was previously
   also a regex here and in localeOf(), and missing one of them made the
   switcher send people to a page that did not exist. */
const PREFIXED = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);
const PREFIX = new RegExp(`^/(${PREFIXED.join("|")})(?=/|$)`);

export function localePath(pathname: string, locale: Locale) {
  /* Strip whatever prefix is there now, so this works from any language
     rather than only from English. */
  const bare = pathname.replace(PREFIX, "") || "/";
  if (locale === DEFAULT_LOCALE) return bare;
  return bare === "/" ? `/${locale}` : `/${locale}${bare}`;
}

/** Which language a path is in. */
export function localeOf(pathname: string): Locale {
  const match = PREFIX.exec(pathname);
  return (match?.[1] as Locale) ?? DEFAULT_LOCALE;
}
