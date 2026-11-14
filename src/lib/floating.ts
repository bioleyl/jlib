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

/** The height a floating element can take on a side of its anchor without leaving the window. */
function roomOn(anchor: Rect, viewport: Size, side: Side, gap: number): number {
  const besideRoom = viewport.height - 2 * VIEWPORT_MARGIN;
  const rooms: Record<Side, number> = {
    bottom: viewport.height - VIEWPORT_MARGIN - (anchor.top + anchor.height + gap),
    left: besideRoom,
    right: besideRoom,
    top: anchor.top - gap - VIEWPORT_MARGIN,
  };
  return Math.max(0, Math.floor(rooms[side]));
}

/**
 * Where to put a floating element next to its anchor, in window coordinates: on the asked side when it fits,
 * otherwise on the opposite side if that leaves more of it visible; then kept inside the window. `room` is the
 * height it can take there without leaving the window.
 */
export function computePosition(
  anchor: Rect,
  floating: Size,
  viewport: Size,
  placement: Placement,
  gap = DEFAULT_GAP
): Point & { placement: Placement; room: number } {
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
    room: roomOn(anchor, viewport, finalSide, gap),
    top: isVertical(finalSide) ? point.top : clamp(point.top, VIEWPORT_MARGIN, maxTop),
  };
}

/**
 * Puts a fixed-position element next to its anchor, and gives what it measured: the anchor's rect, the element's
 * rect where it went, and the placement it got after flipping. Something drawn from them (an arrow) needs no reading
 * after the writes, which would lay the page out again.
 */
export function positionFloating(
  anchor: Element,
  floating: HTMLElement,
  placement: Placement,
  gap?: number
): { anchor: Rect; floating: Rect; placement: Placement } {
  const rect = anchor.getBoundingClientRect();
  return { anchor: rect, ...positionBy(rect, floating, placement, gap) };
}

/** The room on its side, told to the floating element: a panel that may be taller caps its height with it, and scrolls. */
const ROOM = '--room';

/**
 * Puts a fixed-position element next to a rectangle of the window, and gives where it went. It tells the element
 * the room it has there (`--room`); one whose height follows it is placed again by its new height, on the side it got.
 */
function positionBy(
  rect: Rect,
  floating: HTMLElement,
  placement: Placement,
  gap?: number
): { floating: Rect; placement: Placement } {
  const viewport = { height: window.innerHeight, width: document.documentElement.clientWidth };
  const size = { height: floating.offsetHeight, width: floating.offsetWidth };
  let result = computePosition(rect, size, viewport, placement, gap);
  const room = `${result.room}px`;
  if (floating.style.getPropertyValue(ROOM) !== room) {
    floating.style.setProperty(ROOM, room);
    const height = floating.offsetHeight;
    if (height !== size.height) {
      size.height = height;
      result = computePosition(rect, size, viewport, result.placement, gap);
    }
  }
  const left = Math.round(result.left);
  const top = Math.round(result.top);
  floating.style.left = `${left}px`;
  floating.style.top = `${top}px`;
  floating.dataset.placement = result.placement;
  return { floating: { ...size, left, top }, placement: result.placement };
}

const AT_POINT: Placement = 'bottom-start';
const NO_GAP = 0;

/**
 * Puts a fixed-position element at a point of the window, as a menu opens where the pointer asked for it: its top
 * left corner there, above the point when there is no room under it, and kept inside the window.
 */
export function placeAtPoint(point: Point, floating: HTMLElement): void {
  forgetRoom(floating);
  positionBy({ ...point, height: 0, width: 0 }, floating, AT_POINT, NO_GAP);
}

/**
 * Lets an element that opens again take its whole height before it is measured: capped by the room of its last
 * opening, it would look as if it fitted on a side with less room than the other.
 */
function forgetRoom(floating: HTMLElement): void {
  floating.style.removeProperty(ROOM);
}

/** Puts a fixed-position element next to its anchor; returns the placement it got after flipping. */
export function placeFloating(
  anchor: Element,
  floating: HTMLElement,
  placement: Placement,
  gap?: number
): Placement {
  return positionFloating(anchor, floating, placement, gap).placement;
}

/**
 * The elements a node is drawn in, up to the root element: a slotted element's parent is its slot, a shadow root's
 * is its host.
 */
function flatAncestors(node: Node): Element[] {
  const ancestors: Element[] = [];
  let current: Node | null = node;
  while (current !== null) {
    const parent: Node | null = (current instanceof Element ? current.assignedSlot : null) ?? current.parentNode;
    current = parent instanceof ShadowRoot ? parent.host : parent;
    if (current instanceof Element) {
      ancestors.push(current);
    }
  }
  return ancestors;
}

/**
 * Calls `update` whenever the anchor may have moved in the window, until the signal aborts: the window resized, the
 * page scrolled, or one of the elements the anchor is drawn in did. An element's `scroll` event does not bubble, and
 * one in a shadow root (an app shell's main area) never leaves it: the window does not hear it, its element does.
 */
export function whenAnchorMoves(anchor: Element, update: () => void, signal: AbortSignal): void {
  const options = { passive: true, signal };
  window.addEventListener('scroll', update, options);
  window.addEventListener('resize', update, options);
  for (const ancestor of flatAncestors(anchor)) {
    ancestor.addEventListener('scroll', update, options);
  }
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
  whenAnchorMoves(anchor, update, signal);
  forgetRoom(floating);
  update();
}
