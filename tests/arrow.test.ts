import { describe, expect, it } from 'vitest';

import { arrowOffset } from '../src/lib/arrow';

const MARGIN = 10;

describe('arrowOffset', () => {
  it('points at the centre of the anchor along a top or bottom edge', () => {
    const anchor = { height: 30, left: 100, top: 200, width: 40 };
    const floating = { height: 30, left: 70, top: 160, width: 100 };
    expect(arrowOffset(anchor, floating, 'top', MARGIN)).toBe(50);
    expect(arrowOffset(anchor, floating, 'bottom', MARGIN)).toBe(50);
  });

  it('points at the middle of the anchor along a left or right edge', () => {
    const anchor = { height: 40, left: 300, top: 100, width: 30 };
    const floating = { height: 100, left: 340, top: 90, width: 120 };
    expect(arrowOffset(anchor, floating, 'right', MARGIN)).toBe(30);
  });

  it('keeps away from the corners when the floating element was pushed aside', () => {
    const anchor = { height: 20, left: 0, top: 200, width: 10 };
    const floating = { height: 30, left: 8, top: 160, width: 100 };
    expect(arrowOffset(anchor, floating, 'top', MARGIN)).toBe(MARGIN);
    const far = { height: 20, left: 500, top: 200, width: 10 };
    expect(arrowOffset(far, floating, 'top', MARGIN)).toBe(100 - MARGIN);
  });
});
