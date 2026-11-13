import { css } from '@jadis/core';
import { Star } from 'lucide';

import { JlFormControl } from '../base/jl-form-control';
import { clampedNumber, oneOf } from '../lib/attributes';
import { setAriaFlag } from '../lib/dom';
import { iconElement, registerIcons } from '../lib/icons';
import { CONTROL_SIZES } from '../lib/options';
import { ratingAfterChoice, ratingAfterKey } from '../lib/rating';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-rating.css?inline';

import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ star: Star });

// The SVGs' own size; the CSS gives them the size of the `size` input.
const ICON_SIZE = 20;
const DEFAULT_ICON = 'star';
const DEFAULT_MAX = 5;
// Digit keys set the rating: a scale of ten is as far as they reach, and as far as a row of stars stays readable.
const MAX_LIMIT = 10;

/**
 * A row of stars (or hearts, or any icon) to give a score: a click, the arrows or a digit set it, and choosing the
 * score already given clears it. Hovering previews the score a click would give.
 */
export class JlRating extends JlFormControl {
  static readonly selector = 'jl-rating';

  readonly events = this.useEvents<{ change: number }>();

  readonly value = this.useChange(0, () => this.renderValue(), {
    attribute: 'value',
    parse: clampedNumber(0, 0, MAX_LIMIT),
  });
  /** How many icons the scale has. */
  readonly max = this.useChange(DEFAULT_MAX, () => this.renderIcons(), {
    attribute: 'max',
    parse: clampedNumber(DEFAULT_MAX, 1, MAX_LIMIT),
  });
  /** Shows a score that cannot be changed: an average, a review. */
  readonly readonly = this.useChange(
    false,
    (value) => {
      this.reflect('readonly', value);
      setAriaFlag(this._refs.slider, 'aria-readonly', value);
    },
    { attribute: 'readonly' }
  );
  readonly icon = this.useChange(DEFAULT_ICON, () => this.renderIcons(), { attribute: 'icon' });
  readonly size = this.useChange<ControlSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(CONTROL_SIZES, 'md'),
  });
  /** The name screen readers give the scale. */
  readonly label = this.useChange('', () => this.renderLabel(), { attribute: 'label' });
  readonly required = this.useChange(
    false,
    (value) => {
      setAriaFlag(this._refs.slider, 'aria-required', value);
      this.renderValidity();
    },
    { attribute: 'required' }
  );
  readonly disabled = this.useChange(false, (value) => this.renderDisabled(value), { attribute: 'disabled' });
  /** Draws the empty icons in the danger colour, for an error the page found itself. */
  readonly invalid = this.useChange(
    false,
    (value) => {
      this.reflect('invalid', value);
      setAriaFlag(this._refs.slider, 'aria-invalid', value);
    },
    { attribute: 'invalid' }
  );

  // The icon the row is drawn with: max and icon run again at connection, and a row of the same icons stays.
  private readonly _state = { drawnIcon: '', formDisabled: false };

  private readonly _refs = this.useRefs((ref) => ({
    icons: ref('.icons'),
    slider: ref('.rating'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.slider.focus(options);
  }

  templateHtml(): Node {
    return (
      <div class="rating" role="slider" tabIndex={0} aria-valuenow="0" aria-valuemin="0" attrs={{ part: 'base' }}>
        <span class="icons" />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const slider = this._refs.slider;
    this.on(slider, 'keydown', (event) => this.onKey(event));
    this.on(slider, 'click', (event) => this.onChoose(event));
  }

  protected resetValue(): void {
    this.value.set(clampedNumber(0, 0, MAX_LIMIT)(this.getAttribute('value')));
  }

  protected setDisabledByForm(disabled: boolean): void {
    this._state.formDisabled = disabled;
    // A disabled field gets this call as it upgrades, before its template exists: wait for it.
    this.whenRendered(() => this.drawDisabled());
  }

  private canChange(): boolean {
    return !this.readonly.get() && !this.disabled.get() && !this._state.formDisabled;
  }

  private onKey(event: KeyboardEvent): void {
    if (!this.canChange()) {
      return;
    }
    const next = ratingAfterKey(this.current(), event.key, this.max.get());
    if (next === null) {
      return;
    }
    event.preventDefault();
    this.commit(next);
  }

  private onChoose(event: MouseEvent): void {
    const chosen = this.iconValueAt(event);
    if (chosen === null || !this.canChange()) {
      return;
    }
    this.commit(ratingAfterChoice(this.current(), chosen));
  }

  private iconValueAt(event: Event): number | null {
    const icon = (event.target as Element).closest<HTMLElement>('[data-value]');
    return icon === null ? null : Number(icon.dataset.value);
  }

  /** The value as the scale shows it: never past its end. */
  private current(): number {
    return Math.min(this.value.get(), this.max.get());
  }

  private commit(value: number): void {
    if (value === this.current()) {
      return;
    }
    this.value.set(value);
    this.events.emit('change', value);
  }

  protected drawTexts(): void {
    this.renderLabel();
    this.renderValue();
  }

  private renderLabel(): void {
    this._refs.slider.setAttribute('aria-label', this.label.get() || jlText('rating'));
  }

  /** Draws the row of icons again only for another icon or another count. */
  private renderIcons(): void {
    const name = this.icon.get() || DEFAULT_ICON;
    const max = this.max.get();
    const row = this._refs.icons;
    if (name === this._state.drawnIcon && row.childElementCount === max) {
      return;
    }
    this._state.drawnIcon = name;
    const icons = Array.from({ length: max }, (_, index) => (
      <span class="icon" data-value={String(index + 1)}>
        {iconElement(name, ICON_SIZE)}
      </span>
    ));
    row.replaceChildren(...icons);
    this.renderValue();
  }

  /** The score, in the icons and for screen readers; the score a pointer would give is the CSS's. */
  private renderValue(): void {
    const value = this.current();
    const max = this.max.get();
    for (const icon of this._refs.icons.querySelectorAll<HTMLElement>('[data-value]')) {
      icon.classList.toggle('on', Number(icon.dataset.value) <= value);
    }
    const slider = this._refs.slider;
    slider.setAttribute('aria-valuenow', String(value));
    slider.setAttribute('aria-valuemax', String(max));
    slider.setAttribute('aria-valuetext', value === 0 ? jlText('noRating') : jlText('ratingOf', { max, value }));
    this.internals.setFormValue(String(value));
    this.renderValidity();
  }

  private renderValidity(): void {
    if (this.required.get() && this.current() === 0) {
      this.internals.setValidity({ valueMissing: true }, jlText('chooseRating'), this._refs.slider);
      return;
    }
    this.internals.setValidity({});
  }

  private renderDisabled(disabled: boolean): void {
    this.reflect('disabled', disabled);
    this.drawDisabled();
  }

  /** Without the attribute: the form says its state before the `disabled` input has taken the attribute's change. */
  private drawDisabled(): void {
    const off = this.disabled.get() || this._state.formDisabled;
    this._refs.slider.tabIndex = off ? -1 : 0;
    setAriaFlag(this._refs.slider, 'aria-disabled', off);
  }
}

JlRating.register();
