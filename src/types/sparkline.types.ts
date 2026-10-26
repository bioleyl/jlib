/** A point of a sparkline, in the coordinates of its SVG `viewBox`. */
export type SparkPoint = {
  x: number;
  y: number;
};

/** The drawing box of a sparkline: its `viewBox` size, and the room kept on each side for the stroke. */
export type SparkBox = {
  width: number;
  height: number;
  inset: number;
};
