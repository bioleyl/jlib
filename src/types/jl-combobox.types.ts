/** One choice of a combobox: the field shows its `label` and the form gets its `value`. */
export type ComboboxOption = {
  value: string;
  label: string;
  /** A second, quieter line under the label. */
  description?: string;
  disabled?: boolean;
};
