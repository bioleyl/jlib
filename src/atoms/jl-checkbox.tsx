import { css } from '@jadis/core';
import { Check, Minus } from 'lucide';

import { JlFormControl } from '../base/jl-form-control';
import { registerIcons } from '../lib/icons';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-checkbox.css?raw';
import { JlIcon } from './jl-icon';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ check: Check, minus: Minus });

const ICON_SIZE = 12;
const DEFAULT_VALUE = 'on';

/**
 * A box to tick, with its label beside it: clicking the label toggles it too. `checked` is the state; the form
 * gets `value` while it is checked. `indeterminate` draws a dash for a parent whose children are partly checked.
 */
export class JlCheckbox extends JlFormControl {
  static readonly selector = 'jl-checkbox';

  readonly events = this.useEvents<{ change: boolean }>();

  readonly checked = this.useChange(false, (value) => this.renderChecked(value), { attribute: 'checked' });
  /** Neither checked nor unchecked: a dash, until the next click decides. */
  readonly indeterminate = this.useChange(false, (value) => this.renderIndeterminate(value), {
    attribute: 'indeterminate',
  });
  /** The text beside the box; the default slot takes a richer label. */
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
  /** What the form gets while the box is checked. */
  readonly value = this.useChange(DEFAULT_VALUE, () => this.renderFormValue(), { attribute: 'value' });
  readonly required = this.useChange(
    false,
    (value) => {
      this._refs.native.required = value;
      this.reflect('required', value);
      this.mirrorValidity(this._refs.native);
    },
    { attribute: 'required' }
  );
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
        <span class="box">
          <input type="checkbox" class="native" aria-describedby="description" />
          <JlIcon class="mark check" name="check" size={ICON_SIZE} />
          <JlIcon class="mark dash" name="minus" size={ICON_SIZE} />
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
    this.indeterminate.set(this.hasAttribute('indeterminate'));
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
    this.indeterminate.set(false);
    this.checked.set(checked);
    this.events.emit('change', checked);
  }

  private renderChecked(checked: boolean): void {
    const native = this._refs.native;
    if (native.checked !== checked) {
      native.checked = checked;
    }
    this.renderFormValue();
  }

  /** Hides the text column when there is nothing to show, so a lone box has no gap beside it. */
  private renderText(): void {
    const slotted = this._refs.slot
      .assignedNodes()
      .some((node) => node instanceof Element || node.textContent?.trim() !== '');
    this._refs.text.hidden = this.label.get() === '' && this.description.get() === '' && !slotted;
  }

  private renderIndeterminate(indeterminate: boolean): void {
    this._refs.native.indeterminate = indeterminate;
  }

  private renderFormValue(): void {
    this.internals.setFormValue(this.checked.get() ? this.value.get() : null);
    this.mirrorValidity(this._refs.native);
  }
}

JlCheckbox.register();
