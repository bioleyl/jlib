// The rows of a field with several values: what shows, what is kept, and whether another fits.

/** The rows shown: the values, or one empty row to type the first one in. */
export const rowsOf = (values: readonly string[]): string[] => (values.length === 0 ? [''] : [...values]);

/** The rows with the one at `index` changed. */
export const withRowAt = (rows: readonly string[], index: number, value: string): string[] =>
  rows.map((row, at) => (at === index ? value : row));

/** The rows without the one at `index`; one empty row stays when it was the last. */
export const withoutRowAt = (rows: readonly string[], index: number): string[] =>
  rowsOf(rows.filter((_, at) => at !== index));

/** The values kept: the rows people filled in. */
export const filledValues = (rows: readonly string[]): string[] => rows.filter((row) => row.trim() !== '');

/** Whether another row fits under `max`; none or zero means no limit. */
export const canAddRow = (count: number, max: number): boolean => max <= 0 || count < max;

/** Whether two lists hold the same values in the same order. */
export const sameValues = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);
