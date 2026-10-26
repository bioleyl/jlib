import type { RovingMove } from '../types/roving-index.types';

const NONE = -1;

/** The first item that is not disabled, or -1 when every item is. */
export function firstEnabledIndex(disabled: readonly boolean[]): number {
  return disabled.indexOf(false);
}

/** The last item that is not disabled, or -1 when every item is. */
export function lastEnabledIndex(disabled: readonly boolean[]): number {
  return disabled.lastIndexOf(false);
}

/** The next enabled item after `from` in a direction, wrapping around the ends; -1 when none is enabled. */
function steppedIndex(disabled: readonly boolean[], from: number, step: 1 | -1): number {
  const count = disabled.length;
  for (let offset = 1; offset <= count; offset += 1) {
    const index = (((from + step * offset) % count) + count) % count;
    if (disabled[index] === false) {
      return index;
    }
  }
  return NONE;
}

/**
 * Where a move goes from the item at `from`, skipping disabled items as native radios do. From nowhere (-1), next
 * starts at the first item and previous at the last.
 */
export function rovingIndex(disabled: readonly boolean[], from: number, move: RovingMove): number {
  const moves: Record<RovingMove, () => number> = {
    first: () => firstEnabledIndex(disabled),
    last: () => lastEnabledIndex(disabled),
    next: () => steppedIndex(disabled, from, 1),
    previous: () => steppedIndex(disabled, from === NONE ? disabled.length : from, -1),
  };
  return moves[move]();
}
