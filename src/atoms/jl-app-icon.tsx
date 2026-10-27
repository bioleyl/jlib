import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { clampedNumber } from '../lib/attributes';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-app-icon.css?raw';
import { JlIcon } from './jl-icon';

const DEFAULT_SIZE = 28;
const MIN_SIZE = 12;
const MAX_SIZE = 512;
// The glyph's share of the tile, and the tile's corner: the same proportions at every size.
const GLYPH_SHARE = 0.62;
const CORNER_SHARE = 0.26;

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
