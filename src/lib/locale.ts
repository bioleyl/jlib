/** A locale Intl accepts, in its canonical form; undefined (the runtime's own) for an empty or malformed one. */
export function safeLocale(locale: string): string | undefined {
  if (locale.trim() === '') {
    return undefined;
  }
  try {
    return Intl.getCanonicalLocales(locale)[0];
  } catch {
    return undefined;
  }
}

/** The locale to write dates and numbers in: the one asked for, else the page's language, else the runtime's. */
export const pageLocale = (preferred = ''): string | undefined =>
  safeLocale(preferred) ?? safeLocale(document.documentElement.lang);
