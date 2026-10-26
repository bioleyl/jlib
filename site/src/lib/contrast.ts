import type { Rgb } from '../types/contrast.types';

const CHANNEL_MAX = 255;
// The WCAG 2 relative luminance: sRGB channels linearised, then weighted.
const LINEAR_THRESHOLD = 0.04045;
const LINEAR_DIVISOR = 12.92;
const GAMMA_OFFSET = 0.055;
const GAMMA_DIVISOR = 1.055;
const GAMMA = 2.4;
const WEIGHTS = { blue: 0.0722, green: 0.7152, red: 0.2126 } as const;
const FLARE = 0.05;

/** The level a contrast reaches for normal text: AAA from 7:1, AA from 4.5:1, AA large text only from 3:1. */
export const CONTRAST_LEVELS = [
  { label: 'AAA', min: 7 },
  { label: 'AA', min: 4.5 },
  { label: 'AA large', min: 3 },
] as const;

const linear = (channel: number): number => {
  const value = channel / CHANNEL_MAX;
  return value <= LINEAR_THRESHOLD ? value / LINEAR_DIVISOR : ((value + GAMMA_OFFSET) / GAMMA_DIVISOR) ** GAMMA;
};

export const luminance = (colour: Rgb): number =>
  WEIGHTS.red * linear(colour.red) + WEIGHTS.green * linear(colour.green) + WEIGHTS.blue * linear(colour.blue);

/** The WCAG contrast ratio of two colours, from 1 (the same) to 21 (black on white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + FLARE) / (dark + FLARE);
}

/** The best level a ratio reaches, or 'Fails' under 3:1. */
export const contrastLevel = (ratio: number): string =>
  CONTRAST_LEVELS.find((level) => ratio >= level.min)?.label ?? 'Fails';

const RGB_PATTERN = /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/;
const HEX_PATTERN = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i;

/** A computed colour (`rgb(0, 114, 179)`) or a six-digit hex as channels; null for anything else. */
export function parseColour(text: string): Rgb | null {
  const rgb = RGB_PATTERN.exec(text);
  const hex = HEX_PATTERN.exec(text.trim());
  if (rgb !== null) {
    return { blue: Number(rgb[3]), green: Number(rgb[2]), red: Number(rgb[1]) };
  }
  if (hex !== null) {
    return {
      blue: Number.parseInt(hex[3] ?? '0', 16),
      green: Number.parseInt(hex[2] ?? '0', 16),
      red: Number.parseInt(hex[1] ?? '0', 16),
    };
  }
  return null;
}

const toHex = (channel: number): string => channel.toString(16).padStart(2, '0');

export const hexOf = (colour: Rgb): string => `#${toHex(colour.red)}${toHex(colour.green)}${toHex(colour.blue)}`;
