import { css } from '@jadis/core';
import { Minus, Plus } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlFormControl } from '../base/jl-form-control';
import { oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { clamp, parseNumber, stepValue } from '../lib/numeric';
import { CONTROL_SIZES } from '../lib/options';
import { jlText } from '../lib/texts';
import { BASE_STYLES, CONTROL_STYLES } from '../styles/shared';
import styles from './jl-number-input.css?raw';

import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ minus: Minus, plus: Plus });

const DEFAULT_STEP = 1;
// Page Up and Page Down move ten steps at a time.
const PAGE_STEPS = 10;
const ICON_SIZE = 14;

const positiveStep = (value: string | null): number => {
  const parsed = parseNumber(value);
  return parsed === null || parsed <= 0 ? DEFAULT_STEP : parsed;
};

/**
 * A number field with − and + buttons. The arrow keys step it (Page Up/Down by ten steps, Home and End to the
 * bounds); what is typed is read and kept between `min` and `max` when the field is left. Empty is `null`.
 */
export class JlNumberInput extends JlFormControl {
  static readonly selector = 'jl-number-input';

  readonly events = this.useEvents<{ change: number | null }>();

  readonly min = this.useChange<number | null>(null, () => this.renderBounds(), {
    attribute: 'min',
    parse: parseNumber,
  });
  readonly max = this.useChange<number | null>(null, () => this.renderBounds(), {
    attribute: 'max',
    parse: parseNumber,
  });
  readonly step = this.useChange(DEFAULT_STEP, () => undefined, { attribute: 'step', parse: positiveStep });
  /** The number, or `null` while the field is empty. */
  readonly value = this.useChange<number | null>(null, (value) => this.renderValue(value), {
    attribute: 'value',
    parse: parseNumber,
  });
  readonly placeholder = this.useChange('', (value) => setOrRemove(this._refs.native, 'placeholder', value), {
    attribute: 'placeholder',
  });
  /** The field's name for screen readers, when no visible label names it. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.native, 'aria-label', value), {
    attribute: 'label',
  });
  readonly size = this.useChange<ControlSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(CONTROL_SIZES, 'md'),
  });
  readonly required = this.useChange(
    false,
    (value) => {
      this._refs.native.toggleAttribute('aria-required', value);
      this.reflect('required', value);
      this.renderValidity();
    },
    { attribute: 'required' }
  );
  readonly disabled = this.useChange(false, (value) => this.renderDisabled(value), { attribute: 'disabled' });
  /** Draws the field in the danger colour, for an error the page found itself. */
  readonly invalid = this.useChange(
    false,
    (value) => {
      this.reflect('invalid', value);
      this._refs.native.toggleAttribute('aria-invalid', value);
    },
    { attribute: 'invalid' }
  );

  private readonly _state = { disabledByForm: false };

