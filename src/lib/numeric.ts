import type { SliderMark } from '../types/jl-slider.types';

const NO_DECIMALS = 0;

/** A number written in a field or an attribute; empty or unreadable text gives null. */
export function parseNumber(text: string | null): number | null {
  if (text === null || text.trim() === '') {
    return null;
  }
  const parsed = Number(text.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

/** A number kept within bounds; a null bound does not limit that side. */
export function clamp(value: number, min: number | null, max: number | null): number {
  const floored = min === null ? value : Math.max(min, value);
  return max === null ? floored : Math.min(max, floored);
}

/** How many decimals a number has as written: 0.25 has 2, so sums of steps print without float noise. */
export function decimalsOf(value: number): number {
  if (!Number.isFinite(value) || Number.isInteger(value)) {
    return NO_DECIMALS;
  }
  const [mantissa = '', exponent = '0'] = String(value).split('e');
  const decimals = mantissa.split('.')[1]?.length ?? NO_DECIMALS;
  return Math.max(NO_DECIMALS, decimals - Number(exponent));
}

export function roundTo(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

/**
 * The value one step up or down, within bounds, rounded to the decimals of the step and the value. An empty value
 * counts as zero.
 */
export function stepValue(
  value: number | null,
  step: number,
  direction: 1 | -1,
  min: number | null,
  max: number | null
): number {
  const start = value ?? 0;
  const decimals = Math.max(decimalsOf(step), decimalsOf(start));
  return clamp(roundTo(start + step * direction, decimals), min, max);
}

/** Where a value sits between min and max, from 0 to 1; an empty range gives 0. */
export function fractionOf(value: number, min: number, max: number): number {
  if (max <= min) {
    return 0;
  }
  return clamp((value - min) / (max - min), 0, 1);
}

const isMarkObject = (mark: unknown): mark is SliderMark =>
  typeof mark === 'object' && mark !== null && typeof (mark as SliderMark).value === 'number';

/**
 * The marks of a slider from what a page wrote: numbers (`[0, 50, 100]`) or objects with a label
 * (`[{ "value": 0, "label": "Off" }]`). Marks outside the range and unreadable entries are left out.
 */
export function marksOf(raw: unknown, min: number, max: number): SliderMark[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((mark): SliderMark | null => {
      if (typeof mark === 'number') {
        return { value: mark };
      }
      return isMarkObject(mark) ? mark : null;
    })
    .filter((mark): mark is SliderMark => mark !== null && mark.value >= min && mark.value <= max);
}
