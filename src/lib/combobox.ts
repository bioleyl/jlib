import type { ComboboxOption } from '../types/jl-combobox.types';

/** The values a combobox holds, as a list: none, one, or several with `multiple`. */
export function heldValues(value: string | readonly string[]): string[] {
  if (typeof value !== 'string') {
    return [...value];
  }
  return value === '' ? [] : [value];
}

/** The values with one taken out when it was held, or added at the end when it was not. */
export const toggledValue = (values: readonly string[], value: string): string[] =>
  values.includes(value) ? values.filter((held) => held !== value) : [...values, value];

/** Whether two lists hold the same values in the same order. */
export const sameValues = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * The label of each value held: its option's among the options given, else the one kept before, so a value chosen
 * among options the page has since replaced keeps its label. A value no longer held is forgotten.
 */
export function keptLabels(
  kept: ReadonlyMap<string, string>,
  values: readonly string[],
  options: readonly ComboboxOption[]
): Map<string, string> {
  const given = new Map(options.map((option) => [option.value, option.label]));
  return new Map(
    values.flatMap((value): [string, string][] => {
      const label = given.get(value) ?? kept.get(value);
      return label === undefined ? [] : [[value, label]];
    })
  );
}