  private readonly _refs = this.useRefs((ref) => ({
    down: ref<HTMLButtonElement>('.down'),
    native: ref<HTMLInputElement>('input'),
    up: ref<HTMLButtonElement>('.up'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  /** Adds one step (or `count` steps, negative to go down), within the bounds, and fires `change`. */
  stepBy(count: number): void {
    const direction = count < 0 ? -1 : 1;
    const amount = this.step.get() * Math.abs(count);
    this.commitNumber(stepValue(this.typedNumber(), amount, direction, this.min.get(), this.max.get()));
  }

  templateHtml(): Node {
    return (
      <div class="control" attrs={{ part: 'base' }}>
        <button class="action step down" type="button" tabIndex={-1} aria-label={jlText('decrease')}>
          <JlIcon name="minus" size={ICON_SIZE} />
        </button>
        <input class="native" type="text" inputMode="decimal" role="spinbutton" autocomplete="off" />
        <button class="action step up" type="button" tabIndex={-1} aria-label={jlText('increase')}>
          <JlIcon name="plus" size={ICON_SIZE} />
        </button>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${CONTROL_STYLES}${styles}`;
  }

  onConnect(): void {
    const native = this._refs.native;
    // The native event crosses the shadow root: the field reports numbers in change, not text as it is typed.
    this.on(native, 'input', (event) => event.stopPropagation());
    this.on(native, 'blur', () => this.commitText());
    this.on(native, 'keydown', (event) => this.onKey(event));
    for (const button of [this._refs.down, this._refs.up]) {
      // Keeps the focus in the field, so the arrows still work after a press.
      this.on(button, 'mousedown', (event) => event.preventDefault());
    }
    this.on(this._refs.down, 'click', () => this.stepBy(-1));
    this.on(this._refs.up, 'click', () => this.stepBy(1));
  }

  protected resetValue(): void {
    this.value.set(parseNumber(this.getAttribute('value')));
  }

  /** The browser calls it for a disabled fieldset and for the element's own disabled attribute, even before render. */
  protected setDisabledByForm(disabled: boolean): void {
    this._state.disabledByForm = disabled;
    this.whenRendered(() => this.renderDisabled(this.disabled.get()));
  }

  private onKey(event: KeyboardEvent): void {
    const actions = new Map<string, () => void>([
      ['ArrowDown', () => this.stepBy(-1)],
      ['ArrowUp', () => this.stepBy(1)],
      ['End', () => this.goToBound(this.max.get())],
      ['Enter', () => this.commitText()],
      ['Home', () => this.goToBound(this.min.get())],
      ['PageDown', () => this.stepBy(-PAGE_STEPS)],
      ['PageUp', () => this.stepBy(PAGE_STEPS)],
    ]);
    const action = actions.get(event.key);
    if (action === undefined) {
      return;
    }
    event.preventDefault();
    action();
  }

  /** Home and End go to a bound when there is one, and otherwise move the caret as in any field. */
  private goToBound(bound: number | null): void {
    if (bound === null) {
      return;
    }
    this.commitNumber(bound);
  }

  /** The number typed so far, or the value when the text cannot be read. */
  private typedNumber(): number | null {
    const text = this._refs.native.value;
    return text.trim() === '' ? null : (parseNumber(text) ?? this.value.get());
  }

  /** Reads what was typed: empty gives null, unreadable text goes back to the value, a number is kept in bounds. */
  private commitText(): void {
    const text = this._refs.native.value;
    if (text.trim() === '') {
      this.commit(null);
      return;
    }
    const typed = parseNumber(text);
    if (typed === null) {
      this.renderValue(this.value.get());
      return;
    }
    this.commitNumber(typed);
  }

  private commitNumber(value: number): void {
    this.commit(clamp(value, this.min.get(), this.max.get()));
  }

  private commit(value: number | null): void {
    const changed = value !== this.value.get();
    this.value.set(value);
    if (changed) {
      this.events.emit('change', value);
    }
  }

  private renderValue(value: number | null): void {
    const native = this._refs.native;
    native.value = value === null ? '' : String(value);
    setOrRemove(native, 'aria-valuenow', value === null ? '' : String(value));
    this.internals.setFormValue(value === null ? '' : String(value));
    this.renderButtons();
    this.renderValidity();
  }

  private renderBounds(): void {
    setOrRemove(this._refs.native, 'aria-valuemin', String(this.min.get() ?? ''));
    setOrRemove(this._refs.native, 'aria-valuemax', String(this.max.get() ?? ''));
    this.renderButtons();
  }

  private renderDisabled(disabled: boolean): void {
    this._refs.native.disabled = disabled || this._state.disabledByForm;
    this.reflect('disabled', disabled);
    this.renderButtons();
  }

  /** A button that cannot move the value further is disabled. */
  private renderButtons(): void {
    const value = this.value.get();
    const max = this.max.get();
    const min = this.min.get();
    const off = this.disabled.get() || this._state.disabledByForm;
    this._refs.down.disabled = off || (value !== null && min !== null && value <= min);
    this._refs.up.disabled = off || (value !== null && max !== null && value >= max);
  }

  private renderValidity(): void {
    const missing = this.required.get() && this.value.get() === null;
    if (!missing) {
      this.internals.setValidity({});
      return;
    }
    this.internals.setValidity({ valueMissing: true }, jlText('fillField'), this._refs.native);
  }
}

JlNumberInput.register();
