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
      room: 646,
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
    expect(result.room).toBe(726);
  });

  it('takes the side with more room for what is taller than both, and tells that room', () => {
    const tall = { height: 900, width: 200 };
    const high = { height: 40, left: 500, top: 300, width: 100 };
    expect(computePosition(high, tall, VIEWPORT, 'bottom', GAP)).toMatchObject({ placement: 'bottom', room: 446 });
    const low = { height: 40, left: 500, top: 500, width: 100 };
    expect(computePosition(low, tall, VIEWPORT, 'bottom', GAP)).toMatchObject({ placement: 'top', room: 486 });
    // Capped by that room, it reaches the window's margin, and stays clear of the anchor.
    const capped = { height: 486, width: 200 };
    expect(computePosition(low, capped, VIEWPORT, 'top', GAP)).toMatchObject({ placement: 'top', top: 8 });
  });

  it('tells no room, rather than less than none, by an anchor that covers the window', () => {
    const covering = { height: 2000, left: 500, top: -600, width: 100 };
    expect(computePosition(covering, FLOATING, VIEWPORT, 'bottom', GAP).room).toBe(0);
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
      room: 784,
      top: 270,
    });
    expect(computePosition(anchor, FLOATING, VIEWPORT, 'left', GAP).left).toBe(294);
  });
});

// A menu opened where the pointer is: its anchor is a point, with no gap.
describe('computePosition at a point', () => {
  const at = (left: number, top: number) => ({ height: 0, left, top, width: 0 });

  it('puts the top left corner of the floating element at the point', () => {
    expect(computePosition(at(300, 200), FLOATING, VIEWPORT, 'bottom-start', 0)).toEqual({
      left: 300,
      placement: 'bottom-start',
      room: 592,
      top: 200,
    });
  });

  it('goes above the point when there is no room under it', () => {
    expect(computePosition(at(300, 760), FLOATING, VIEWPORT, 'bottom-start', 0)).toEqual({
      left: 300,
      placement: 'top-start',
      room: 752,
      top: 660,
    });
  });

  it('stays inside the window near its right edge', () => {
    expect(computePosition(at(1150, 200), FLOATING, VIEWPORT, 'bottom-start', 0).left).toBe(992);
  });
});
