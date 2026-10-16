/**
 * The languages the site is published in.
 *
 * One list. The routing, the switcher, the sitemap, the font loading and the
 * translation script all read from here, so adding Gujarati later is an entry
 * in this file rather than a hunt through components.
 */

export const LOCALES = ["en", "mr", "hi"] as const;

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
};

/** What goes in `<html lang>` and in hreflang. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-IN",
  mr: "mr-IN",
  hi: "hi-IN",
};

/** Both Marathi and Hindi are written in Devanagari; English is not. */
export const needsDevanagari = (locale: Locale) => locale !== "en";

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
export function localePath(pathname: string, locale: Locale) {
  /* Strip whatever prefix is there now, so this works from any language
     rather than only from English. */
  const bare = pathname.replace(/^\/(mr|hi)(?=\/|$)/, "") || "/";
  if (locale === DEFAULT_LOCALE) return bare;
  return bare === "/" ? `/${locale}` : `/${locale}${bare}`;
}

/** Which language a path is in. */
export function localeOf(pathname: string): Locale {
  const match = /^\/(mr|hi)(?=\/|$)/.exec(pathname);
  return (match?.[1] as Locale) ?? DEFAULT_LOCALE;
}
