import { css } from '@jadis/core';
import { Eye, EyeOff, X } from 'lucide';

import { JlFormControl } from '../base/jl-form-control';
import { oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { CONTROL_SIZES } from '../lib/options';
import { jlText } from '../lib/texts';
import { BASE_STYLES, CONTROL_STYLES } from '../styles/shared';
import { JlIcon } from './jl-icon';
import styles from './jl-input.css?raw';

import type { InputType } from '../types/jl-input.types';
import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ eye: Eye, 'eye-off': EyeOff, x: X });

export const INPUT_TYPES: readonly InputType[] = [
  'text',
  'email',
  'password',
  'number',
  'search',
  'tel',
  'url',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
];

const PASSWORD: InputType = 'password';
const REVEALED: InputType = 'text';
const ICON_SIZE = 16;
const ACTION_ICON_SIZE = 14;
const ENTER = 'Enter';

/**
 * A single-line text field that takes part in forms. `value` is the text; `input` fires as people type and
 * `change` when they commit. Slots `start` and `end` hold adornments such as a unit or a prefix.
 */
export class JlInput extends JlFormControl {
  static readonly selector = 'jl-input';

  readonly events = this.useEvents<{ input: string; change: string; enter: string }>();

  readonly value = this.useChange('', (value) => this.renderValue(value), { attribute: 'value' });
  readonly type = this.useChange<InputType>('text', (value) => this.renderType(value), {
    attribute: 'type',
    parse: oneOf(INPUT_TYPES, 'text'),
  });
  readonly placeholder = this.useChange('', (value) => this.setNative('placeholder', value), {
    attribute: 'placeholder',
  });
  /** The field's name for screen readers, when no visible label names it. */
  readonly label = this.useChange('', (value) => this.setNative('aria-label', value), { attribute: 'label' });
  readonly autocomplete = this.useChange('', (value) => this.setNative('autocomplete', value), {
    attribute: 'autocomplete',
  });
  /** The keyboard a phone shows for the field (`numeric`, `decimal`, `tel`…), as a native input's `inputmode`. */
  readonly inputmode = this.useChange('', (value) => this.setNative('inputmode', value), {
    attribute: 'inputmode',
  });
  readonly min = this.useChange('', (value) => this.setNative('min', value), { attribute: 'min' });
  readonly max = this.useChange('', (value) => this.setNative('max', value), { attribute: 'max' });
  readonly step = this.useChange('', (value) => this.setNative('step', value), { attribute: 'step' });
  readonly minlength = this.useChange('', (value) => this.setNative('minlength', value), {
    attribute: 'minlength',
  });
  readonly maxlength = this.useChange('', (value) => this.setNative('maxlength', value), {
    attribute: 'maxlength',
  });
  readonly pattern = this.useChange('', (value) => this.setNative('pattern', value), { attribute: 'pattern' });
  readonly required = this.useChange(false, (value) => this.setFlag('required', value), { attribute: 'required' });
  readonly readonly = this.useChange(false, (value) => this.setFlag('readonly', value), { attribute: 'readonly' });
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
  readonly size = this.useChange<ControlSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(CONTROL_SIZES, 'md'),
  });
  /** An icon at the start of the field. */
  readonly icon = this.useChange(
    '',
    (name) => {
      this._refs.icon.name.set(name);
      this._refs.icon.hidden = name === '';
    },
    { attribute: 'icon' }
  );
  /** Shows a button that empties the field while it holds text. */
  readonly clearable = this.useChange(false, () => this.renderActions(), { attribute: 'clearable' });

  private readonly _form = { disabled: false };

  private readonly _refs = this.useRefs((ref) => ({
    clear: ref('.clear'),
    icon: ref<JlIcon>('.icon'),
    native: ref<HTMLInputElement>('input'),
    reveal: ref('.reveal'),
    revealIcon: ref<JlIcon>('.reveal jl-icon'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  /** Selects the whole text, ready to be replaced. */
  select(): void {
    this._refs.native.select();
  }

  templateHtml(): Node {
    return (
      <div class="control" attrs={{ part: 'base' }}>
        <JlIcon class="adornment icon" size={ICON_SIZE} hidden />
        <slot name="start" />
        <input class="native" />
        <button class="action clear" type="button" aria-label={jlText('clear')} tabIndex={-1} hidden>
          <JlIcon name="x" size={ACTION_ICON_SIZE} />
        </button>
        <button class="action reveal" type="button" aria-label={jlText('showPassword')} hidden>
          <JlIcon name="eye" size={ICON_SIZE} />
        </button>
        <slot name="end" />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${CONTROL_STYLES}${styles}`;
  }

  onConnect(): void {
    const native = this._refs.native;
    // The native event crosses the shadow root: stop it, or listeners of ours would also hear it, without a value.
    this.on(native, 'input', (event) => {
      event.stopPropagation();
      this.value.set(native.value);
      this.events.emit('input', native.value);
    });
    this.on(native, 'change', () => this.events.emit('change', native.value));
    this.on(native, 'keydown', (event) => event.key === ENTER && this.events.emit('enter', native.value));
    this.on(this._refs.clear, 'click', () => this.clearValue());
    this.on(this._refs.reveal, 'click', () => this.toggleReveal());
  }

  protected resetValue(): void {
    this.value.set(this.getAttribute('value') ?? '');
  }

  /** The browser calls it for a disabled fieldset and for the element's own disabled attribute, even before render. */
  protected setDisabledByForm(disabled: boolean): void {
    this._form.disabled = disabled;
    this.whenRendered(() => this.syncNativeDisabled());
  }

  private clearValue(): void {
    this.value.set('');
    this.events.emit('input', '');
    this.events.emit('change', '');
    this.focus();
  }

  private toggleReveal(): void {
    const native = this._refs.native;
    const revealed = native.type === PASSWORD;
    native.type = revealed ? REVEALED : PASSWORD;
    this._refs.revealIcon.name.set(revealed ? 'eye-off' : 'eye');
    this._refs.reveal.setAttribute('aria-label', revealed ? jlText('hidePassword') : jlText('showPassword'));
  }

  private renderValue(value: string): void {
    const native = this._refs.native;
    if (native.value !== value) {
      native.value = value;
    }
    this.internals.setFormValue(value);
    this.mirrorValidity(native);
    this.renderActions();
  }

  private renderType(type: InputType): void {
    this._refs.native.type = type;
    this.renderActions();
    this.mirrorValidity(this._refs.native);
  }

  private renderDisabled(disabled: boolean): void {
    this.reflect('disabled', disabled);
    this.syncNativeDisabled();
  }

  /** The native field is disabled by the element's own flag or by a disabled fieldset around it. */
  private syncNativeDisabled(): void {
    this._refs.native.disabled = this.disabled.get() || this._form.disabled;
    this.renderActions();
  }

  private renderActions(): void {
    const editable = !this.disabled.get() && !this.readonly.get();
    this._refs.clear.hidden = !(this.clearable.get() && editable && this.value.get() !== '');
    this._refs.reveal.hidden = this.type.get() !== PASSWORD;
  }

  private setNative(name: string, value: string): void {
    setOrRemove(this._refs.native, name, value);
    this.mirrorValidity(this._refs.native);
  }

  private setFlag(name: string, value: boolean): void {
    this._refs.native.toggleAttribute(name, value);
    this.reflect(name, value);
    this.renderActions();
    this.mirrorValidity(this._refs.native);
  }
}

JlInput.register();
