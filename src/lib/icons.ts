import { CircleAlert, createElement } from 'lucide';

import type { IconNode } from 'lucide';

// Drawn for a name nobody registered, so the layout keeps its place.
const FALLBACK: IconNode = CircleAlert;
const STROKE_WIDTH = 1.9;

/**
 * The icons `jl-icon` can draw, by name. It starts empty: each component registers the icons it draws itself, and
 * a page registers the names it writes, so a bundle holds only the icons in use.
 */
const registry = new Map<string, IconNode>();
const warned = new Set<string>();

/**
 * Adds icons to the ones `jl-icon` knows, by name. Any lucide icon works:
 * `registerIcons({ rocket: Rocket })` after `import { Rocket } from 'lucide'`, or all the usual ones at once with
 * `registerIcons(COMMON_ICONS)`.
 */
export function registerIcons(icons: Record<string, IconNode>): void {
  for (const [name, node] of Object.entries(icons)) {
    registry.set(name, node);
  }
}

/** The names `jl-icon` can draw now, in alphabetical order. */
export const iconNames = (): string[] => [...registry.keys()].sort();

export const hasIcon = (name: string): boolean => registry.has(name);

/** The fallback for a name nobody registered, with a warning once per name to say how to fix it. */
function missing(name: string): IconNode {
  if (!warned.has(name)) {
    warned.add(name);
    console.warn(
      `jl-icon: no icon named "${name}". Register it: registerIcons({ '${name}': … }) with an icon from lucide, or registerIcons(COMMON_ICONS).`
    );
  }
  return FALLBACK;
}

/** An icon as an SVG element; a name nobody registered draws a neutral mark instead of nothing. */
export function iconElement(name: string, size: number): SVGElement {
  return createElement(registry.get(name) ?? missing(name), {
    'aria-hidden': 'true',
    height: size,
    'stroke-width': STROKE_WIDTH,
    width: size,
  });
}
