import { css } from '@jadis/core';
import { ChevronDown } from 'lucide';

import { JlFormControl } from '../base/jl-form-control';
import { asValue, jsonOf, oneOf, textOf } from '../lib/attributes';
import { setAriaFlag, setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { groupOptions } from '../lib/option-groups';
import { CONTROL_SIZES } from '../lib/options';
import { BASE_STYLES, CONTROL_STYLES, FLOATING_STYLES } from '../styles/shared';
import { JlIcon } from './jl-icon';
import styles from './jl-select.css?inline';

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

const sameNodes = (nodes: Element[], others: Element[]): boolean =>
  nodes.length === others.length && nodes.every((node, index) => node === others[index]);

const groupNodes = (group: SelectOptionGroup): Node[] => {
  const options = group.options.map(optionElement);
  return group.label === null ? options : [<optgroup label={group.label}>{options}</optgroup>];
};

/**
 * A choice among a list, on the browser's own `<select>`: its list opens the way the platform does it on a touch
 * screen, and with a mouse looks like the combobox's where the browser lets the page draw it (customizable select).
 * The choices come from `options` (JSON) or from `<option>` and `<optgroup>` elements written inside it. Typed by its
 * values, `JlSelect<'eur' | 'chf'>` takes options of those values and gives `change` one of them.
 */
export class JlSelect<Value extends string = string> extends JlFormControl {
  static readonly selector = 'jl-select';

  readonly events = this.useEvents<{ change: Value }>();

  /** The choices; an option with a `group` goes under that heading. Empty: the `<option>` children are used. */
  readonly options = this.useChange<SelectOption<Value>[]>([], () => this.renderOptions(), {
    attribute: 'options',
    parse: jsonOf<SelectOption<Value>[]>([]),
  });
  /** The chosen value. One that no option has is kept, as an option of its own, rather than replaced. */
  readonly value = this.useChange<Value | typeof NO_VALUE>(NO_VALUE, () => this.renderChosen(), {
    attribute: 'value',
    parse: textOf<Value | typeof NO_VALUE>(NO_VALUE),
  });
  /** Shown while nothing is chosen; it cannot be picked back from the list. */
  readonly placeholder = this.useChange('', () => this.renderPlaceholder(), { attribute: 'placeholder' });
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
  /** Draws the field in the danger colour, for an error the page found itself. */
  readonly invalid = this.useChange(
    false,
    (value) => {
      this.reflect('invalid', value);
      setAriaFlag(this._refs.native, 'aria-invalid', value);
    },
    { attribute: 'invalid' }
  );

  private readonly _form = { disabled: false };
  // The option kept for a value no option has, while there is one.
  private _kept: HTMLOptionElement | undefined;
  // What the options and the choice were drawn from: the callbacks run again at connection with the same values, and
  // onConnect looks for the page's own options once more.
  private readonly _drawn: { light: Element[]; options?: SelectOption<Value>[]; value?: string } = { light: [] };
  // The page's own options may come after the select, or change: a list fetched later, a label in another language.
  private readonly _lightWatch = new MutationObserver((records) => this.onLightChange(records));

  private readonly _refs = this.useRefs((ref) => ({
    native: ref<HTMLSelectElement>('select'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  templateHtml(): Node {
    return (
      <div class="control" attrs={{ part: 'base' }}>
        <select class="native" id="field" />
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
      const value = asValue<Value>(native.value);
      this.value.set(value);
      this.events.emit('change', value);
    });
    // Children the parser added after the element connected are there now.
    this.renderOptions();
    this._lightWatch.observe(this, { attributes: true, characterData: true, childList: true, subtree: true });
  }

  onDisconnect(): void {
    this._lightWatch.disconnect();
  }

  /** Draws the page's options again when one came, left or changed. The select's own attributes are its inputs. */
  private onLightChange(records: MutationRecord[]): void {
    if (records.every((record) => record.target === this && record.type === 'attributes')) {
      return;
    }
    // The same elements may hold another text or value: none of them counts as drawn.
    this._drawn.light = [];
    this.renderOptions();
  }

  protected resetValue(): void {
    this.value.set(textOf<Value | typeof NO_VALUE>(NO_VALUE)(this.getAttribute('value')));
  }

  /** The browser calls it for a disabled fieldset and for the element's own disabled attribute, even before render. */
  protected setDisabledByForm(disabled: boolean): void {
    this._form.disabled = disabled;
    this.whenRendered(() => this.renderDisabled());
  }

  private renderDisabled(): void {
    this._refs.native.disabled = this.disabled.get() || this._form.disabled;
  }

  /** The `<option>` and `<optgroup>` the page wrote inside, used when `options` is empty. */
  private lightOptions(): Element[] {
    return this.options.get().length > 0 ? [] : [...this.querySelectorAll(LIGHT_OPTIONS)];
  }

  /** The options from `options`, or else copies of the page's own. */
  private optionNodes(light: Element[]): Node[] {
    const options = this.options.get();
    if (options.length > 0) {
      return groupOptions(options).flatMap(groupNodes);
    }
    return light.map((node) => node.cloneNode(true));
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

  /**
   * Draws every option again: only when the options change. Chrome's customizable select reports, as an option
   * inside an option, an option the page added and removed before its check ran.
   */
  private renderOptions(): void {
    const options = this.options.get();
    const light = this.lightOptions();
    if (options === this._drawn.options && sameNodes(light, this._drawn.light)) {
      return;
    }
    this._drawn.options = options;
    this._drawn.light = light;
    this._refs.native.replaceChildren(...this.placeholderNodes(), ...this.optionNodes(light));
    this._kept = undefined;
    this.keepUnknownValue();
    this.renderValue();
  }

  /** Another value among the options drawn: only the option kept for an unknown value comes or goes. */
  private renderChosen(): void {
    // Attribute callbacks run before the options' at connection: drawing the options shows the value then.
    if (this._drawn.options === undefined || this.value.get() === this._drawn.value) {
      return;
    }
    this.dropKept();
    this.keepUnknownValue();
    this.renderValue();
  }

  /**
   * Another placeholder: its own option is written, added or removed, the others left as they are. Only one that
   * comes or goes can change the option shown.
   */
  private renderPlaceholder(): void {
    const native = this._refs.native;
    const shown = native.querySelector<HTMLOptionElement>(`:scope > option.${PLACEHOLDER_CLASS}`);
    const placeholder = this.placeholder.get();
    if (this._drawn.options === undefined || (shown === null && placeholder === '')) {
      return;
    }
    if (shown === null) {
      native.prepend(...this.placeholderNodes());
      this.renderValue();
      return;
    }
    if (placeholder === '') {
      shown.remove();
      this.renderValue();
      return;
    }
    if (shown.text !== placeholder) {
      shown.text = placeholder;
    }
  }

  /** The option kept for a value no option has goes once another value is chosen. */
  private dropKept(): void {
    const kept = this._kept;
    if (kept === undefined || kept.value === this.value.get()) {
      return;
    }
    kept.remove();
    this._kept = undefined;
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
    const kept: HTMLOptionElement = <option value={value}>{value}</option>;
    native.add(kept, afterPlaceholder);
    this._kept = kept;
  }

  /** Shows the chosen option; the form gets what is shown. */
  private renderValue(): void {
    const native = this._refs.native;
    native.selectedIndex = this.shownIndex();
    this._drawn.value = this.value.get();
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
