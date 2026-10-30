import type { Tone } from './options.types';

/** How a cell shows its value: as it is, a localised number, date or date and time, a badge, or code. */
export type TableCellFormat = 'text' | 'number' | 'date' | 'datetime' | 'badge' | 'code';

export type TableAlign = 'left' | 'center' | 'right';

/** The order of a sorted column; `none` keeps the rows as they came. */
export type TableSortDirection = 'asc' | 'desc' | 'none';

/** A row of a table that does not say its type: any field, of any value. */
export type TableRow = Record<string, unknown>;

/** The names of a type of row's fields: what a column shows, sorts by, or shows under its value. */
export type TableField<Row> = Extract<keyof Row, string>;

/**
 * What a column's `key` names: a field of the row, or one of the `Extra` columns a renderer draws from the whole
 * row, such as a column of actions. The extra columns are named, never guessed from the keys: a misspelt field is
 * an error, not a new column.
 */
export type TableColumnKey<Row, Extra extends string = never> = TableField<Row> | NoInfer<Extra>;

/**
 * A column of a table. Typed by its rows (`TableColumn<Order>`), its `key` and `description` are fields of an
 * order, checked and completed by the editor.
 */
export type TableColumn<Row extends object = TableRow, Extra extends string = never> = {
  /** The row's field shown in this column, or one of the `Extra` columns a renderer draws. */
  key: TableColumnKey<Row, Extra>;
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
  description?: TableField<Row>;
  /**
   * Long text, a description or a note, breaks over lines instead of widening the table; cells stay on one line
   * otherwise.
   */
  wrap?: boolean;
};

/** A row's identity, the value of its `row-key` field. */
export type TableRowKey = string | number;

export type TableSort<Row extends object = TableRow, Extra extends string = never> = {
  key: TableColumnKey<Row, Extra>;
  direction: TableSortDirection;
};

/** Draws a cell of a column in place of its formatted value. */
export type TableCellRenderer<Row extends object = TableRow> = (row: Row) => Node;

/** The renderers of a table, by the key of the column whose cells they draw. */
export type TableRenderers<Row extends object = TableRow, Extra extends string = never> = {
  [Key in TableColumnKey<Row, Extra>]?: TableCellRenderer<Row>;
};

/** What the select-all box shows: no row selected, some, or all of them. */
export type TableSelectionState = 'none' | 'some' | 'all';

/** Whether rows open to show more under them: never, one at a time, or any number at once. */
export type TableExpansion = 'none' | 'single' | 'multiple';

/** Draws what an open row shows under it. */
export type TableDetailRenderer<Row extends object = TableRow> = (row: Row) => Node;

/** A row opened or closed: its key, and whether it is open now. */
export type TableToggle = { key: TableRowKey; open: boolean };
