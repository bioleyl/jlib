import { describe, expect, it } from 'vitest';

import { firstIndex, lastIndex, letterIndex, stepIndex } from '../src/lib/roving';

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
