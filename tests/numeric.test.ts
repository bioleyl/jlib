import { describe, expect, it } from 'vitest';

import { clamp, decimalsOf, fractionOf, marksOf, parseNumber, roundTo, stepValue } from '../src/lib/numeric';

describe('parseNumber', () => {
  it('reads numbers, and gives null for empty or unreadable text', () => {
    expect(parseNumber('42')).toBe(42);
    expect(parseNumber(' -1.5 ')).toBe(-1.5);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber('12abc')).toBeNull();
    expect(parseNumber('Infinity')).toBeNull();
  });
});

describe('clamp', () => {
  it('keeps a value within the bounds it has', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(12, 0, 10)).toBe(10);
  });

  it('leaves a side without a bound open', () => {
    expect(clamp(-300, null, 10)).toBe(-300);
    expect(clamp(300, 0, null)).toBe(300);
    expect(clamp(7, null, null)).toBe(7);
  });
});

describe('decimalsOf and roundTo', () => {
  it('counts the decimals of a number as written', () => {
    expect(decimalsOf(1)).toBe(0);
    expect(decimalsOf(0.5)).toBe(1);
    expect(decimalsOf(0.25)).toBe(2);
    expect(decimalsOf(1e-7)).toBe(7);
    expect(decimalsOf(Number.NaN)).toBe(0);
  });

  it('rounds to a count of decimals', () => {
    expect(roundTo(0.1 + 0.2, 1)).toBe(0.3);
    expect(roundTo(2.675, 0)).toBe(3);
  });
});

describe('stepValue', () => {
  it('steps up and down without float noise', () => {
    expect(stepValue(0.2, 0.1, 1, null, null)).toBe(0.3);
    expect(stepValue(1, 0.25, -1, null, null)).toBe(0.75);
    expect(stepValue(1.05, 1, 1, null, null)).toBe(2.05);
  });

  it('stays within the bounds', () => {
    expect(stepValue(10, 1, 1, 0, 10)).toBe(10);
    expect(stepValue(0, 5, -1, 0, 10)).toBe(0);
  });

  it('starts from zero when the value is empty', () => {
    expect(stepValue(null, 1, 1, null, null)).toBe(1);
    expect(stepValue(null, 1, -1, 0, null)).toBe(0);
    expect(stepValue(null, 1, 1, 5, 10)).toBe(5);
  });
});

describe('fractionOf', () => {
  it('places a value between min and max', () => {
    expect(fractionOf(50, 0, 100)).toBe(0.5);
    expect(fractionOf(15, 10, 20)).toBe(0.5);
    expect(fractionOf(-5, 0, 100)).toBe(0);
    expect(fractionOf(150, 0, 100)).toBe(1);
  });

  it('gives 0 for an empty range', () => {
    expect(fractionOf(5, 10, 10)).toBe(0);
    expect(fractionOf(5, 10, 0)).toBe(0);
  });
});

describe('marksOf', () => {
  it('reads numbers and objects with labels', () => {
    expect(marksOf([0, 50, { label: 'Max', value: 100 }], 0, 100)).toEqual([
      { value: 0 },
      { value: 50 },
      { label: 'Max', value: 100 },
    ]);
  });

  it('leaves out marks outside the range and unreadable entries', () => {
    expect(marksOf([-10, 20, 'x', null, { label: 'no value' }, 200], 0, 100)).toEqual([{ value: 20 }]);
    expect(marksOf('nope', 0, 100)).toEqual([]);
  });
});
