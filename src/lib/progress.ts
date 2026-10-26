const PERCENT = 100;

/**
 * A number attribute that may be absent: `null` when it is missing or unreadable. A progress without a value is
 * indeterminate.
 */
export const optionalNumber = (value: string | null): number | null => {
  const parsed = value === null || value.trim() === '' ? Number.NaN : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** How far along a value is, from 0 to 1; a maximum of 0 or less counts as no progress. */
export function progressRatio(value: number, max: number): number {
  if (!(max > 0) || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value / max));
}

/** A ratio as the percentage people read: 0.456 gives "46%". */
export const percentLabel = (ratio: number): string => `${Math.round(ratio * PERCENT)}%`;

/** A ratio in percent, for a path drawn with `pathLength="100"`: 0.25 gives 25. */
export const percentOf = (ratio: number): number => ratio * PERCENT;

/**
 * The circle of a progress ring of `size` pixels, its stroke `thickness` wide: the stroke stays inside the box,
 * and is at most half the size.
 */
export function ringGeometry(size: number, thickness: number): { center: number; radius: number; stroke: number } {
  const box = Math.max(0, size);
  const stroke = Math.min(Math.max(0, thickness), box / 2);
  return { center: box / 2, radius: (box - stroke) / 2, stroke };
}
