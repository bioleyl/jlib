/** An attribute's value when it is one of the allowed ones, otherwise the fallback. */
export const oneOf =
  <Value extends string>(allowed: readonly Value[], fallback: Value) =>
  (value: string | null): Value =>
    allowed.find((candidate) => candidate === value) ?? fallback;

/**
 * An attribute holding JSON, for the lists and objects a page writes in HTML:
 * `<jl-select options='[{"value":"a","label":"A"}]'>`. Unreadable JSON gives the fallback.
 */
export const jsonOf =
  <Value>(fallback: Value) =>
  (value: string | null): Value => {
    if (value === null || value.trim() === '') {
      return fallback;
    }
    try {
      return JSON.parse(value) as Value;
    } catch {
      return fallback;
    }
  };

/** A number attribute kept within bounds; a missing or unreadable one gives the fallback. */
export const clampedNumber =
  (fallback: number, min: number, max: number) =>
  (value: string | null): number => {
    const parsed = value === null || value.trim() === '' ? Number.NaN : Number(value);
    if (Number.isNaN(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  };

const LIST_START = '[';

/**
 * An attribute holding a list of strings, as HTML writes it: a JSON list (`'["a","b"]'`), or one plain value
 * (`open`) for the common case of a single one. Empty or unreadable gives an empty list.
 */
export const stringList = (value: string | null): string[] => {
  const text = value?.trim() ?? '';
  if (text === '') {
    return [];
  }
  if (!text.startsWith(LIST_START)) {
    return [text];
  }
  const parsed = jsonOf<unknown>([])(text);
  return Array.isArray(parsed) ? parsed.map(String) : [];
};

/**
 * A text the page wrote, in an attribute or an `<option>`, taken as one of a type's values: a choice's value, a
 * field of a table's rows. HTML is not checked against the type, as with `jsonOf`.
 */
export const asValue = <Value extends string>(text: string): Value => text as Value;

/** A text attribute naming one of a type's values (see `asValue`); a missing one gives the fallback. */
export const textOf =
  <Value extends string>(fallback: Value) =>
  (value: string | null): Value =>
    value === null ? fallback : asValue<Value>(value);

/** `stringList` for a list of a type's values (see `asValue`). */
export const textListOf = <Value extends string>(value: string | null): Value[] =>
  stringList(value).map((text) => asValue<Value>(text));
