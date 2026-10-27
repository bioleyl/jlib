import { css } from '@jadis/core';
import { Star } from 'lucide';

import { JlFormControl } from '../base/jl-form-control';
import { clampedNumber, oneOf } from '../lib/attributes';
import { iconElement, registerIcons } from '../lib/icons';
import { CONTROL_SIZES } from '../lib/options';
import { ratingAfterChoice, ratingAfterKey } from '../lib/rating';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-rating.css?raw';

import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ star: Star });

const ICON_SIZES: Record<ControlSize, number> = { lg: 26, md: 20, sm: 16 };
const DEFAULT_MAX = 5;
// Digit keys set the rating: a scale of ten is as far as they reach, and as far as a row of stars stays readable.
const MAX_LIMIT = 10;
const NO_PREVIEW = 0;

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
      this._refs.slider.toggleAttribute('aria-readonly', value);
    },
    { attribute: 'readonly' }
  );
  readonly icon = this.useChange('star', () => this.renderIcons(), { attribute: 'icon' });
  readonly size = this.useChange<ControlSize>(
    'md',
    (value) => {
      this.reflect('size', value);
      this.renderIcons();
    },
    { attribute: 'size', parse: oneOf(CONTROL_SIZES, 'md') }
  );
  /** The name screen readers give the scale. */
  readonly label = this.useChange(
    jlText('rating'),
    (value) => {
      this._refs.slider.setAttribute('aria-label', value === '' ? jlText('rating') : value);
    },
    { attribute: 'label' }
  );
  readonly required = this.useChange(
    false,
    (value) => {
      this._refs.slider.toggleAttribute('aria-required', value);
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
      this._refs.slider.toggleAttribute('aria-invalid', value);
    },
    { attribute: 'invalid' }
  );

  private readonly _state = { formDisabled: false, preview: NO_PREVIEW };

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
    this.on(slider, 'pointermove', (event) => this.onHover(event));
    this.on(slider, 'pointerleave', () => this.setPreview(NO_PREVIEW));
  }

  protected resetValue(): void {
    this.value.set(clampedNumber(0, 0, MAX_LIMIT)(this.getAttribute('value')));
  }

  protected setDisabledByForm(disabled: boolean): void {
    this._state.formDisabled = disabled;
    // A disabled field gets this call as it upgrades, before its template exists: wait for it.
    this.whenRendered(() => this.renderDisabled(this.disabled.get()));
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
    this.setPreview(NO_PREVIEW);
    this.commit(ratingAfterChoice(this.current(), chosen));
  }

  private onHover(event: PointerEvent): void {
    if (!this.canChange()) {
      return;
    }
    this.setPreview(this.iconValueAt(event) ?? NO_PREVIEW);
  }

  private iconValueAt(event: Event): number | null {
    const icon = (event.target as Element).closest<HTMLElement>('[data-value]');
    return icon === null ? null : Number(icon.dataset.value);
  }

  private setPreview(preview: number): void {
    if (preview === this._state.preview) {
      return;
    }
    this._state.preview = preview;
    this.renderValue();
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

  private renderIcons(): void {
    const name = this.icon.get() === '' ? 'star' : this.icon.get();
    const size = ICON_SIZES[this.size.get()];
    const icons = Array.from({ length: this.max.get() }, (_, index) => (
      <span class="icon" data-value={String(index + 1)}>
        {iconElement(name, size)}
      </span>
    ));
    this._refs.icons.replaceChildren(...icons);
    this.renderValue();
  }

  private renderValue(): void {
    const value = this.current();
    const max = this.max.get();
    const preview = this._state.preview;
    const shown = preview === NO_PREVIEW ? value : preview;
    for (const icon of this._refs.icons.querySelectorAll<HTMLElement>('[data-value]')) {
      icon.classList.toggle('on', Number(icon.dataset.value) <= shown);
    }
    this.reflect('previewing', preview !== NO_PREVIEW);
    const slider = this._refs.slider;
    slider.setAttribute('aria-valuenow', String(value));
    slider.setAttribute('aria-valuemax', String(max));
    slider.setAttribute('aria-valuetext', value === 0 ? 'No rating' : `${value} of ${max}`);
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
    const off = disabled || this._state.formDisabled;
    this.reflect('disabled', disabled);
    this._refs.slider.tabIndex = off ? -1 : 0;
    this._refs.slider.toggleAttribute('aria-disabled', off);
    this.setPreview(NO_PREVIEW);
  }
}

JlRating.register();
