import { collator, dateTimeFormat, numberFormat } from './intl';

import type {
  TableAlign,
  TableCellFormat,
  TableCellRenderer,
  TableColumn,
  TableColumnChoice,
  TableExpansion,
  TableFrozen,
  TableRow,
  TableRowKey,
  TableSelectionState,
  TableSortDirection,
  TableToggle,
} from '../types/jl-table.types';

/** What a header press does to a column's order: ascending, then descending, then as the rows came. */
const NEXT_DIRECTION: Record<TableSortDirection, TableSortDirection> = { asc: 'desc', desc: 'none', none: 'asc' };

const DIRECTION_SIGN: Record<TableSortDirection, number> = { asc: 1, desc: -1, none: 0 };

const DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };
const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };
// Text sorts its numbers by value: "item 2" before "item 10".
const NUMERIC_TEXT: Intl.CollatorOptions = { numeric: true };

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

/**
 * A value of a column that names no number or date format: a number keeps its value and a `Date` its time, so a
 * column of numbers left as `text` does not order 10 before 2; anything else is ordered as text.
 */
function ownOrder(value: unknown): number | string {
  if (typeof value === 'number') {
    return value;
  }
  return value instanceof Date ? value.getTime() : String(value);
}

/** What a column orders its values by: numbers for numbers and dates, the value's own order for the rest. */
const SORT_VALUES: Record<TableCellFormat, (value: unknown) => number | string> = {
  badge: ownOrder,
  code: ownOrder,
  date: toTime,
  datetime: toTime,
  number: toNumber,
  text: ownOrder,
};

const TEXT_ORDERS: Record<TableCellFormat, Intl.CollatorOptions | undefined> = {
  badge: undefined,
  code: undefined,
  date: undefined,
  datetime: undefined,
  number: undefined,
  text: NUMERIC_TEXT,
};

/** A value as its column orders it, read once per sort; `undefined` when it cannot be ordered: empty, or unreadable. */
function sortValueOf(value: unknown, format: TableCellFormat): number | string | undefined {
  if (isEmpty(value)) {
    return undefined;
  }
  const sortValue = SORT_VALUES[format](value);
  return Number.isNaN(sortValue) ? undefined : sortValue;
}

const compareTextOf = (format: TableCellFormat, locale: string | undefined): ((a: string, b: string) => number) =>
  collator(locale, TEXT_ORDERS[format]).compare;

/** Orders two sort values one way, the values that cannot be ordered after the others in both directions. */
function compareSortValues(
  a: number | string | undefined,
  b: number | string | undefined,
  sign: number,
  compareText: (a: string, b: string) => number
): number {
  if (a === undefined || b === undefined) {
    return Number(a === undefined) - Number(b === undefined);
  }
  return sign * (typeof a === 'number' && typeof b === 'number' ? a - b : compareText(String(a), String(b)));
}

/**
 * Orders two cell values ascending: numbers by value, dates by time, text with `localeCompare`. Empty and
 * unreadable values come after the others.
 */
export const compareCells = (a: unknown, b: unknown, format: TableCellFormat, locale?: string): number =>
  compareSortValues(sortValueOf(a, format), sortValueOf(b, format), 1, compareTextOf(format, locale));

/**
 * A row's field by its name, whatever the page's type of row: a column names its field as text, and the HTML that
 * writes the rows is not checked against a type.
 */
export const fieldOf = (row: object, key: string): unknown => Reflect.get(row, key);

/** How a column orders: which way, its values read in which format, its text compared in which language. */
interface ColumnOrder {
  direction: TableSortDirection;
  format?: TableCellFormat;
  locale?: string;
}

/**
 * Items ordered by a value of each, read once per item rather than at every comparison; `none` gives them back as
 * they came. The sort is stable, and empty values stay at the end in both directions.
 */
export function sortBy<Item>(
  items: readonly Item[],
  readValue: (item: Item) => unknown,
  order: ColumnOrder
): Item[] {
  const sign = DIRECTION_SIGN[order.direction];
  if (sign === 0) {
    return [...items];
  }
  const format = order.format ?? 'text';
  const compareText = compareTextOf(format, order.locale);
  return items
    .map((item) => ({ item, value: sortValueOf(readValue(item), format) }))
    .sort((a, b) => compareSortValues(a.value, b.value, sign, compareText))
    .map(({ item }) => item);
}

