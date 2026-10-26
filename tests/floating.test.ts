import { describe, expect, it } from 'vitest';

import { computePosition } from '../src/lib/floating';

const VIEWPORT = { height: 800, width: 1200 };
const FLOATING = { height: 100, width: 200 };
const GAP = 6;

describe('computePosition', () => {
  it('puts the floating element under the anchor, centred, when asked for bottom', () => {
    const anchor = { height: 40, left: 500, top: 100, width: 100 };
    expect(computePosition(anchor, FLOATING, VIEWPORT, 'bottom', GAP)).toEqual({
      left: 450,
      placement: 'bottom',
      top: 146,
    });
  });

  it('aligns the start or the end edges', () => {
    const anchor = { height: 40, left: 500, top: 100, width: 100 };
    expect(computePosition(anchor, FLOATING, VIEWPORT, 'bottom-start', GAP).left).toBe(500);
    expect(computePosition(anchor, FLOATING, VIEWPORT, 'bottom-end', GAP).left).toBe(400);
  });

  it('flips to the opposite side when the asked side has no room', () => {
    const anchor = { height: 40, left: 500, top: 740, width: 100 };
    const result = computePosition(anchor, FLOATING, VIEWPORT, 'bottom-start', GAP);
    expect(result.placement).toBe('top-start');
    expect(result.top).toBe(634);
  });

  it('stays on the asked side when the other side is worse', () => {
    const anchor = { height: 700, left: 500, top: 50, width: 100 };
    expect(computePosition(anchor, FLOATING, VIEWPORT, 'bottom', GAP).placement).toBe('bottom');
  });

  it('keeps the element inside the window along the anchor edge', () => {
    const anchor = { height: 40, left: 1150, top: 100, width: 40 };
    expect(computePosition(anchor, FLOATING, VIEWPORT, 'bottom', GAP).left).toBe(992);
    const nearLeft = { height: 40, left: 0, top: 100, width: 40 };
    expect(computePosition(nearLeft, FLOATING, VIEWPORT, 'bottom', GAP).left).toBe(8);
  });

  it('places beside the anchor for left and right', () => {
    const anchor = { height: 40, left: 500, top: 300, width: 100 };
    expect(computePosition(anchor, FLOATING, VIEWPORT, 'right', GAP)).toEqual({
      left: 606,
      placement: 'right',
      top: 270,
    });
    expect(computePosition(anchor, FLOATING, VIEWPORT, 'left', GAP).left).toBe(294);
  });
});
