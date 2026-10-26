import { describe, expect, it } from 'vitest';

import { firstEnabledIndex, lastEnabledIndex, rovingIndex } from '../src/lib/roving-index';

const ALL_ENABLED = [false, false, false, false];
const SECOND_DISABLED = [false, true, false, false];

describe('rovingIndex', () => {
  it('moves to the next and previous items, wrapping around the ends', () => {
    expect(rovingIndex(ALL_ENABLED, 0, 'next')).toBe(1);
    expect(rovingIndex(ALL_ENABLED, 3, 'next')).toBe(0);
    expect(rovingIndex(ALL_ENABLED, 2, 'previous')).toBe(1);
    expect(rovingIndex(ALL_ENABLED, 0, 'previous')).toBe(3);
  });

  it('skips disabled items', () => {
    expect(rovingIndex(SECOND_DISABLED, 0, 'next')).toBe(2);
    expect(rovingIndex(SECOND_DISABLED, 2, 'previous')).toBe(0);
    expect(rovingIndex([true, false, false, true], 2, 'next')).toBe(1);
  });

  it('goes to the first or the last enabled item', () => {
    expect(rovingIndex([true, false, false, true], 2, 'first')).toBe(1);
    expect(rovingIndex([true, false, false, true], 1, 'last')).toBe(2);
  });

  it('starts from the ends when nothing has the focus', () => {
    expect(rovingIndex(ALL_ENABLED, -1, 'next')).toBe(0);
    expect(rovingIndex(ALL_ENABLED, -1, 'previous')).toBe(3);
  });

  it('gives -1 when every item is disabled or there are none', () => {
    expect(rovingIndex([true, true], 0, 'next')).toBe(-1);
    expect(rovingIndex([], -1, 'next')).toBe(-1);
    expect(firstEnabledIndex([true, true])).toBe(-1);
    expect(lastEnabledIndex([])).toBe(-1);
  });

  it('stays on the only enabled item', () => {
    expect(rovingIndex([true, false, true], 1, 'next')).toBe(1);
  });
});
