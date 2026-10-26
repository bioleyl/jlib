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
