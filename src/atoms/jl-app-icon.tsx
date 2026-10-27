import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { appIconSvg, CORNER_SHARE, GLYPH_SHARE } from '../lib/app-icon';
import { clampedNumber } from '../lib/attributes';
import { iconNode } from '../lib/icons';
import { adoptTokens } from '../lib/tokens';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-app-icon.css?raw';
import { JlIcon } from './jl-icon';

const DEFAULT_SIZE = 28;
const MIN_SIZE = 12;
const MAX_SIZE = 512;
// The tokens the tile is drawn in, and the favicon the page shows.
const TILE_TOKEN = '--jl-brand';
const GLYPH_TOKEN = '--jl-on-brand';
const FAVICON_SELECTOR = 'link[rel="icon"]';
const FAVICON_REL = 'icon';
const SVG_TYPE = 'image/svg+xml';

/**
 * Makes an app's icon the page's favicon: the tile `jl-app-icon` draws, its glyph a registered icon name, in the
 * theme's `--jl-brand` and `--jl-on-brand` as the document has them, so a page's own theme shows in the tab too.
 */
export function setFavicon(icon: string): void {
  adoptTokens();
  const style = getComputedStyle(document.documentElement);
  const svg = appIconSvg(iconNode(icon), {
    glyph: style.getPropertyValue(GLYPH_TOKEN).trim(),
    tile: style.getPropertyValue(TILE_TOKEN).trim(),
  });
  const link =
    document.head.querySelector<HTMLLinkElement>(FAVICON_SELECTOR)
    ?? document.head.appendChild(document.createElement('link'));
  link.rel = FAVICON_REL;
  link.type = SVG_TYPE;
  link.href = `data:${SVG_TYPE},${encodeURIComponent(svg)}`;
}

/**
 * An app's icon: its glyph in white on a rounded tile of the brand's blue, one family for every SyWare app. Beside
 * the wordmark at the top of the side nav, alone in a folded rail or a phone's top bar; the favicon and the home
 * screen icon draw the same tile. The SyWare mark stays the company's. Decorative unless it has a `label`.
 */
export class JlAppIcon extends JlElement {
  static readonly selector = 'jl-app-icon';

  /** The app's glyph, a registered icon name: `workflow`, `package`. */
  readonly icon = this.useChange('', (value) => this._refs.glyph.name.set(value), { attribute: 'icon' });
  /** The tile's side, in pixels. */
  readonly size = this.useChange(DEFAULT_SIZE, (value) => this.renderSize(value), {
    attribute: 'size',
    parse: clampedNumber(DEFAULT_SIZE, MIN_SIZE, MAX_SIZE),
  });
  /** The app's name, for screen readers when no wordmark beside it says it. */
  readonly label = this.useChange('', (value) => this.renderLabel(value), { attribute: 'label' });

  private readonly _refs = this.useRefs((ref) => ({
    glyph: ref(JlIcon),
    tile: ref('.tile'),
  }));

  templateHtml(): Node {
    return (
      <span class="tile" aria-hidden="true" attrs={{ part: 'base' }}>
        <JlIcon size={Math.round(DEFAULT_SIZE * GLYPH_SHARE)} />
      </span>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private renderSize(size: number): void {
    this._refs.tile.style.setProperty('--size', `${size}px`);
    this._refs.tile.style.setProperty('--corner', `${Math.round(size * CORNER_SHARE)}px`);
    this._refs.glyph.size.set(Math.round(size * GLYPH_SHARE));
  }

  private renderLabel(label: string): void {
    const tile = this._refs.tile;
    if (label === '') {
      tile.setAttribute('aria-hidden', 'true');
      tile.removeAttribute('role');
      tile.removeAttribute('aria-label');
      return;
    }
    tile.removeAttribute('aria-hidden');
    tile.setAttribute('role', 'img');
    tile.setAttribute('aria-label', label);
  }
}

JlAppIcon.register();
