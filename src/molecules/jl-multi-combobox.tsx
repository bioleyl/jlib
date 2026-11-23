import { css } from '@jadis/core';

import { JlChip } from '../atoms/jl-chip';
import { JlComboboxBase } from '../base/jl-combobox-base';
import { textListOf } from '../lib/attributes';
import { toggledValue } from '../lib/combobox';
import { jlText } from '../lib/texts';
import styles from './jl-multi-combobox.css?inline';

import type { ComboboxOption } from '../types/jl-combobox.types';

/** A value's chip: the list item that holds it, and the chip. */
interface ChipItem {
  chip: JlChip;
  element: HTMLElement;
}

/**
 * A combobox that holds several values, shown as chips in the field: `value` and `change` are lists. Choosing an
 * option adds it and keeps the list open for the next one; choosing it again, its chip's × or Backspace in the empty
 * field takes it out. The list narrows as people type, or shows what the page found (`filter="none"`, `loading`,
 * `debounce`), as `jl-combobox`'s does; the form gets each value under the field's name.
 */
export class JlMultiCombobox extends JlComboboxBase<string[]> {
  static readonly selector = 'jl-multi-combobox';

  // Each value's chip, kept while the value is held.
  private readonly _chips = new Map<string, ChipItem>();
  // The form's entries carry the field's name: they are written again when it changes.
  private readonly _nameWatch = new MutationObserver(() => this.renderFormValue());

  private readonly _parts = this.useRefs((ref) => ({
    chips: ref('.chips'),
    listbox: ref('.listbox'),
    native: ref<HTMLInputElement>('input'),
  }));

  templateCss(): string {
    return css`${super.templateCss()}${styles}`;
  }

  onConnect(): void {
    super.onConnect();
    this._parts.listbox.setAttribute('aria-multiselectable', 'true');
    this._nameWatch.observe(this, { attributeFilter: ['name'], attributes: true });
    this.renderFormValue();
  }

  onDisconnect(): void {
    super.onDisconnect();
    this._nameWatch.disconnect();
  }

  protected shaped(values: string[]): string[] {
    return values;
  }

  /** A JSON list, or one plain value. */
  protected parseValue(text: string | null): string[] {
    return textListOf(text);
  }

  protected entryStart(): Node {
    // biome-ignore lint/a11y/noRedundantRoles: a list drawn without bullets loses its role in Safari
    return <ul class="chips" role="list" hidden />;
  }

  /**
   * A choice adds the option, or takes it out when it was held. The typed text goes, and the list stays open on the
   * option for the next choice: the page's options, as it gave them, or all of them.
   */
  protected chooseOption(option: ComboboxOption): void {
    const before = this.held();
    const values = toggledValue(before, option.value);
    this.clearTyped();
    this.commitValues(values);
    this.openList(false);
    this.activate(option);
    const added = values.length > before.length;
    this.announce(
      added ? jlText('addedNamed', { names: option.label }) : jlText('removedNamed', { name: option.label })
    );
  }

  /** Typed text adds the option of that label, or itself with free text allowed; the field empties. */
  protected commitTyped(text: string): void {
    const exact = this.optionWithLabel(text);
    const custom = this.allowCustom.get() ? text : '';
    const added = exact?.value ?? custom;
    this.clearTyped();
    if (exact !== undefined) {
      this.rememberLabel(exact);
    }
    if (added === '' || this.held().includes(added)) {
      this.renderValue();
      return;
    }
    this.commitValues([...this.held(), added]);
  }

  /** The field holds only what people type: the chips show the values. */
  protected fieldText(): string {
    return '';
  }

  /** Backspace in an empty field takes the last value out. */
  protected onBackspace(): boolean {
    const last = this.held().at(-1);
    if (this._parts.native.value !== '' || last === undefined) {
      return false;
    }
    this.removeValue(last);
    return true;
  }

  /** Tab moves on: a choice here keeps the list open, which leaving the field would not show. */
  protected onTab(): boolean {
    return false;
  }

  /** `aria-selected` says which options are held: the active one is marked alone. */
  protected markActive(previous: HTMLElement | null, item: HTMLElement | null): void {
    previous?.classList.remove('active');
    item?.classList.add('active');
  }

  protected drawHeld(item: HTMLElement, held: boolean): void {
    super.drawHeld(item, held);
    item.setAttribute('aria-selected', String(held));
  }

  /** The placeholder shows while no value is held: chips take its place. */
  protected placeholderShown(): boolean {
    return this.held().length === 0;
  }

  protected isFilled(): boolean {
    return super.isFilled() || this.held().length > 0;
  }

  protected renderValue(): void {
    super.renderValue();
    this.renderChips(this.held());
  }

  /** A disabled field keeps its chips, without their ×: a chip of its own disabled would dim its text past reading. */
  protected drawDisabled(): void {
    super.drawDisabled();
    for (const { chip } of this._chips.values()) {
      chip.removable.set(!this.isOff());
    }
  }

  /** Each value under the field's name, as several checked boxes of one name would be. */
  protected renderFormValue(): void {
    const name = this.getAttribute('name') ?? '';
    const data = new FormData();
    for (const value of this.held()) {
      data.append(name, value);
    }
    this.internals.setFormValue(name === '' ? null : data);
  }

  /** A chip's ×, or Backspace on the last one: the value goes, and the focus stays in the field. */
  private removeValue(value: string): void {
    if (this.isOff()) {
      return;
    }
    const name = this.displayOf(value);
    this.commitValues(this.held().filter((held) => held !== value));
    this.announce(jlText('removedNamed', { name }));
    this.focus();
  }

  /** One chip per value held, in their order: a chip stays while its value does. */
  private renderChips(held: string[]): void {
    const list = this._parts.chips;
    for (const [value, { element }] of this._chips) {
      if (!held.includes(value)) {
        element.remove();
        this._chips.delete(value);
      }
    }
    held.forEach((value, index) => {
      const { element } = this.chipFor(value);
      const current = list.children.item(index);
      if (current !== element) {
        list.insertBefore(element, current);
      }
    });
    list.hidden = held.length === 0;
  }

  private chipFor(value: string): ChipItem {
    const label = this.displayOf(value);
    const kept = this._chips.get(value);
    if (kept !== undefined) {
      kept.chip.label.set(label);
      return kept;
    }
    const chip: JlChip = (
      <JlChip label={label} size="sm" removable={!this.isOff()} onDismiss={() => this.removeValue(value)} />
    );
    const item = { chip, element: <li class="chip-item">{chip}</li> };
    this._chips.set(value, item);
    return item;
  }
}

JlMultiCombobox.register();
