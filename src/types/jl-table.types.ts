import type { Tone } from './options.types';

/** How a cell shows its value: as it is, a localised number, date or date and time, a badge, or code. */
export type TableCellFormat = 'text' | 'number' | 'date' | 'datetime' | 'badge' | 'code';

export type TableAlign = 'left' | 'center' | 'right';

/** The order of a sorted column; `none` keeps the rows as they came. */
export type TableSortDirection = 'asc' | 'desc' | 'none';

export type TableColumn = {
  /** The row's field shown in this column. */
  key: string;
  label: string;
  /** Numbers are right-aligned when absent; the rest left. */
  align?: TableAlign;
  sortable?: boolean;
  /** A CSS width: `120px`, `20%`; a number is pixels. */
  width?: string | number;
  format?: TableCellFormat;
  /** For badges: the tone of each value (`{ "Active": "ok" }`); neutral otherwise. */
  tones?: Record<string, Tone>;
  /** The row's field shown as a quieter line under the value: a package's format under its name. */
  description?: string;
  /**
   * Long text, a description or a note, breaks over lines instead of widening the table; cells stay on one line
   * otherwise.
   */
  wrap?: boolean;
};

export type TableRow = Record<string, unknown>;

/** A row's identity, the value of its `row-key` field. */
export type TableRowKey = string | number;

export type TableSort = { key: string; direction: TableSortDirection };

/** Draws a cell of a column in place of its formatted value. */
export type TableCellRenderer = (row: TableRow) => Node;

/** What the select-all box shows: no row selected, some, or all of them. */
export type TableSelectionState = 'none' | 'some' | 'all';
