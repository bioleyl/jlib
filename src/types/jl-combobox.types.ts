/** One choice of a combobox: the field shows its `label` and the form gets its `value`. */
export type ComboboxOption = {
  value: string;
  label: string;
  /** A second, quieter line under the label. */
  description?: string;
  disabled?: boolean;
};

/**
 * Who narrows the options to what was typed: the combobox (`local`), or the page (`none`), which hears `input` and
 * gives the options it found, shown as they are.
 */
export type ComboboxFilter = 'local' | 'none';
