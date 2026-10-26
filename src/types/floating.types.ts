export type Side = 'top' | 'bottom' | 'left' | 'right';

export type Align = 'start' | 'center' | 'end';

/** A side of the anchor, and where along that side: `bottom-start` is under the anchor, left edges aligned. */
export type Placement = Side | `${Side}-start` | `${Side}-end`;

export type Point = { top: number; left: number };

export type Size = { width: number; height: number };

export type Rect = Point & Size;
