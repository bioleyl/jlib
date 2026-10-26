import type { Rect, Side } from '../types/floating.types';

const isVertical = (side: Side): boolean => side === 'top' || side === 'bottom';

/**
 * Where a floating element's arrow goes along the edge that faces its anchor, in pixels from that edge's start: in
 * front of the anchor's centre, kept `margin` pixels away from the corners.
 */
export function arrowOffset(anchor: Rect, floating: Rect, side: Side, margin: number): number {
  const vertical = isVertical(side);
  const anchorCentre = vertical ? anchor.left + anchor.width / 2 : anchor.top + anchor.height / 2;
  const start = vertical ? floating.left : floating.top;
  const length = vertical ? floating.width : floating.height;
  const offset = anchorCentre - start;
  return Math.min(Math.max(offset, margin), Math.max(margin, length - margin));
}
