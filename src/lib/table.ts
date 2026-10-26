import type {
  TableAlign,
  TableCellFormat,
  TableColumn,
  TableRow,
  TableRowKey,
  TableSelectionState,
  TableSortDirection,
} from '../types/jl-table.types';

/** What a header press does to a column's order: ascending, then descending, then as the rows came. */
const NEXT_DIRECTION: Record<TableSortDirection, TableSortDirection> = { asc: 'desc', desc: 'none', none: 'asc' };

const DIRECTION_SIGN: Record<TableSortDirection, number> = { asc: 1, desc: -1, none: 0 };

const DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };

export const nextSortDirection = (direction: TableSortDirection): TableSortDirection => NEXT_DIRECTION[direction];

const isEmpty = (value: unknown): boolean => value === null || value === undefined || value === '';

/** A cell's value as a number, `NaN` when it is not one. */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }
  return Number.NaN;
}

/** A cell's value as a time in milliseconds: a `Date`, a timestamp, or a date string; `NaN` otherwise. */
export function toTime(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Date.parse(value);
  }
  return Number.NaN;
}

const compareNumbers = (a: number, b: number): number => a - b;

const COMPARERS: Record<TableCellFormat, (a: unknown, b: unknown, locale?: string) => number> = {
  badge: (a, b, locale) => String(a).localeCompare(String(b), locale),
  code: (a, b, locale) => String(a).localeCompare(String(b), locale),
  date: (a, b) => compareNumbers(toTime(a), toTime(b)),
  number: (a, b) => compareNumbers(toNumber(a), toNumber(b)),
  text: (a, b, locale) => String(a).localeCompare(String(b), locale, { numeric: true }),
};

/** Whether a value cannot be ordered in the format: empty, or not a number or a date where one is expected. */
function isUnorderable(value: unknown, format: TableCellFormat): boolean {
  if (isEmpty(value)) {
    return true;
  }
  const unorderable: Record<TableCellFormat, () => boolean> = {
    badge: () => false,
    code: () => false,
    date: () => Number.isNaN(toTime(value)),
    number: () => Number.isNaN(toNumber(value)),
    text: () => false,
  };
  return unorderable[format]();
}

/**
 * Orders two cell values ascending: numbers by value, dates by time, text with `localeCompare`. Empty and
 * unreadable values come after the others.
 */
export function compareCells(a: unknown, b: unknown, format: TableCellFormat, locale?: string): number {
  const aMissing = isUnorderable(a, format);
  const bMissing = isUnorderable(b, format);
  if (aMissing || bMissing) {
    return Number(aMissing) - Number(bMissing);
  }
  return COMPARERS[format](a, b, locale);
}

/**
 * The rows ordered by one column; `none` gives them back as they came. The sort is stable, and empty values stay
 * at the end in both directions.
 */
export function sortRows(
  rows: readonly TableRow[],
  key: string,
  direction: TableSortDirection,
  format: TableCellFormat = 'text',
  locale?: string
): TableRow[] {
  const sign = DIRECTION_SIGN[direction];
  if (sign === 0 || key === '') {
    return [...rows];
  }
  return [...rows].sort((a, b) => {
    const aMissing = isUnorderable(a[key], format);
    const bMissing = isUnorderable(b[key], format);
    if (aMissing || bMissing) {
      return Number(aMissing) - Number(bMissing);
    }
    return sign * COMPARERS[format](a[key], b[key], locale);
  });
}

const FORMATTERS: Record<TableCellFormat, (value: unknown, locale?: string) => string> = {
  badge: (value) => String(value),
  code: (value) => String(value),
  date: (value, locale) => {
    const time = toTime(value);
    return Number.isNaN(time) ? String(value) : new Intl.DateTimeFormat(locale, DATE_FORMAT).format(time);
  },
  number: (value, locale) => {
    const number = toNumber(value);
    return Number.isNaN(number) ? String(value) : new Intl.NumberFormat(locale).format(number);
  },
  text: (value) => String(value),
};

/** A cell's text in its column's format; empty for a missing value. */
export function formatCell(value: unknown, format: TableCellFormat = 'text', locale?: string): string {
  if (isEmpty(value)) {
    return '';
  }
  return FORMATTERS[format](value, locale);
}

/** Where a column's cells align: as asked, otherwise numbers right and the rest left. */
export function columnAlign(column: TableColumn): TableAlign {
  return column.align ?? (column.format === 'number' ? 'right' : 'left');
}

/** A CSS width from a column's `width`: numbers are pixels. */
export function columnWidth(width: string | number | undefined): string {
  if (width === undefined) {
    return '';
  }
  return typeof width === 'number' ? `${width}px` : width;
}

/** A row's identity, read from its key field; its position when the field is missing. */
export function rowKeyOf(row: TableRow, keyField: string, index: number): TableRowKey {
  const value = row[keyField];
  return typeof value === 'string' || typeof value === 'number' ? value : index;
}

/** What the select-all box shows: empty, a dash for some rows, a tick for all of them. */
export function selectionState(
  keys: readonly TableRowKey[],
  selected: ReadonlySet<TableRowKey>
): TableSelectionState {
  const count = keys.filter((key) => selected.has(key)).length;
  if (count === 0) {
    return 'none';
  }
  return count === keys.length ? 'all' : 'some';
}

/** The selection after the select-all box is pressed: every row when not all were selected, else none of them. */
export function toggleAll(keys: readonly TableRowKey[], selected: ReadonlySet<TableRowKey>): TableRowKey[] {
  const others = [...selected].filter((key) => !keys.includes(key));
  return selectionState(keys, selected) === 'all' ? others : [...others, ...keys];
}

/** The selection with one row added or taken out. */
export function toggleKey(selected: readonly TableRowKey[], key: TableRowKey, on: boolean): TableRowKey[] {
  const without = selected.filter((candidate) => candidate !== key);
  return on ? [...without, key] : without;
}
