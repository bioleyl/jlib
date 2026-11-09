// Intl's formatters and collators are slow to make and hold no state: one per locale and options, for every cell,
// day or label written with it. A table made one per number or date cell, a calendar page sixteen per draw.

const dateFormats = new Map<string, Intl.DateTimeFormat>();
const numberFormats = new Map<string, Intl.NumberFormat>();
const collators = new Map<string, Intl.Collator>();

const keyOf = (locale: string | undefined, options: object | undefined): string =>
  `${locale ?? ''} ${JSON.stringify(options ?? {})}`;

function cached<Made>(made: Map<string, Made>, key: string, make: () => Made): Made {
  const found = made.get(key);
  if (found !== undefined) {
    return found;
  }
  const making = make();
  made.set(key, making);
  return making;
}

/** The `Intl.DateTimeFormat` of a locale and options, made once. */
export const dateTimeFormat = (
  locale: string | undefined,
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat =>
  cached(dateFormats, keyOf(locale, options), () => new Intl.DateTimeFormat(locale, options));

/** The `Intl.NumberFormat` of a locale and options, made once. */
export const numberFormat = (locale: string | undefined, options?: Intl.NumberFormatOptions): Intl.NumberFormat =>
  cached(numberFormats, keyOf(locale, options), () => new Intl.NumberFormat(locale, options));

/** The `Intl.Collator` of a locale and options, made once: what `localeCompare` makes again on every call. */
export const collator = (locale: string | undefined, options?: Intl.CollatorOptions): Intl.Collator =>
  cached(collators, keyOf(locale, options), () => new Intl.Collator(locale, options));
