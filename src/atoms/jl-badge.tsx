import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { TONES } from '../lib/options';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-badge.css?raw';
import { JlIcon } from './jl-icon';

import type { StatusLook } from '../types/jl-badge.types';
import type { Tone } from '../types/options.types';

const ICON_SIZE = 13;

/**
 * A short status, coloured by its tone: "Active", "3 new", "Failed". A `dot` marks a live state; a `hint` says what
 * the state means, as a tooltip. `showStatus()` takes the look of a state from an app's map of them.
 */
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
  /** What the state means, as a tooltip: "Waiting for logistics to prepare it." */
  readonly hint = this.useChange('', (value) => setOrRemove(this._refs.badge, 'title', value), {
    attribute: 'hint',
  });

  private readonly _refs = this.useRefs((ref) => ({
    badge: ref('.badge'),
    dot: ref('.dot'),
    icon: ref(JlIcon),
    label: ref('.label'),
  }));

  /** Shows a state as an app's map of states describes it: its label, tone, icon and hint. */
  showStatus(look: StatusLook): void {
    // As attributes too: a badge that moves in the page reads its attributes again, and must find this state.
    const attributes: Record<string, string> = {
      hint: look.hint ?? '',
      icon: look.icon ?? '',
      label: look.label,
      tone: look.tone,
    };
    for (const [name, value] of Object.entries(attributes)) {
      setOrRemove(this, name, value);
    }
    this.label.set(look.label);
    this.tone.set(look.tone);
    this.icon.set(look.icon ?? '');
    this.hint.set(look.hint ?? '');
  }

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
