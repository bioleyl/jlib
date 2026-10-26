import { css } from '@jadis/core';
import { Check } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlFormControl } from '../base/jl-form-control';
import { jsonOf, oneOf, stringList } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { CONTROL_SIZES } from '../lib/options';
import { rovingIndex } from '../lib/roving-index';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-chip-group.css?raw';

import type { ChipGroupOption } from '../types/jl-chip-group.types';
import type { ControlSize } from '../types/options.types';
import type { RovingMove } from '../types/roving-index.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ check: Check });

const ICON_SIZES: Record<ControlSize, number> = { lg: 16, md: 14, sm: 12 };
const SELECTED_ICON = 'check';
const CHIP_SELECTOR = '.chip';
const VALUE_MISSING = 'Please select one of these options.';

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
const parseOptions = (value: string | null): ChipGroupOption[] => {
  const parsed = jsonOf<unknown>([])(value);
  return Array.isArray(parsed) ? (parsed as ChipGroupOption[]) : [];
};

/**
 * A row of chips to choose from: a status to filter by, a category, a reason. One choice by default, as radios
 * (choosing the chosen chip again keeps it); `multiple` lets people turn each chip on and off. On a narrow screen
 * the row scrolls sideways; `wrap` lets it go to the next line instead. `change` fires with the chosen values.
 */
export class JlChipGroup extends JlFormControl {
  static readonly selector = 'jl-chip-group';

  readonly events = this.useEvents<{ change: string[] }>();

  readonly options = this.useChange<ChipGroupOption[]>([], () => this.renderOptions(), {
    attribute: 'options',
    parse: parseOptions,
  });
  /** The chosen values, in the options' order; with one choice, a list of at most one. */
  readonly value = this.useChange<string[]>([], () => this.renderValue(), {
    attribute: 'value',
    parse: stringList,
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
      this.renderOptions();
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
      this._refs.group.toggleAttribute('aria-required', value);
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

  /** The chip that holds the Tab stop with several choices: the last one people reached. */
  private readonly _state = { disabledByForm: false, stop: '' };

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
    this.value.set(stringList(this.getAttribute('value')));
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
  private chosen(): string[] {
    const values = this.value.get();
    return this.multiple.get() ? values : values.slice(0, 1);
  }

  private isDisabled(): boolean {
    return this.disabled.get() || this._state.disabledByForm;
  }

  /** One choice: the chip becomes it. Several: the chip turns on or off, the values keeping the options' order. */
  private press(chip: HTMLButtonElement): void {
    const value = chip.dataset.value ?? '';
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

  private commit(values: string[]): void {
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
    const iconSize = ICON_SIZES[this.size.get()];
    this._refs.group.replaceChildren(...this.options.get().map((option) => this.chip(option, iconSize)));
    this.renderValue();
  }

  private chip(option: ChipGroupOption, iconSize: number): HTMLButtonElement {
    const badge = option.badge === undefined ? '' : String(option.badge);
    return (
      <button
        type="button"
        class="chip"
        tabIndex={-1}
        data-value={option.value}
        data-icon={option.icon}
        data-disabled={option.disabled === true ? '' : undefined}>
        <JlIcon class="icon" size={iconSize} hidden />
        <span class="label">{option.label}</span>
        {badge === '' ? '' : <span class="badge">{badge}</span>}
      </button>
    ) as HTMLButtonElement;
  }

  /** Radios with one choice, toggle buttons with several; each chosen chip shows its icon or a check. */
  private renderValue(): void {
    const chosen = new Set(this.chosen());
    const multiple = this.multiple.get();
    const groupDisabled = this.isDisabled();
    this._refs.group.setAttribute('role', multiple ? 'group' : 'radiogroup');
    this._refs.group.toggleAttribute('aria-disabled', groupDisabled);
    for (const chip of this.chips()) {
      const selected = chosen.has(chip.dataset.value ?? '');
      chip.disabled = groupDisabled || chip.dataset.disabled !== undefined;
      setOrRemove(chip, 'role', multiple ? '' : 'radio');
      setOrRemove(chip, 'aria-checked', multiple ? '' : String(selected));
      setOrRemove(chip, 'aria-pressed', multiple ? String(selected) : '');
      chip.classList.toggle('selected', selected);
      const icon = chip.querySelector<JlIcon>('.icon');
      const name = chip.dataset.icon ?? (selected ? SELECTED_ICON : '');
      icon?.name.set(name);
      if (icon !== null) {
        icon.hidden = name === '';
      }
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

  private renderValidity(): void {
    const missing = this.required.get() && this.chosen().length === 0;
    if (!missing) {
      this.internals.setValidity({});
      return;
    }
    this.internals.setValidity({ valueMissing: true }, VALUE_MISSING, this.chips()[0] ?? this._refs.group);
  }
}

JlChipGroup.register();