/**
 * The rows ordered by one column; `none` gives them back as they came. The sort is stable, and empty values stay
 * at the end in both directions.
 */
export function sortRows<Row extends object>(
  rows: readonly Row[],
  key: string,
  direction: TableSortDirection,
  format: TableCellFormat = 'text',
  locale?: string
): Row[] {
  return key === '' ? [...rows] : sortBy(rows, (row) => fieldOf(row, key), { direction, format, locale });
}

const FORMATTERS: Record<TableCellFormat, (value: unknown, locale?: string) => string> = {
  badge: (value) => String(value),
  code: (value) => String(value),
  date: (value, locale) => {
    const time = toTime(value);
    return Number.isNaN(time) ? String(value) : dateTimeFormat(locale, DATE_FORMAT).format(time);
  },
  datetime: (value, locale) => {
    const time = toTime(value);
    return Number.isNaN(time) ? String(value) : dateTimeFormat(locale, DATE_TIME_FORMAT).format(time);
  },
  number: (value, locale) => {
    const number = toNumber(value);
    return Number.isNaN(number) ? String(value) : numberFormat(locale).format(number);
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
export function columnAlign(column: Pick<TableColumn, 'align' | 'format'>): TableAlign {
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
export function rowKeyOf(row: object, keyField: string, index: number): TableRowKey {
  const value = fieldOf(row, keyField);
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
  const shown = new Set(keys);
  const others = [...selected].filter((key) => !shown.has(key));
  return selectionState(keys, selected) === 'all' ? others : [...others, ...keys];
}

/** The selection with one row added or taken out; the hidden columns with one column added or taken out. */
export function toggleKey<Key extends TableRowKey>(selected: readonly Key[], key: Key, on: boolean): Key[] {
  const without = selected.filter((candidate) => candidate !== key);
  return on ? [...without, key] : without;
}

/** The columns drawn: those `hidden` does not name, and every column that cannot be hidden. */
export function shownColumns<Column extends Pick<TableColumn, 'hideable' | 'key'>>(
  columns: readonly Column[],
  hidden: readonly string[]
): Column[] {
  const hiddenKeys = new Set(hidden);
  return columns.filter((column) => column.hideable === false || !hiddenKeys.has(column.key));
}

/**
 * The column chooser's lines, in the columns' order: each column shown or not, and locked when it cannot be hidden
 * or is the last one shown, so a table never hides all its columns from its chooser.
 */
export function columnChoices<Column extends Pick<TableColumn, 'hideable' | 'key' | 'label'>>(
  columns: readonly Column[],
  hidden: readonly string[]
): TableColumnChoice<Column['key']>[] {
  const shown = new Set(shownColumns(columns, hidden).map((column) => column.key));
  return columns.map((column) => ({
    key: column.key,
    label: column.label,
    locked: column.hideable === false || (shown.size === 1 && shown.has(column.key)),
    shown: shown.has(column.key),
  }));
}

const OPEN_ROWS: Record<TableExpansion, (expanded: readonly TableRowKey[]) => TableRowKey[]> = {
  multiple: (expanded) => [...expanded],
  none: () => [],
  single: (expanded) => expanded.slice(-1),
};

/** The rows shown open: none when rows do not open, the last one opened when they open one at a time. */
export const openRows = (expanded: readonly TableRowKey[], expansion: TableExpansion): TableRowKey[] =>
  OPEN_ROWS[expansion](expanded);

const ROW_OPENERS: Record<
  TableExpansion,
  (expanded: readonly TableRowKey[], key: TableRowKey, open: boolean) => TableRowKey[]
> = {
  multiple: (expanded, key, open) => toggleKey(expanded, key, open),
  none: (expanded) => [...expanded],
  single: (expanded, key, open) =>
    open ? [key] : openRows(expanded, 'single').filter((candidate) => candidate !== key),
};

/** The open rows after one opens or closes: one at a time, opening a row closes the one that was open. */
export const withRowOpen = (
  expanded: readonly TableRowKey[],
  key: TableRowKey,
  open: boolean,
  expansion: TableExpansion
): TableRowKey[] => ROW_OPENERS[expansion](expanded, key, open);

/** What changed between two sets of open rows, as the `toggle` events to emit: the rows closed, then those opened. */
export function rowToggles(before: Iterable<TableRowKey>, after: Iterable<TableRowKey>): TableToggle[] {
  const was = new Set(before);
  const is = new Set(after);
  const closed = [...was].filter((key) => !is.has(key)).map((key) => ({ key, open: false }));
  const opened = [...is].filter((key) => !was.has(key)).map((key) => ({ key, open: true }));
  return [...closed, ...opened];
}

/** A row of data or of headings: not an open row's detail nor the empty row, whose one cell spans them all. */
const FROZEN_ROW = 'tr:not(.detail, .empty)';

/**
 * The cells that stay in view at each side: as many columns as asked among those shown, the end giving way to the
 * start when they would overlap, and at the start the checkbox and chevron cells before them.
 */
export function frozenCells(shown: number, lead: number, asked: TableFrozen): TableFrozen {
  const start = Math.min(Math.max(asked.start, 0), shown);
  const end = Math.min(Math.max(asked.end, 0), shown - start);
  return { end, start: start === 0 ? 0 : lead + start };
}

/** Where each of some cells side by side stands from their edge: the widths of the cells before it, added up. */
export const stickyOffsets = (widths: readonly number[]): number[] =>
  widths.map((_, index) => widths.slice(0, index).reduce((sum, width) => sum + width, 0));

/**
 * The rules that keep the frozen cells in view, by their place in the row, so that rows drawn later need nothing:
 * each cell's offset is a custom property the table measures (`--frozen-start-0`…, `--frozen-end-0`…, counted from
 * the edge), the cells take the surface under the rows' shades, and a line marks each frozen side while the rows
 * scroll sideways (`scrolls-sideways` on the host).
 */
export function frozenCss({ end, start }: TableFrozen): string {
  const sides = [
    start > 0 ? `:nth-child(-n + ${start})` : '',
    end > 0 ? `:nth-last-child(-n + ${end})` : '',
  ].filter((side) => side !== '');
  if (sides.length === 0) {
    return '';
  }
  const frozen = `${FROZEN_ROW} > :is(${sides.join(', ')})`;
  const starts = Array.from(
    { length: start },
    (_, index) => `${FROZEN_ROW} > :nth-child(${index + 1}) { left: var(--frozen-start-${index}); }`
  );
  const ends = Array.from(
    { length: end },
    (_, index) => `${FROZEN_ROW} > :nth-last-child(${index + 1}) { right: var(--frozen-end-${index}); }`
  );
  const lines = [
    start > 0
      ? `:host([scrolls-sideways]) ${FROZEN_ROW} > :nth-child(${start}) { border-right: 1px solid var(--jl-line); }`
      : '',
    end > 0
      ? `:host([scrolls-sideways]) ${FROZEN_ROW} > :nth-last-child(${end}) { border-left: 1px solid var(--jl-line); }`
      : '',
  ].filter((line) => line !== '');
  return [
    `${frozen} { position: sticky; }`,
    `thead ${frozen} { z-index: 3; }`,
    `tbody ${frozen} { z-index: 1; }`,
    // No weight: a row's shade (hover, selection, marks, stripes) still wins over it.
    `:where(tbody ${frozen}) { background: var(--jl-surface); }`,
    ...starts,
    ...ends,
    ...lines,
  ].join('\n');
}

/**
 * A renderer of `renderers` written for the page's own type of row, for a table that does not say its type of row:
 * the table hands each renderer back a row the page gave it, so
 * `cellOf<Order>((order) => <JlLink href={order.href} label={order.name} />)` reads it typed. A table typed by its
 * rows (`JlTable<Order>`) hands its renderers an order already.
 */
export const cellOf =
  <Row>(draw: (row: Row) => Node): TableCellRenderer =>
  (row: TableRow) =>
    draw(row as Row);
