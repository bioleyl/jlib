import { css } from '@jadis/core';

import { JlFormControl } from '../base/jl-form-control';
import { oneOf } from '../lib/attributes';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-switch.css?raw';

import type { SwitchSize } from '../types/jl-switch.types';

export const SWITCH_SIZES: readonly SwitchSize[] = ['md', 'sm'];

const DEFAULT_VALUE = 'on';
// BASE_STYLES' class for what only screen readers get.
const SCREEN_READER_ONLY = 'sr-only';

/**
 * An on/off setting that applies at once, such as "Dark mode" or "Email me". `checked` is the state; the form gets
 * `value` while it is on. For a choice confirmed later with a button, prefer a checkbox.
 */
export class JlSwitch extends JlFormControl {
  static readonly selector = 'jl-switch';

  readonly events = this.useEvents<{ change: boolean }>();

  readonly checked = this.useChange(false, (value) => this.renderChecked(value), { attribute: 'checked' });
  /** The text beside the switch. */
  readonly label = this.useChange(
    '',
    (value) => {
      this._refs.label.textContent = value;
      this._refs.label.hidden = value === '';
      this.renderText();
    },
    { attribute: 'label' }
  );
  /** A smaller line under the label. */
  readonly description = this.useChange(
    '',
    (value) => {
      this._refs.description.textContent = value;
      this._refs.description.hidden = value === '';
      this.renderText();
    },
    { attribute: 'description' }
  );
  /**
   * Keeps the label for screen readers only, for a switch whose meaning the page already shows beside it (an "On"
   * or "Off" next to the track).
   */
  readonly hideLabel = this.useChange(false, () => this.renderText(), { attribute: 'hide-label' });
  readonly size = this.useChange<SwitchSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(SWITCH_SIZES, 'md'),
  });
  /** What the form gets while the switch is on. */
  readonly value = this.useChange(DEFAULT_VALUE, () => this.renderFormValue(), { attribute: 'value' });
  readonly disabled = this.useChange(
    false,
    (value) => {
      this.reflect('disabled', value);
      this.renderDisabled();
    },
    { attribute: 'disabled' }
  );

  private readonly _form = { disabled: false };

  private readonly _refs = this.useRefs((ref) => ({
    description: ref('.description'),
    label: ref('.label'),
    native: ref<HTMLInputElement>('input'),
    slot: ref('slot'),
    text: ref('.text'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  /** Flips the state, as a click would, and fires `change`. */
  toggle(): void {
    this.commit(!this.checked.get());
  }

  templateHtml(): Node {
    return (
      <label class="wrap" attrs={{ part: 'base' }}>
        <span class="track">
          <input
            type="checkbox"
            role="switch"
            class="native"
            aria-checked="false"
            aria-describedby="description"
          />
          <span class="thumb" />
        </span>
        <span class="text" hidden>
          <span class="title">
            <span class="label" hidden />
            <slot />
          </span>
          <span id="description" class="description" hidden />
        </span>
      </label>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const native = this._refs.native;
    this.on(native, 'change', () => this.commit(native.checked));
    // The first slotchange can come before onConnect: draw the text now, then follow the changes.
    this.renderText();
    this.on(this._refs.slot, 'slotchange', () => this.renderText());
  }

  protected resetValue(): void {
    this.checked.set(this.hasAttribute('checked'));
  }

  /** The browser calls it for a disabled fieldset and for the element's own disabled attribute, even before render. */
  protected setDisabledByForm(disabled: boolean): void {
    this._form.disabled = disabled;
    this.whenRendered(() => this.renderDisabled());
  }

  private renderDisabled(): void {
    this._refs.native.disabled = this.disabled.get() || this._form.disabled;
  }

  private commit(checked: boolean): void {
    this.checked.set(checked);
    this.events.emit('change', checked);
  }

  private renderChecked(checked: boolean): void {
    const native = this._refs.native;
    if (native.checked !== checked) {
      native.checked = checked;
    }
    native.setAttribute('aria-checked', String(checked));
    this.renderFormValue();
  }

  private renderFormValue(): void {
    this.internals.setFormValue(this.checked.get() ? this.value.get() : null);
  }

  /**
   * Hides the text column when there is nothing to show, so a lone switch has no gap beside it; a hidden label stays
   * for screen readers, out of the layout.
   */
  private renderText(): void {
    const slotted = this._refs.slot
      .assignedNodes()
      .some((node) => node instanceof Element || node.textContent?.trim() !== '');
    this._refs.text.hidden = this.label.get() === '' && this.description.get() === '' && !slotted;
    this._refs.text.classList.toggle(SCREEN_READER_ONLY, this.hideLabel.get());
  }
}

JlSwitch.register();
