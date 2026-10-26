import { describe, expect, it } from 'vitest';

import { optionalNumber, percentLabel, percentOf, progressRatio, ringGeometry } from '../src/lib/progress';

describe('optionalNumber', () => {
  it('reads numbers and gives null for a missing or unreadable value', () => {
    expect(optionalNumber('42.5')).toBe(42.5);
    expect(optionalNumber('0')).toBe(0);
    expect(optionalNumber(null)).toBeNull();
    expect(optionalNumber(' ')).toBeNull();
    expect(optionalNumber('half')).toBeNull();
  });
});

describe('progressRatio', () => {
  it('divides by the maximum and keeps the result between 0 and 1', () => {
    expect(progressRatio(25, 100)).toBe(0.25);
    expect(progressRatio(3, 4)).toBe(0.75);
    expect(progressRatio(150, 100)).toBe(1);
    expect(progressRatio(-5, 100)).toBe(0);
  });

  it('counts a maximum of zero or less as no progress', () => {
    expect(progressRatio(10, 0)).toBe(0);
    expect(progressRatio(10, -1)).toBe(0);
  });
});

describe('percentLabel and percentOf', () => {
  it('rounds to a whole percentage for people', () => {
    expect(percentLabel(0.456)).toBe('46%');
    expect(percentLabel(1)).toBe('100%');
    expect(percentOf(0.25)).toBe(25);
  });
});

describe('ringGeometry', () => {
  it('keeps the stroke inside the box', () => {
    expect(ringGeometry(40, 4)).toEqual({ center: 20, radius: 18, stroke: 4 });
  });

  it('limits the stroke to half the size', () => {
    expect(ringGeometry(20, 30)).toEqual({ center: 10, radius: 5, stroke: 10 });
  });
});
