import { css } from '@jadis/core';
import { Eye, EyeOff, X } from 'lucide';

import { JlFormControl } from '../base/jl-form-control';
import { oneOf } from '../lib/attributes';
import { setAriaFlag, setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { CONTROL_SIZES } from '../lib/options';
import { jlText } from '../lib/texts';
import { BASE_STYLES, CONTROL_STYLES } from '../styles/shared';
import { JlIcon } from './jl-icon';
import styles from './jl-input.css?inline';

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
  readonly min = this.useChange('', (value) => this.setConstraint('min', value), { attribute: 'min' });
  readonly max = this.useChange('', (value) => this.setConstraint('max', value), { attribute: 'max' });
  readonly step = this.useChange('', (value) => this.setConstraint('step', value), { attribute: 'step' });
  readonly minlength = this.useChange('', (value) => this.setConstraint('minlength', value), {
    attribute: 'minlength',
  });
  readonly maxlength = this.useChange('', (value) => this.setConstraint('maxlength', value), {
    attribute: 'maxlength',
  });
  readonly pattern = this.useChange('', (value) => this.setConstraint('pattern', value), {
    attribute: 'pattern',
  });
  readonly required = this.useChange(false, (value) => this.setFlag('required', value), { attribute: 'required' });
  readonly readonly = this.useChange(false, (value) => this.setFlag('readonly', value), { attribute: 'readonly' });
  readonly disabled = this.useChange(false, (value) => this.renderDisabled(value), { attribute: 'disabled' });
  /** Draws the field in the danger colour, for an error the page found itself. */
  readonly invalid = this.useChange(
    false,
    (value) => {
      this.reflect('invalid', value);
      setAriaFlag(this._refs.native, 'aria-invalid', value);
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
  readonly clearable = this.useChange(false, () => this.renderClear(), { attribute: 'clearable' });

  private readonly _form = { disabled: false };

  private readonly _refs = this.useRefs((ref) => ({
    clear: ref('.clear'),
    clearIcon: ref<JlIcon>('.clear jl-icon'),
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
        <input class="native" id="field" />
        <button class="action clear" type="button" tabIndex={-1} hidden>
          <JlIcon size={ACTION_ICON_SIZE} />
        </button>
        <button class="action reveal" type="button" hidden>
          <JlIcon size={ICON_SIZE} />
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
    this.on(native, 'keydown', (event) => this.onKey(event));
    this.on(this._refs.clear, 'click', () => this.clearValue());
    this.on(this._refs.reveal, 'click', () => this.toggleReveal());
  }

  /** Enter: `enter` for the page, then the form submits, as from a native field. */
  private onKey(event: KeyboardEvent): void {
    if (event.key !== ENTER) {
      return;
    }
    this.events.emit('enter', this._refs.native.value);
    this.submitImplicitly(event);
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

  protected drawTexts(): void {
    this._refs.clear.setAttribute('aria-label', jlText('clear'));
    this.renderReveal();
  }

  private toggleReveal(): void {
    const native = this._refs.native;
    native.type = native.type === PASSWORD ? REVEALED : PASSWORD;
    this.renderReveal();
  }

  private renderValue(value: string): void {
    const native = this._refs.native;
    if (native.value !== value) {
      native.value = value;
    }
    this.internals.setFormValue(value);
    this.mirrorValidity(native);
    this.renderClear();
  }

  private renderType(type: InputType): void {
    this._refs.native.type = type;
    this.renderReveal();
    this.mirrorValidity(this._refs.native);
  }

  private renderDisabled(disabled: boolean): void {
    this.reflect('disabled', disabled);
    this.syncNativeDisabled();
  }

  /** The native field is disabled by the element's own flag or by a disabled fieldset around it. */
  private syncNativeDisabled(): void {
    this._refs.native.disabled = this.disabled.get() || this._form.disabled;
    this.renderClear();
  }

  /** The × shows while an editable field holds text; its SVG is drawn the first time it does. */
  private renderClear(): void {
    // The native field is the one that knows: it is also disabled by a `<fieldset disabled>` around the element.
    const editable = !this._refs.native.disabled && !this.readonly.get();
    const clear = this._refs.clear;
    clear.hidden = !(this.clearable.get() && editable && this.value.get() !== '');
    if (!clear.hidden) {
      this._refs.clearIcon.name.set('x');
    }
  }

  /** The eye shows for a password only, drawn then, and says what pressing it does to the text. */
  private renderReveal(): void {
    const reveal = this._refs.reveal;
    reveal.hidden = this.type.get() !== PASSWORD;
    if (reveal.hidden) {
      return;
    }
    const revealed = this._refs.native.type === REVEALED;
    this._refs.revealIcon.name.set(revealed ? 'eye-off' : 'eye');
    reveal.setAttribute('aria-label', jlText(revealed ? 'hidePassword' : 'showPassword'));
  }

  /** An attribute that does not change what the field accepts (a placeholder, a name, a keyboard hint). */
  private setNative(name: string, value: string): void {
    setOrRemove(this._refs.native, name, value);
  }

  /** A constraint on what the field accepts: its validity changes with it. */
  private setConstraint(name: string, value: string): void {
    this.setNative(name, value);
    this.mirrorValidity(this._refs.native);
  }

  private setFlag(name: string, value: boolean): void {
    this._refs.native.toggleAttribute(name, value);
    this.reflect(name, value);
    this.renderClear();
    this.mirrorValidity(this._refs.native);
  }
}

JlInput.register();
