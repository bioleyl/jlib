const DIGIT = /^\d$/;

/** A digit key sets that many, when the scale has room for it. */
function ratingOfDigit(key: string, max: number): number | null {
  const rating = Number(key);
  return rating <= max ? rating : null;
}

/**
 * The rating a key gives, as a slider reads keys: right and up add one, left and down take one, Home empties it,
 * End fills it, a digit sets that many (when it fits). Null for any other key.
 */
export function ratingAfterKey(value: number, key: string, max: number): number | null {
  if (DIGIT.test(key)) {
    return ratingOfDigit(key, max);
  }
  const moves = new Map<string, number>([
    ['ArrowDown', value - 1],
    ['ArrowLeft', value - 1],
    ['ArrowRight', value + 1],
    ['ArrowUp', value + 1],
    ['End', max],
    ['Home', 0],
  ]);
  const next = moves.get(key);
  return next === undefined ? null : Math.min(max, Math.max(0, next));
}

/** Choosing the rating already given clears it: a second press on the third star leaves none. */
export const ratingAfterChoice = (value: number, chosen: number): number => (chosen === value ? 0 : chosen);
