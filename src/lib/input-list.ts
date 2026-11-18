// The rows of a field with several values: what shows, what is kept, and whether another fits.

/**
 * A row: its text, and the index it had in the `values` last set from outside — its origin. A row keeps its origin
 * while it is typed in, emptied and filled again; a row added since has none.
 */
export type InputListRow = { value: string; origin: number | undefined };

/** An empty row with no origin, for a list that holds nothing. */
export const emptyRow = (): InputListRow => ({ origin: undefined, value: '' });

/** The rows shown: the values, each with its index, or one empty row to type the first one in. */
export const rowsOf = (values: readonly string[]): InputListRow[] =>
  values.length === 0 ? [emptyRow()] : values.map((value, origin) => ({ origin, value }));

/** The rows with the one at `index` changed; it keeps its origin. */
export const withRowAt = (rows: readonly InputListRow[], index: number, value: string): InputListRow[] =>
  rows.map((row, at) => (at === index ? { ...row, value } : row));

/** The rows without the one at `index`, the others keeping their origin; one empty row stays when it was the last. */
export const withoutRowAt = (rows: readonly InputListRow[], index: number): InputListRow[] => {
  const kept = rows.filter((_, at) => at !== index);
  return kept.length === 0 ? [emptyRow()] : kept;
};

/** The rows people filled in. */
export const filledRows = (rows: readonly InputListRow[]): InputListRow[] =>
  rows.filter((row) => row.value.trim() !== '');

/** The values kept: the rows people filled in. */
export const filledValues = (rows: readonly InputListRow[]): string[] => filledRows(rows).map((row) => row.value);

/** The origin of each value kept, in the same order: what tells a value from the one it started as. */
export const filledOrigins = (rows: readonly InputListRow[]): (number | undefined)[] =>
  filledRows(rows).map((row) => row.origin);

/** Whether another row fits under `max`; none or zero means no limit. */
export const canAddRow = (count: number, max: number): boolean => max <= 0 || count < max;

/** Whether two lists hold the same values in the same order. */
export const sameValues = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);
