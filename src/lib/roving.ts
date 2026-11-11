import type { RovingMove } from '../types/roving.types';

const NONE = -1;

/** The first entry that can be chosen. */
export const firstIndex = (enabled: readonly boolean[]): number => enabled.indexOf(true);

/** The last entry that can be chosen. */
export const lastIndex = (enabled: readonly boolean[]): number => enabled.lastIndexOf(true);

const wrap = (index: number, count: number): number => ((index % count) + count) % count;

/** The entry `step` places away from `from` among those that can be chosen, wrapping around the ends. */
export function stepIndex(enabled: readonly boolean[], from: number, step: 1 | -1): number {
  const count = enabled.length;
  const order = Array.from({ length: count }, (_, offset) => wrap(from + step * (offset + 1), count));
  return order.find((index) => enabled[index] === true) ?? NONE;
}

/**
 * Typeahead: the next entry after `from` whose label starts with the letter typed, wrapping around; the search
 * ignores case and the spaces before the label.
 */
export function letterIndex(
  labels: readonly string[],
  enabled: readonly boolean[],
  from: number,
  letter: string
): number {
  const wanted = letter.toLocaleLowerCase();
  const matches = labels.map(
    (label, index) => enabled[index] === true && label.trim().toLocaleLowerCase().startsWith(wanted)
  );
  return stepIndex(matches, from, 1);
}

/**
 * Where the arrow keys of a list or a radio group move the focus, skipping the disabled items as native radios do.
 * The list says which items are disabled; from nowhere (-1), next starts at the first item and previous at the last.
 */
export function rovingIndex(disabled: readonly boolean[], from: number, move: RovingMove): number {
  const enabled = disabled.map((isDisabled) => !isDisabled);
  const moves: Record<RovingMove, () => number> = {
    first: () => firstIndex(enabled),
    last: () => lastIndex(enabled),
    next: () => stepIndex(enabled, from, 1),
    previous: () => stepIndex(enabled, from === NONE ? disabled.length : from, -1),
  };
  return moves[move]();
}
