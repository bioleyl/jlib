import type { SplitOrientation } from '../types/jl-split-view.types';

const FULL = 100;
const HALF = 50;
/** How far one arrow press moves the divider, in percent; ten times that with Shift. */
const KEY_STEP = 2;
const LARGE_STEP = 10;

const KEYS: Record<SplitOrientation, { back: string; forward: string }> = {
  horizontal: { back: 'ArrowLeft', forward: 'ArrowRight' },
  vertical: { back: 'ArrowUp', forward: 'ArrowDown' },
};

/** The smallest share each pane keeps, in percent: never under 0 nor over half. */
export const clampMin = (min: number): number => Math.min(HALF, Math.max(0, min));

/** A divider position kept so that each pane keeps at least `min` percent. */
export const clampSplit = (position: number, min: number): number =>
  Math.min(FULL - clampMin(min), Math.max(clampMin(min), position));

/** Where a pointer sits along the split, in percent of its length from its start; the middle when it has none. */
export const positionAt = (pointer: number, start: number, length: number): number =>
  length > 0 ? ((pointer - start) / length) * FULL : HALF;

/**
 * Where a key moves the divider: arrows along the split by a step (a large one with Shift), Home and End to the
 * ends; null for any other key.
 */
export function positionAfterKey(
  position: number,
  key: string,
  orientation: SplitOrientation,
  min: number,
  large = false
): number | null {
  const step = large ? LARGE_STEP : KEY_STEP;
  const moves = new Map<string, number>([
    [KEYS[orientation].back, position - step],
    [KEYS[orientation].forward, position + step],
    ['End', FULL],
    ['Home', 0],
  ]);
  const next = moves.get(key);
  return next === undefined ? null : clampSplit(next, min);
}
