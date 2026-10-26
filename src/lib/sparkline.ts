import type { SparkBox, SparkPoint } from '../types/sparkline.types';

// Coordinates keep two decimals: enough for any screen, short in the markup.
const PRECISION = 100;

const round = (value: number): number => Math.round(value * PRECISION) / PRECISION;

/**
 * The points of a sparkline in a box: evenly spaced from left to right, the highest value at the top and the
 * lowest at the bottom, `inset` away from the edges. One value draws a flat line across; equal values sit in the
 * middle. Values that are not finite numbers are left out.
 */
export function sparklinePoints(values: readonly number[], box: SparkBox): SparkPoint[] {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) {
    return [];
  }
  const series = finite.length === 1 ? [finite[0] ?? 0, finite[0] ?? 0] : finite;
  const min = Math.min(...series);
  const range = Math.max(...series) - min;
  const innerWidth = box.width - box.inset * 2;
  const innerHeight = box.height - box.inset * 2;
  const step = innerWidth / (series.length - 1);
  return series.map((value, index) => ({
    x: round(box.inset + index * step),
    y: round(range === 0 ? box.height / 2 : box.inset + (1 - (value - min) / range) * innerHeight),
  }));
}

/** Points as an SVG `points` attribute: "0,10 25,4 50,8". */
export const pointsAttribute = (points: readonly SparkPoint[]): string =>
  points.map((point) => `${point.x},${point.y}`).join(' ');

/** The area under the line, closed along the bottom of the box, as an SVG `points` attribute. */
export function areaAttribute(points: readonly SparkPoint[], box: SparkBox): string {
  const first = points[0];
  const last = points.at(-1);
  if (first === undefined || last === undefined) {
    return '';
  }
  return pointsAttribute([...points, { x: last.x, y: box.height }, { x: first.x, y: box.height }]);
}
