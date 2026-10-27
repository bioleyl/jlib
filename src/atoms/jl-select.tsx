import { css } from '@jadis/core';
import { ChevronDown } from 'lucide';

import { JlFormControl } from '../base/jl-form-control';
import { jsonOf, oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { groupOptions } from '../lib/option-groups';
import { CONTROL_SIZES } from '../lib/options';
import { BASE_STYLES, CONTROL_STYLES, FLOATING_STYLES } from '../styles/shared';
import { JlIcon } from './jl-icon';
import styles from './jl-select.css?raw';

import type { SelectOption, SelectOptionGroup } from '../types/jl-select.types';
import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'chevron-down': ChevronDown });

const CHEVRON_SIZE = 16;
// The page's own <option> and <optgroup> children, copied into the native select.
const LIGHT_OPTIONS = ':scope > option, :scope > optgroup';
const NO_VALUE = '';
const PLACEHOLDER_CLASS = 'placeholder';

const optionElement = (option: SelectOption): HTMLOptionElement => (
  <option value={option.value} disabled={option.disabled === true}>
    {option.label}
  </option>
);

const groupNodes = (group: SelectOptionGroup): Node[] => {
  const options = group.options.map(optionElement);
  return group.label === null ? options : [<optgroup label={group.label}>{options}</optgroup>];
};

/**
 * A choice among a list, on the browser's own `<select>`: its list opens the way the platform does it on a touch
 * screen, and with a mouse looks like the combobox's where the browser lets the page draw it (customizable select).
 * The choices come from `options` (JSON) or from `<option>` and `<optgroup>` elements written inside it.
 */
export class JlSelect extends JlFormControl {
  static readonly selector = 'jl-select';

  readonly events = this.useEvents<{ change: string }>();

  /** The choices; an option with a `group` goes under that heading. Empty: the `<option>` children are used. */
  readonly options = this.useChange<SelectOption[]>([], () => this.renderOptions(), {
    attribute: 'options',
    parse: jsonOf<SelectOption[]>([]),
  });
  /** The chosen value. One that no option has is kept, as an option of its own, rather than replaced. */
  readonly value = this.useChange(NO_VALUE, () => this.renderOptions(), { attribute: 'value' });
  /** Shown while nothing is chosen; it cannot be picked back from the list. */
  readonly placeholder = this.useChange('', () => this.renderOptions(), { attribute: 'placeholder' });
  readonly size = this.useChange<ControlSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(CONTROL_SIZES, 'md'),
  });
  /** The field's name for screen readers, when no visible label names it. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.native, 'aria-label', value), {
    attribute: 'label',
  });
  readonly required = this.useChange(
    false,
    (value) => {
      this._refs.native.required = value;
      this.reflect('required', value);
      this.renderValue();
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
  /** Draws the field in the danger colour, for an error the page found itself. */
  readonly invalid = this.useChange(
    false,
    (value) => {
      this.reflect('invalid', value);
      this._refs.native.toggleAttribute('aria-invalid', value);
    },
    { attribute: 'invalid' }
  );

  private readonly _form = { disabled: false };

  private readonly _refs = this.useRefs((ref) => ({
    native: ref<HTMLSelectElement>('select'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  templateHtml(): Node {
    return (
      <div class="control" attrs={{ part: 'base' }}>
        <select class="native" />
        <JlIcon class="chevron" name="chevron-down" size={CHEVRON_SIZE} />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${CONTROL_STYLES}${FLOATING_STYLES}${styles}`;
  }

  onConnect(): void {
    const native = this._refs.native;
    this.on(native, 'change', () => {
      this.value.set(native.value);
      this.events.emit('change', native.value);
    });
    // Children the parser added after the element connected are there now.
    this.renderOptions();
  }

  protected resetValue(): void {
    this.value.set(this.getAttribute('value') ?? NO_VALUE);
  }

  /** The browser calls it for a disabled fieldset and for the element's own disabled attribute, even before render. */
  protected setDisabledByForm(disabled: boolean): void {
    this._form.disabled = disabled;
    this.whenRendered(() => this.renderDisabled());
  }

  private renderDisabled(): void {
    this._refs.native.disabled = this.disabled.get() || this._form.disabled;
  }

  /** The options from `options`, or else copies of the `<option>` and `<optgroup>` the page wrote inside. */
  private optionNodes(): Node[] {
    const options = this.options.get();
    if (options.length > 0) {
      return groupOptions(options).flatMap(groupNodes);
    }
    return [...this.querySelectorAll(LIGHT_OPTIONS)].map((node) => node.cloneNode(true));
  }

  private placeholderNodes(): Node[] {
    const placeholder = this.placeholder.get();
    if (placeholder === '') {
      return [];
    }
    return [
      <option class={PLACEHOLDER_CLASS} value={NO_VALUE} disabled hidden>
        {placeholder}
      </option>,
    ];
  }

  private renderOptions(): void {
    this._refs.native.replaceChildren(...this.placeholderNodes(), ...this.optionNodes());
    this.keepUnknownValue();
    this.renderValue();
  }

  /**
   * A value no option has (a choice since removed, options still loading) shows as an option of its own, first, so
   * the field shows what is saved and the form keeps it, rather than another choice.
   */
  private keepUnknownValue(): void {
    const native = this._refs.native;
    const value = this.value.get();
    const known = [...native.options].some((option) => option.value === value);
    if (value === NO_VALUE || known) {
      return;
    }
    const afterPlaceholder = this.placeholder.get() === '' ? 0 : 1;
    native.add(<option value={value}>{value}</option>, afterPlaceholder);
  }

  /** Shows the chosen option; the form gets what is shown. */
  private renderValue(): void {
    const native = this._refs.native;
    native.selectedIndex = this.shownIndex();
    this.reflect('placeholder-shown', native.selectedOptions[0]?.classList.contains(PLACEHOLDER_CLASS) === true);
    this.internals.setFormValue(native.value);
    this.mirrorValidity(native);
  }

  /**
   * The option to show: the one with the value, or else what a native select shows, the placeholder or the first
   * option that can be chosen.
   */
  private shownIndex(): number {
    const options = [...this._refs.native.options];
    const value = this.value.get();
    const chosen = options.findIndex((option) => option.value === value);
    if (chosen !== -1) {
      return chosen;
    }
    return options.findIndex((option) => option.classList.contains(PLACEHOLDER_CLASS) || !option.disabled);
  }
}

JlSelect.register();
