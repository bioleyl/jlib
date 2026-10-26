import { describe, expect, it } from 'vitest';

import { areaAttribute, pointsAttribute, sparklinePoints } from '../src/lib/sparkline';

const BOX = { height: 20, inset: 2, width: 100 };

describe('sparklinePoints', () => {
  it('spreads the values across the width, the highest at the top', () => {
    expect(sparklinePoints([0, 10, 5], BOX)).toEqual([
      { x: 2, y: 18 },
      { x: 50, y: 2 },
      { x: 98, y: 10 },
    ]);
  });

  it('draws one value as a flat line across, and equal values in the middle', () => {
    expect(sparklinePoints([7], BOX)).toEqual([
      { x: 2, y: 10 },
      { x: 98, y: 10 },
    ]);
    expect(sparklinePoints([3, 3, 3], BOX).map((point) => point.y)).toEqual([10, 10, 10]);
  });

  it('leaves out values that are not numbers, and gives nothing for none', () => {
    expect(sparklinePoints([1, Number.NaN, 2], BOX)).toHaveLength(2);
    expect(sparklinePoints([], BOX)).toEqual([]);
  });

  it('rounds to two decimals', () => {
    const points = sparklinePoints([0, 1, 2, 3], { height: 10, inset: 0, width: 10 });
    expect(points[1]).toEqual({ x: 3.33, y: 6.67 });
  });
});

describe('pointsAttribute and areaAttribute', () => {
  it('writes points for SVG, and closes the area along the bottom', () => {
    const points = sparklinePoints([0, 10], BOX);
    expect(pointsAttribute(points)).toBe('2,18 98,2');
    expect(areaAttribute(points, BOX)).toBe('2,18 98,2 98,20 2,20');
    expect(areaAttribute([], BOX)).toBe('');
  });
});
