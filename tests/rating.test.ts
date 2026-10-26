import { describe, expect, it } from 'vitest';

import { ratingAfterChoice, ratingAfterKey } from '../src/lib/rating';

describe('ratingAfterKey', () => {
  it('adds and takes one with the arrows, within the scale', () => {
    expect(ratingAfterKey(3, 'ArrowRight', 5)).toBe(4);
    expect(ratingAfterKey(3, 'ArrowUp', 5)).toBe(4);
    expect(ratingAfterKey(3, 'ArrowLeft', 5)).toBe(2);
    expect(ratingAfterKey(5, 'ArrowRight', 5)).toBe(5);
    expect(ratingAfterKey(0, 'ArrowDown', 5)).toBe(0);
  });

  it('empties and fills with Home and End', () => {
    expect(ratingAfterKey(3, 'Home', 5)).toBe(0);
    expect(ratingAfterKey(3, 'End', 10)).toBe(10);
  });

  it('sets the rating of a digit when it fits', () => {
    expect(ratingAfterKey(1, '4', 5)).toBe(4);
    expect(ratingAfterKey(1, '0', 5)).toBe(0);
    expect(ratingAfterKey(1, '7', 5)).toBeNull();
  });

  it('ignores other keys', () => {
    expect(ratingAfterKey(1, 'a', 5)).toBeNull();
  });
});

describe('ratingAfterChoice', () => {
  it('clears the rating when the same one is chosen again', () => {
    expect(ratingAfterChoice(3, 3)).toBe(0);
    expect(ratingAfterChoice(3, 4)).toBe(4);
  });
});
