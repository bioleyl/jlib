const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

/** A size for CSS: a plain number is in pixels ("120" gives "120px"); anything else is kept ("50%", "8rem"). */
export function cssLength(value: string): string {
  const trimmed = value.trim();
  return PLAIN_NUMBER.test(trimmed) ? `${trimmed}px` : trimmed;
}
