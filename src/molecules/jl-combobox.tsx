import { JlComboboxBase } from '../base/jl-combobox-base';

import type { ComboboxOption } from '../types/jl-combobox.types';

export { COMBOBOX_FILTERS } from '../base/jl-combobox-base';

/**
 * A text field with a list of options that narrows as people type; they choose with the arrows and Enter, or with
 * the pointer. The field shows the option's label, `value` and the form hold its value. With `allow-custom`, the
 * text people type becomes the value when no option matches it. With `filter="none"` the page finds the options
 * (on `input`, which `debounce` holds back while people type) and shows `loading` meanwhile. For several values,
 * `jl-multi-combobox`.
 */
export class JlCombobox extends JlComboboxBase<string> {
  static readonly selector = 'jl-combobox';

  protected shaped(values: string[]): string {
    return values[0] ?? '';
  }

  protected parseValue(text: string | null): string {
    return text ?? '';
  }

  /** A choice closes the list, and the field shows the option's label. */
  protected chooseOption(option: ComboboxOption): void {
    this.clearTyped();
    this.closeList();
    this.commitValues([option.value]);
  }

  /** Typed text: an option with that label, free text, nothing, or back as it was. */
  protected commitTyped(text: string): void {
    // Nothing typed: the field still shows its value. Reading that text back would choose the first of two options
    // named alike, and erase a value whose options are not there yet, which shows no label.
    if (text === this.fieldText().trim()) {
      this.renderValue();
      return;
    }
    const exact = this.optionWithLabel(text);
    if (exact !== undefined) {
      this.commitValues([exact.value]);
      return;
    }
    if (text === '' || this.allowCustom.get()) {
      this.commitValues(text === '' ? [] : [text]);
      return;
    }
    this.renderValue();
  }

  /** The label of the value's option, the one kept from when it was chosen, or the free text. */
  protected fieldText(): string {
    return this.displayOf(this.value.get());
  }

  protected renderFormValue(): void {
    this.internals.setFormValue(this.value.get());
  }
}

JlCombobox.register();
