import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { TONES } from '../lib/options';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-badge.css?raw';
import { JlIcon } from './jl-icon';

import type { Tone } from '../types/options.types';

const ICON_SIZE = 13;

/** A short status, coloured by its tone: "Active", "3 new", "Failed". A `dot` marks a live state. */
export class JlBadge extends JlElement {
  static readonly selector = 'jl-badge';

  readonly label = this.useChange(
    '',
    (value) => {
      this._refs.label.textContent = value;
    },
    { attribute: 'label' }
  );
  readonly tone = this.useChange<Tone>('neutral', (value) => this.reflect('tone', value), {
    attribute: 'tone',
    parse: oneOf(TONES, 'neutral'),
  });
  readonly icon = this.useChange('', () => this.renderMarker(), { attribute: 'icon' });
  readonly dot = this.useChange(false, () => this.renderMarker(), { attribute: 'dot' });
  /** Filled with the tone's colour, for what must stand out. */
  readonly solid = this.useChange(false, (value) => this.reflect('solid', value), { attribute: 'solid' });

  private readonly _refs = this.useRefs((ref) => ({
    dot: ref('.dot'),
    icon: ref<JlIcon>('jl-icon'),
    label: ref('.label'),
  }));

  templateHtml(): Node {
    return (
      <span class="badge" attrs={{ part: 'base' }}>
        <span class="dot" hidden />
        <JlIcon size={ICON_SIZE} hidden />
        <span class="label" />
        <slot />
      </span>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  /** An icon wins over the dot: a badge shows one marker at most. */
  private renderMarker(): void {
    const icon = this.icon.get();
    this._refs.icon.name.set(icon);
    this._refs.icon.hidden = icon === '';
    this._refs.dot.hidden = icon !== '' || !this.dot.get();
  }
}

JlBadge.register();
