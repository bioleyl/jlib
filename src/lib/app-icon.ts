// An app's icon as jl-app-icon draws it, and as a file: the favicon and the home screen icon are the same tile.
import { ICON_STROKE_WIDTH } from './icons';

import type { IconNode } from 'lucide';
import type { AppIconColors } from '../types/jl-app-icon.types';

/** The glyph's share of the tile's side, at every size. */
export const GLYPH_SHARE = 0.62;
/** The corner's share of the tile's side. */
export const CORNER_SHARE = 0.26;

// The file's square, and the 24-unit grid lucide draws its glyphs on, scaled into its middle.
const FILE_SIDE = 64;
const GLYPH_GRID = 24;
const DECIMALS = 2;
const ATTRIBUTE_ESCAPES: Readonly<Record<string, string>> = { '"': '&quot;', '&': '&amp;', '<': '&lt;' };
const NEEDS_ESCAPE = /["&<]/g;

const round = (value: number): number => Number(value.toFixed(DECIMALS));

const escapeAttribute = (value: string | number): string =>
  String(value).replace(NEEDS_ESCAPE, (character) => ATTRIBUTE_ESCAPES[character] ?? character);

const attributesOf = (attributes: Record<string, string | number | undefined>): string =>
  Object.entries(attributes)
    .flatMap(([name, value]) => (value === undefined ? [] : [` ${name}="${escapeAttribute(value)}"`]))
    .join('');

/** An app's icon as the text of an SVG file: its glyph in `colors.glyph` on a rounded square of `colors.tile`. */
export function appIconSvg(glyph: IconNode, colors: AppIconColors): string {
  const glyphSide = FILE_SIDE * GLYPH_SHARE;
  const offset = round((FILE_SIDE - glyphSide) / 2);
  const tile = attributesOf({
    fill: colors.tile,
    height: FILE_SIDE,
    rx: round(FILE_SIDE * CORNER_SHARE),
    width: FILE_SIDE,
  });
  const strokes = attributesOf({
    fill: 'none',
    stroke: colors.glyph,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': ICON_STROKE_WIDTH,
    transform: `translate(${offset} ${offset}) scale(${round(glyphSide / GLYPH_GRID)})`,
  });
  const shapes = glyph.map(([tag, attributes]) => `<${tag}${attributesOf(attributes)}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FILE_SIDE} ${FILE_SIDE}"><rect${tile}/><g${strokes}>${shapes}</g></svg>`;
}
