import { describe, expect, it } from 'vitest';

import { clampSplit, positionAfterKey, positionAt } from '../src/lib/split';

describe('clampSplit', () => {
  it('keeps each pane at least its minimum share', () => {
    expect(clampSplit(5, 15)).toBe(15);
    expect(clampSplit(95, 15)).toBe(85);
    expect(clampSplit(40, 15)).toBe(40);
  });

  it('keeps the minimum itself between 0 and half', () => {
    expect(clampSplit(10, 80)).toBe(50);
    expect(clampSplit(-10, -5)).toBe(0);
  });
});

describe('positionAt', () => {
  it('gives the pointer position in percent of the length', () => {
    expect(positionAt(150, 100, 200)).toBe(25);
    expect(positionAt(100, 100, 0)).toBe(50);
  });
});

describe('positionAfterKey', () => {
  it('moves along the split with the arrows of its orientation', () => {
    expect(positionAfterKey(50, 'ArrowRight', 'horizontal', 15)).toBe(52);
    expect(positionAfterKey(50, 'ArrowLeft', 'horizontal', 15, true)).toBe(40);
    expect(positionAfterKey(50, 'ArrowDown', 'vertical', 15)).toBe(52);
    expect(positionAfterKey(50, 'ArrowDown', 'horizontal', 15)).toBeNull();
  });

  it('goes to the ends with Home and End, within the minimum', () => {
    expect(positionAfterKey(50, 'Home', 'horizontal', 15)).toBe(15);
    expect(positionAfterKey(50, 'End', 'vertical', 20)).toBe(80);
  });
});
