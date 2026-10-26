import { css } from '@jadis/core';
import { CircleAlert } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-field.css?raw';

import type { FieldOrientation } from '../types/jl-field.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'circle-alert': CircleAlert });

export const FIELD_ORIENTATIONS: readonly FieldOrientation[] = ['vertical', 'horizontal'];

const ERROR_ICON_SIZE = 14;
// Their label is the text drawn beside them, not a name for screen readers: the field leaves it alone.
const VISIBLE_LABEL_TAGS: readonly string[] = ['jl-checkbox', 'jl-switch'];

/** A component input the field drives, such as a control's `invalid` or `label`. */
type Settable<Value> = { get(): Value; set(value: Value): void };

function inputOf<Value>(element: Element, name: string): Settable<Value> | null {
  const candidate: unknown = Reflect.get(element, name);
  const settable =
    typeof candidate === 'object' && candidate !== null && typeof Reflect.get(candidate, 'set') === 'function';
  return settable ? (candidate as Settable<Value>) : null;
}

/**
 * A control with its label, a hint under it, and an error that replaces the hint. Pressing the label focuses the
 * control; an `error` draws the control as invalid. The control goes in the default slot.
 */
export class JlField extends JlElement {
  static readonly selector = 'jl-field';

  readonly label = this.useChange(
    '',
    (value) => {
      this._refs.label.textContent = value;
      this._refs.labelRow.hidden = value === '';
      this.syncControl();
    },
    { attribute: 'label' }
  );
  /** Help under the control, hidden while there is an error. */
  readonly hint = this.useChange('', () => this.renderMessages(), { attribute: 'hint' });
  /** What is wrong with the value, in the danger colour; the control is drawn as invalid meanwhile. */
  readonly error = this.useChange(
    '',
    () => {
      this.renderMessages();
      this.syncControl();
    },
    { attribute: 'error' }
  );
  /** Adds an asterisk to the label. Set `required` on the control too, for the form to check it. */
  readonly required = this.useChange(
    false,
    (value) => {
      this._refs.asterisk.hidden = !value;
    },
    { attribute: 'required' }
  );
  readonly orientation = this.useChange<FieldOrientation>(
    'vertical',
    (value) => this.reflect('orientation', value),
    { attribute: 'orientation', parse: oneOf(FIELD_ORIENTATIONS, 'vertical') }
  );

  private readonly _state = { invalidated: null as Element | null };

  private readonly _refs = this.useRefs((ref) => ({
    asterisk: ref('.asterisk'),
    errorRegion: ref('.error-region'),
    hint: ref('.hint'),
    label: ref('.label'),
    labelRow: ref('.label-row'),
    slot: ref('slot'),
  }));

  templateHtml(): Node {
    return (
      <div class="field" attrs={{ part: 'base' }}>
        <div class="label-row" hidden>
          <span class="label" />
          <span class="asterisk" aria-hidden="true" hidden>
            *
          </span>
        </div>
        <div class="body">
          <slot />
          <p class="hint" hidden />
          <div class="error-region" aria-live="polite" />
        </div>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.labelRow, 'click', () => this.focusControl());
    // The first slotchange can come before onConnect, and the control upgrades after the field: sync now too.
    this.syncControl();
    this.on(this._refs.slot, 'slotchange', () => this.syncControl());
  }

  /** The control in the slot: the first element the page put there. */
  private control(): HTMLElement | null {
    const [first] = this._refs.slot.assignedElements({ flatten: true });
    return first instanceof HTMLElement ? first : null;
  }

  private focusControl(): void {
    this.control()?.focus();
  }

  private renderMessages(): void {
    const error = this.error.get();
    const hint = this.hint.get();
    this._refs.hint.textContent = hint;
    this._refs.hint.hidden = hint === '' || error !== '';
    this.reflect('has-error', error !== '');
    this._refs.errorRegion.replaceChildren(
      ...(error === ''
        ? []
        : [
            <p class="error">
              <JlIcon name="circle-alert" size={ERROR_ICON_SIZE} />
              <span>{error}</span>
            </p>,
          ])
    );
  }

  private syncControl(): void {
    const control = this.control();
    if (control === null) {
      return;
    }
    this.syncLabel(control);
    this.syncInvalid(control);
  }

  /** Names the control for screen readers with the field's label, unless it has a label of its own. */
  private syncLabel(control: HTMLElement): void {
    const input = inputOf<string>(control, 'label');
    const ownLabel = control.hasAttribute('label') || VISIBLE_LABEL_TAGS.includes(control.localName);
    if (input === null || ownLabel) {
      return;
    }
    input.set(this.label.get());
  }

  /** Marks the control invalid, remembering it unless the page had marked it already. */
  private invalidate(control: HTMLElement, input: Settable<boolean>): void {
    if (input.get()) {
      return;
    }
    input.set(true);
    this._state.invalidated = control;
  }

  /** Marks the control invalid while there is an error, and clears only what the field itself marked. */
  private syncInvalid(control: HTMLElement): void {
    const input = inputOf<boolean>(control, 'invalid');
    if (input === null) {
      return;
    }
    if (this.error.get() !== '') {
      this.invalidate(control, input);
      return;
    }
    if (this._state.invalidated === control) {
      input.set(false);
      this._state.invalidated = null;
    }
  }
}

JlField.register();
