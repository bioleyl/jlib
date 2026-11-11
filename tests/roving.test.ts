import { describe, expect, it } from 'vitest';

import { firstIndex, lastIndex, letterIndex, rovingIndex, stepIndex } from '../src/lib/roving';

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
  });

  it('stays on the only enabled item', () => {
    expect(rovingIndex([true, false, true], 1, 'next')).toBe(1);
  });
});

describe('stepIndex', () => {
  const enabled = [true, false, true, true, false];

  it('moves to the next entry that can be chosen', () => {
    expect(stepIndex(enabled, 0, 1)).toBe(2);
    expect(stepIndex(enabled, 3, -1)).toBe(2);
  });

  it('wraps around the ends', () => {
    expect(stepIndex(enabled, 3, 1)).toBe(0);
    expect(stepIndex(enabled, 0, -1)).toBe(3);
  });

  it('stays put when the entry is the only one', () => {
    expect(stepIndex([false, true, false], 1, 1)).toBe(1);
  });

  it('answers -1 when nothing can be chosen', () => {
    expect(stepIndex([false, false], 0, 1)).toBe(-1);
    expect(stepIndex([], 0, 1)).toBe(-1);
  });

  it('starts from before the first entry with -1', () => {
    expect(stepIndex(enabled, -1, 1)).toBe(0);
  });
});

describe('firstIndex and lastIndex', () => {
  it('find the ends among the entries that can be chosen', () => {
    expect(firstIndex([false, true, true, false])).toBe(1);
    expect(lastIndex([false, true, true, false])).toBe(2);
    expect(firstIndex([false])).toBe(-1);
  });
});

describe('letterIndex', () => {
  const labels = ['Rename', 'Duplicate', 'Download', ' delete', 'Archive'];
  const enabled = [true, true, true, true, true];

  it('finds the next label starting with the letter, ignoring case', () => {
    expect(letterIndex(labels, enabled, 0, 'd')).toBe(1);
    expect(letterIndex(labels, enabled, 1, 'D')).toBe(2);
    expect(letterIndex(labels, enabled, 2, 'd')).toBe(3);
  });

  it('wraps around to the first match', () => {
    expect(letterIndex(labels, enabled, 3, 'd')).toBe(1);
  });

  it('skips what cannot be chosen', () => {
    expect(letterIndex(labels, [true, false, true, true, true], 0, 'd')).toBe(2);
  });

  it('answers -1 when no label matches', () => {
    expect(letterIndex(labels, enabled, 0, 'z')).toBe(-1);
  });
});
