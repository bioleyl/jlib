import { css } from '@jadis/core';
import { Check } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlFormControl } from '../base/jl-form-control';
import { jsonOf, oneOf, textListOf } from '../lib/attributes';
import { setAriaFlag, setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { CONTROL_SIZES } from '../lib/options';
import { rovingIndex } from '../lib/roving';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-chip-group.css?inline';

import type { ChipGroupOption } from '../types/jl-chip-group.types';
import type { ControlSize } from '../types/options.types';
import type { RovingMove } from '../types/roving.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ check: Check });

const SELECTED_ICON = 'check';
const CHIP_SELECTOR = '.chip';

/** The keys that move between the chips; with one choice, the choice moves too, as with native radios. */
const MOVES = new Map<string, RovingMove>([
  ['ArrowDown', 'next'],
  ['ArrowLeft', 'previous'],
  ['ArrowRight', 'next'],
  ['ArrowUp', 'previous'],
  ['End', 'last'],
  ['Home', 'first'],
]);

/** A JSON attribute that should hold a list of options; anything else gives none. */
const parseOptions = <Value extends string>(value: string | null): ChipGroupOption<Value>[] => {
  const parsed = jsonOf<unknown>([])(value);
  return Array.isArray(parsed) ? (parsed as ChipGroupOption<Value>[]) : [];
};

/**
 * A row of chips to choose from: a status to filter by, a category, a reason. One choice by default, as radios
 * (choosing the chosen chip again keeps it); `multiple` lets people turn each chip on and off. On a narrow screen
 * the row scrolls sideways; `wrap` lets it go to the next line instead. `change` fires with the chosen values.
 * Typed by its values, `JlChipGroup<'open' | 'done'>` takes options of those values and gives them back.
 */
export class JlChipGroup<Value extends string = string> extends JlFormControl {
  static readonly selector = 'jl-chip-group';

  readonly events = this.useEvents<{ change: Value[] }>();

  readonly options = this.useChange<ChipGroupOption<Value>[]>([], () => this.renderOptions(), {
    attribute: 'options',
    parse: parseOptions<Value>,
  });
  /** The chosen values, in the options' order; with one choice, a list of at most one. */
  readonly value = this.useChange<Value[]>([], () => this.renderValue(), {
    attribute: 'value',
    parse: textListOf<Value>,
  });
  /** Several chips can be chosen, each turned on and off on its own. */
  readonly multiple = this.useChange(
    false,
    (value) => {
      this.reflect('multiple', value);
      this.renderValue();
    },
    { attribute: 'multiple' }
  );
  /** Goes to the next line when the chips do not fit, instead of scrolling sideways. */
  readonly wrap = this.useChange(false, (value) => this.reflect('wrap', value), { attribute: 'wrap' });
  readonly size = this.useChange<ControlSize>(
    'md',
    (value) => {
      this.reflect('size', value);
    },
    { attribute: 'size', parse: oneOf(CONTROL_SIZES, 'md') }
  );
  /** The group's name for screen readers, when no visible label names it. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.group, 'aria-label', value), {
    attribute: 'label',
  });
  /** A form refuses to submit while nothing is chosen. */
  readonly required = this.useChange(
    false,
    (value) => {
      this.reflect('required', value);
      setAriaFlag(this._refs.group, 'aria-required', value);
      this.renderValidity();
    },
    { attribute: 'required' }
  );
  readonly disabled = this.useChange(
    false,
    (value) => {
      this.reflect('disabled', value);
      this.renderValue();
    },
    { attribute: 'disabled' }
  );

  /**
   * The chip that holds the Tab stop with several choices: the last one people reached. `drawn` is the list the chips
   * were made from: the options call back with the same list as the group connects.
   */
  private readonly _state = { disabledByForm: false, drawn: null as ChipGroupOption<Value>[] | null, stop: '' };

  // The form's entries carry the field's name: they are written again when it changes.
  private readonly _nameWatch = new MutationObserver(() => this.renderFormValue());

  private readonly _refs = this.useRefs((ref) => ({ group: ref('.group') }));

  /** Focuses the chip that holds the Tab stop. */
  override focus(options?: FocusOptions): void {
    this.chips()
      .find((chip) => chip.tabIndex === 0)
      ?.focus(options);
  }

  templateHtml(): Node {
    return <div class="group" role="radiogroup" attrs={{ part: 'base' }} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._nameWatch.observe(this, { attributeFilter: ['name'], attributes: true });
    this.renderFormValue();
    this.on(this._refs.group, 'click', (event) => {
      const chip = (event.target as Element).closest<HTMLButtonElement>(CHIP_SELECTOR);
      if (chip !== null && !chip.disabled) {
        this.press(chip);
      }
    });
    this.on(this._refs.group, 'keydown', (event) => this.onKeydown(event));
  }

  onDisconnect(): void {
    this._nameWatch.disconnect();
  }

  protected resetValue(): void {
    this.value.set(textListOf<Value>(this.getAttribute('value')));
  }

  /** The browser calls it for a disabled fieldset and for the element's own `disabled`, even before it renders. */
  protected setDisabledByForm(disabled: boolean): void {
    this._state.disabledByForm = disabled;
    this.whenRendered(() => this.renderValue());
  }

  private chips(): HTMLButtonElement[] {
    return [...this._refs.group.querySelectorAll<HTMLButtonElement>(CHIP_SELECTOR)];
  }

  /** What is chosen: with one choice, only the first value counts. */
  private chosen(): Value[] {
    const values = this.value.get();
    return this.multiple.get() ? values : values.slice(0, 1);
  }

  private isDisabled(): boolean {
    return this.disabled.get() || this._state.disabledByForm;
  }

  /** One choice: the chip becomes it. Several: the chip turns on or off, the values keeping the options' order. */
  private press(chip: HTMLButtonElement): void {
    const value = this.options.get().find((option) => option.value === chip.dataset.value)?.value;
    if (value === undefined) {
      return;
    }
    this._state.stop = value;
    const chosen = this.chosen();
    if (!this.multiple.get()) {
      if (chosen[0] === value) {
        this.renderTabStop();
        return;
      }
      this.commit([value]);
      return;
    }
    const next = new Set(chosen);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    this.commit(this.options.get().flatMap((option) => (next.has(option.value) ? [option.value] : [])));
  }

  private commit(values: Value[]): void {
    this.value.set(values);
    this.events.emit('change', values);
  }

  private onKeydown(event: KeyboardEvent): void {
    const move = MOVES.get(event.key);
    const chips = this.chips();
    const from = chips.indexOf(event.target as HTMLButtonElement);
    if (move === undefined || from === -1) {
      return;
    }
    event.preventDefault();
    const target =
      chips[
        rovingIndex(
          chips.map((chip) => chip.disabled),
          from,
          move
        )
      ];
    if (target === undefined) {
      return;
    }
    target.focus();
    if (this.multiple.get()) {
      this._state.stop = target.dataset.value ?? '';
      this.renderTabStop();
      return;
    }
    this.press(target);
  }

  // No reflect() here: it runs for `options` before the attributes declared after it are read.
  private renderOptions(): void {
    const options = this.options.get();
    if (options === this._state.drawn) {
      return;
    }
    this._state.drawn = options;
    this._refs.group.replaceChildren(...options.map((option) => this.chip(option)));
    this.renderValue();
  }

  /** A chip without an icon of its own has a check, which the CSS shows while it is chosen. */
  private chip(option: ChipGroupOption<Value>): HTMLButtonElement {
    const badge = option.badge === undefined ? '' : String(option.badge);
    return (
      <button
        type="button"
        class="chip"
        tabIndex={-1}
        data-value={option.value}
        data-icon={option.icon}
        data-disabled={option.disabled === true ? '' : undefined}>
        <JlIcon class="icon" name={option.icon ?? SELECTED_ICON} />
        <span class="label">{option.label}</span>
        {badge === '' ? '' : <span class="badge">{badge}</span>}
      </button>
    ) as HTMLButtonElement;
  }

  /** Radios with one choice, toggle buttons with several. */
  private renderValue(): void {
    const chosen = new Set<string>(this.chosen());
    const multiple = this.multiple.get();
    const groupDisabled = this.isDisabled();
    this._refs.group.setAttribute('role', multiple ? 'group' : 'radiogroup');
    setAriaFlag(this._refs.group, 'aria-disabled', groupDisabled);
    for (const chip of this.chips()) {
      const selected = chosen.has(chip.dataset.value ?? '');
      chip.disabled = groupDisabled || chip.dataset.disabled !== undefined;
      setOrRemove(chip, 'role', multiple ? '' : 'radio');
      setOrRemove(chip, 'aria-checked', multiple ? '' : String(selected));
      setOrRemove(chip, 'aria-pressed', multiple ? String(selected) : '');
    }
    this.renderTabStop();
    this.renderFormValue();
    this.renderValidity();
  }

  /** Tab reaches one chip: the chosen one with one choice, the last one reached with several, else the first. */
  private renderTabStop(): void {
    const enabled = this.chips().filter((chip) => !chip.disabled);
    const chosen = this.chosen();
    const wanted = this.multiple.get() ? [this._state.stop, ...chosen] : chosen;
    const stop =
      wanted
        .map((value) => enabled.find((chip) => chip.dataset.value === value))
        .find((chip) => chip !== undefined) ?? enabled[0];
    for (const chip of this.chips()) {
      chip.tabIndex = chip === stop ? 0 : -1;
    }
  }

  /** One choice gives one entry; several give one entry each under the field's name, as checkboxes would. */
  private renderFormValue(): void {
    const chosen = this.chosen();
    if (!this.multiple.get()) {
      this.internals.setFormValue(chosen[0] ?? null);
      return;
    }
    const name = this.getAttribute('name') ?? '';
    if (name === '') {
      this.internals.setFormValue(null);
      return;
    }
    const data = new FormData();
    for (const value of chosen) {
      data.append(name, value);
    }
    this.internals.setFormValue(data);
  }

  protected drawTexts(): void {
    this.renderValidity();
  }

  private renderValidity(): void {
    const missing = this.required.get() && this.chosen().length === 0;
    if (!missing) {
      this.internals.setValidity({});
      return;
    }
    this.internals.setValidity(
      { valueMissing: true },
      jlText('selectOption'),
      this.chips()[0] ?? this._refs.group
    );
  }
}

JlChipGroup.register();
