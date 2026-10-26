import type { Align, Placement, Point, Rect, Side, Size } from '../types/floating.types';

export const PLACEMENTS: readonly Placement[] = [
  'top',
  'top-start',
  'top-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'left-start',
  'left-end',
  'right',
  'right-start',
  'right-end',
];

const OPPOSITE: Record<Side, Side> = { bottom: 'top', left: 'right', right: 'left', top: 'bottom' };
// How far a floating element stays from the edges of the window.
const VIEWPORT_MARGIN = 8;
const DEFAULT_GAP = 6;

const splitPlacement = (placement: Placement): { side: Side; align: Align } => {
  const [side, align] = placement.split('-') as [Side, Align | undefined];
  return { align: align ?? 'center', side };
};

const joinPlacement = (side: Side, align: Align): Placement =>
  (align === 'center' ? side : `${side}-${align}`) as Placement;

const isVertical = (side: Side): boolean => side === 'top' || side === 'bottom';

/** Where the floating element starts along the anchor's edge: its start, its centre, or its end. */
function alignedOffset(start: number, anchorLength: number, floatingLength: number, align: Align): number {
  const offsets: Record<Align, number> = {
    center: start + (anchorLength - floatingLength) / 2,
    end: start + anchorLength - floatingLength,
    start,
  };
  return offsets[align];
}

function pointFor(anchor: Rect, floating: Size, side: Side, align: Align, gap: number): Point {
  const left = alignedOffset(anchor.left, anchor.width, floating.width, align);
  const top = alignedOffset(anchor.top, anchor.height, floating.height, align);
  const points: Record<Side, Point> = {
    bottom: { left, top: anchor.top + anchor.height + gap },
    left: { left: anchor.left - floating.width - gap, top },
    right: { left: anchor.left + anchor.width + gap, top },
    top: { left, top: anchor.top - floating.height - gap },
  };
  return points[side];
}

/** How much of the floating element would leave the window on its main side; 0 when it fits. */
function overflowOn(point: Point, floating: Size, viewport: Size, side: Side): number {
  const overflows: Record<Side, number> = {
    bottom: point.top + floating.height - (viewport.height - VIEWPORT_MARGIN),
    left: VIEWPORT_MARGIN - point.left,
    right: point.left + floating.width - (viewport.width - VIEWPORT_MARGIN),
    top: VIEWPORT_MARGIN - point.top,
  };
  return Math.max(0, overflows[side]);
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Where to put a floating element next to its anchor, in window coordinates: on the asked side when it fits,
 * otherwise on the opposite side if that leaves more of it visible; then kept inside the window.
 */
export function computePosition(
  anchor: Rect,
  floating: Size,
  viewport: Size,
  placement: Placement,
  gap = DEFAULT_GAP
): Point & { placement: Placement } {
  const { side, align } = splitPlacement(placement);
  const wanted = pointFor(anchor, floating, side, align, gap);
  const flipped = pointFor(anchor, floating, OPPOSITE[side], align, gap);
  const wantedOverflow = overflowOn(wanted, floating, viewport, side);
  const flippedOverflow = overflowOn(flipped, floating, viewport, OPPOSITE[side]);
  const useFlipped = wantedOverflow > 0 && flippedOverflow < wantedOverflow;
  const finalSide = useFlipped ? OPPOSITE[side] : side;
  const point = useFlipped ? flipped : wanted;
  const maxLeft = viewport.width - floating.width - VIEWPORT_MARGIN;
  const maxTop = viewport.height - floating.height - VIEWPORT_MARGIN;
  return {
    left: isVertical(finalSide) ? clamp(point.left, VIEWPORT_MARGIN, maxLeft) : point.left,
    placement: joinPlacement(finalSide, align),
    top: isVertical(finalSide) ? point.top : clamp(point.top, VIEWPORT_MARGIN, maxTop),
  };
}

/** Puts a fixed-position element next to its anchor; returns the placement it got after flipping. */
export function placeFloating(
  anchor: Element,
  floating: HTMLElement,
  placement: Placement,
  gap?: number
): Placement {
  const rect = anchor.getBoundingClientRect();
  const viewport = { height: window.innerHeight, width: document.documentElement.clientWidth };
  const size = { height: floating.offsetHeight, width: floating.offsetWidth };
  const result = computePosition(rect, size, viewport, placement, gap);
  floating.style.left = `${Math.round(result.left)}px`;
  floating.style.top = `${Math.round(result.top)}px`;
  floating.dataset.placement = result.placement;
  return result.placement;
}

/** Keeps a floating element by its anchor while the page scrolls or resizes, until the signal aborts. */
export function followAnchor(
  anchor: Element,
  floating: HTMLElement,
  placement: Placement,
  signal: AbortSignal,
  gap?: number
): void {
  const update = (): void => {
    placeFloating(anchor, floating, placement, gap);
  };
  window.addEventListener('scroll', update, { capture: true, passive: true, signal });
  window.addEventListener('resize', update, { passive: true, signal });
  update();
}
