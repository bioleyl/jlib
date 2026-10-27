import { css } from '@jadis/core';
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox } from 'lucide';

import { JlBadge } from '../atoms/jl-badge';
import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf, oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import {
  columnAlign,
  columnWidth,
  formatCell,
  nextSortDirection,
  rowKeyOf,
  selectionState,
  sortRows,
  toggleAll,
  toggleKey,
} from '../lib/table';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-table.css?raw';

import type {
  TableCellFormat,
  TableCellRenderer,
  TableColumn,
  TableRow,
  TableRowKey,
  TableSort,
  TableSortDirection,
} from '../types/jl-table.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'arrow-down': ArrowDown, 'arrow-up': ArrowUp, 'chevrons-up-down': ChevronsUpDown, inbox: Inbox });

export const TABLE_SORT_DIRECTIONS: readonly TableSortDirection[] = ['none', 'asc', 'desc'];

const MARKED_ATTRIBUTE = 'data-marked';
const DEFAULT_ROW_KEY = 'id';
const SKELETON_ROWS = 5;
const SORT_ICON_SIZE = 14;
const EMPTY_ICON_SIZE = 18;
const NO_SORT: TableSortDirection = 'none';

const ARIA_SORT: Record<TableSortDirection, string> = { asc: 'ascending', desc: 'descending', none: '' };
const SORT_ICONS: Record<TableSortDirection, string> = {
  asc: 'arrow-up',
  desc: 'arrow-down',
  none: 'chevrons-up-down',
};

type CellMaker = (text: string, column: TableColumn) => Node | string;

const CELL_MAKERS: Record<TableCellFormat, CellMaker> = {
  badge: (text, column) => (text === '' ? '' : <JlBadge label={text} tone={column.tones?.[text] ?? 'neutral'} />),
  code: (text) => (text === '' ? '' : <code>{text}</code>),
  date: (text) => text,
  datetime: (text) => text,
  number: (text) => text,
  text: (text) => text,
};

/** A checkbox drawn by the table: a native input for the keyboard and the form of things, its mark in CSS. */
function checkbox(label: string, index: number | null): Node {
  return (
    <span class="check">
      <input type="checkbox" class="checkbox" aria-label={label} data-index={index ?? undefined} />
      <span class="mark" aria-hidden="true" />
    </span>
  );
}

type Part = 'head' | 'body';

/**
 * Rows of data under column headings. `columns` say what each column shows and how (`format`: text, number, date,
 * badge, code); `rows` are plain objects. Sortable headings cycle ascending, descending and unsorted, and sort the
 * rows in place; `selectable` adds a checkbox column. The header stays on top while the rows scroll within
 * `max-height`, and the table scrolls sideways on narrow screens. Cells of a column can be drawn by code with
 * `renderers`.
 */
export class JlTable extends JlElement {
  static readonly selector = 'jl-table';

  readonly events = this.useEvents<{ sort: TableSort; selection: TableRowKey[] }>();

  readonly columns = this.useChange<TableColumn[]>([], () => this.schedule('head', 'body'), {
    attribute: 'columns',
    parse: jsonOf<TableColumn[]>([]),
  });
  readonly rows = this.useChange<TableRow[]>([], () => this.schedule('body'), {
    attribute: 'rows',
    parse: jsonOf<TableRow[]>([]),
  });
  /** The field that tells rows apart, for the selection. */
  readonly rowKey = this.useChange(DEFAULT_ROW_KEY, () => this.schedule('body'), { attribute: 'row-key' });
  /** The column the rows are sorted by. */
  readonly sortKey = this.useChange('', () => this.schedule('body'), { attribute: 'sort-key' });
  readonly sortDirection = this.useChange<TableSortDirection>(NO_SORT, () => this.schedule('body'), {
    attribute: 'sort-direction',
    parse: oneOf(TABLE_SORT_DIRECTIONS, NO_SORT),
  });
  /** Adds a checkbox to each row, and one in the header that selects them all. */
  readonly selectable = this.useChange(
    false,
    (value) => {
      this.reflect('selectable', value);
      this.schedule('head', 'body');
    },
    { attribute: 'selectable' }
  );
  /** The keys of the selected rows. */
  readonly selected = this.useChange<TableRowKey[]>([], () => this.renderSelection(), {
    attribute: 'selected',
    parse: jsonOf<TableRowKey[]>([]),
  });
  /** The keys of rows to draw attention to, such as a search's matches: a mark, not a selection. */
  readonly marked = this.useChange<TableRowKey[]>([], () => this.renderMarks(), {
    attribute: 'marked',
    parse: jsonOf<TableRowKey[]>([]),
  });
  /** Shorter rows, for long lists. */
  readonly dense = this.useChange(false, (value) => this.reflect('dense', value), { attribute: 'dense' });
  /** Shades every other row. */
  readonly striped = this.useChange(false, (value) => this.reflect('striped', value), { attribute: 'striped' });
  /** A CSS height past which the rows scroll under the header: `320px`, `50vh`; a number is pixels. */
  readonly maxHeight = this.useChange('', (value) => this.renderMaxHeight(value), { attribute: 'max-height' });
  /** What the table says when it has no rows. */
  readonly emptyText = this.useChange(jlText('noData'), () => this.schedule('body'), {
    attribute: 'empty-text',
  });
  /** Shows placeholder rows while the data loads. */
  readonly loading = this.useChange(
    false,
    (value) => {
      this.reflect('loading', value);
      setOrRemove(this._refs.table, 'aria-busy', value ? 'true' : '');
      this.schedule('body');
    },
    { attribute: 'loading' }
  );
  /** The table's name for screen readers. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.table, 'aria-label', value), {
    attribute: 'label',
  });
  /** Draws the cells of some columns by code, by column key: `{ name: (row) => <strong>{row.name}</strong> }`. */
  readonly renderers = this.useChange<Record<string, TableCellRenderer>>({}, () => this.schedule('body'));

  private readonly _pending = { body: false, head: false, queued: false };
  /** The keys of the rows as drawn, by their place: the checkboxes carry the place. */
  private readonly _view = { keys: [] as TableRowKey[] };

  private readonly _refs = this.useRefs((ref) => ({
    body: ref('tbody'),
    head: ref('thead'),
    table: ref('table'),
  }));

  templateHtml(): Node {
    return (
      <div class="scroll" attrs={{ part: 'base' }}>
        <table>
          <thead />
          <tbody />
        </table>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.head, 'click', (event) => {
      const key = (event.target as Element).closest<HTMLElement>('button.sort')?.dataset.key;
      if (key !== undefined) {
        this.sortBy(key);
      }
    });
    this.on(this._refs.table, 'change', (event) => {
      const input = event.target;
      if (input instanceof HTMLInputElement && input.classList.contains('checkbox')) {
        this.changeSelection(input);
      }
    });
  }

  /** Draws on the next microtask: the inputs set while connecting give one drawing, not one each. */
  private schedule(...parts: Part[]): void {
    for (const part of parts) {
      this._pending[part] = true;
    }
    if (this._pending.queued) {
      return;
    }
    this._pending.queued = true;
    queueMicrotask(() => this.flush());
  }

  private flush(): void {
    const { body, head } = this._pending;
    this._pending.body = false;
    this._pending.head = false;
    this._pending.queued = false;
    if (head) {
      this.renderHead();
    }
    this.renderSortState();
    if (body) {
      this.renderBody();
    }
    this.renderSelection();
  }

  private sortBy(key: string): void {
    const current = key === this.sortKey.get() ? this.sortDirection.get() : NO_SORT;
    const direction = nextSortDirection(current);
    this.sortKey.set(key);
    this.sortDirection.set(direction);
    this.events.emit('sort', { direction, key });
  }

  private changeSelection(input: HTMLInputElement): void {
    const index = input.dataset.index;
    const selected = this.selected.get();
    const keys =
      index === undefined
        ? toggleAll(this._view.keys, new Set(selected))
        : toggleKey(selected, this._view.keys[Number(index)] ?? Number(index), input.checked);
    this.selected.set(keys);
    this.events.emit('selection', keys);
  }

  private renderMaxHeight(value: string): void {
    const height = /^\d+(\.\d+)?$/.test(value.trim()) ? `${value.trim()}px` : value;
    this.style.setProperty('--max-height', height === '' ? 'none' : height);
    this.reflect('scrolls', height !== '');
  }

  private renderHead(): void {
    const selectAll = this.selectable.get() ? (
      <th class="select-cell" scope="col">
        {checkbox('Select all rows', null)}
      </th>
    ) : null;
    this._refs.head.replaceChildren(
      <tr>
        {selectAll}
        {this.columns.get().map((column) => this.headerCell(column))}
      </tr>
    );
  }

  private headerCell(column: TableColumn): HTMLElement {
    const content = column.sortable ? (
      <button type="button" class="sort" data-key={column.key}>
        <span>{column.label}</span>
        <JlIcon class="sort-icon" size={SORT_ICON_SIZE} />
      </button>
    ) : (
      column.label
    );
    const cell = (
      <th scope="col" class={`align-${columnAlign(column)}`} data-key={column.key}>
        {content}
      </th>
    );
    cell.style.width = columnWidth(column.width);
    return cell;
  }

  /** The arrows and `aria-sort` of the headings, changed in place so a pressed heading keeps the focus. */
  private renderSortState(): void {
    const sortKey = this.sortKey.get();
    for (const cell of this._refs.head.querySelectorAll<HTMLElement>('th[data-key]')) {
      const direction = cell.dataset.key === sortKey ? this.sortDirection.get() : NO_SORT;
      const sortable = cell.querySelector('.sort') !== null;
      setOrRemove(cell, 'aria-sort', sortable ? ARIA_SORT[direction] : '');
      cell.querySelector<JlIcon>('.sort-icon')?.name.set(SORT_ICONS[direction]);
      cell.toggleAttribute('data-sorted', direction !== NO_SORT);
    }
  }

  private sortedRows(): TableRow[] {
    const key = this.sortKey.get();
    const format = this.columns.get().find((column) => column.key === key)?.format;
    return sortRows(this.rows.get(), key, this.sortDirection.get(), format);
  }

  private renderBody(): void {
    const columns = this.columns.get();
    const span = columns.length + Number(this.selectable.get());
    if (this.loading.get()) {
      this._view.keys = [];
      this._refs.body.replaceChildren(...this.skeletonRows(columns));
      return;
    }
    const rows = this.rows.get();
    if (rows.length === 0) {
      this._view.keys = [];
      this._refs.body.replaceChildren(this.emptyRow(span));
      return;
    }
    const keyField = this.rowKey.get();
    const keys = new Map(rows.map((row, index) => [row, rowKeyOf(row, keyField, index)]));
    const sorted = this.sortedRows();
    this._view.keys = sorted.map((row, index) => keys.get(row) ?? index);
    this._refs.body.replaceChildren(...sorted.map((row, index) => this.bodyRow(row, index, columns)));
    this.renderMarks();
  }

  private bodyRow(row: TableRow, index: number, columns: TableColumn[]): Node {
    const first = columns[0];
    const name = first === undefined ? String(index + 1) : formatCell(row[first.key], first.format);
    const select = this.selectable.get() ? <td class="select-cell">{checkbox(`Select ${name}`, index)}</td> : null;
    return (
      <tr>
        {select}
        {columns.map((column) => (
          <td
            class={`align-${columnAlign(column)} format-${column.format ?? 'text'}${column.wrap ? ' wrap' : ''}`}>
            {this.cell(row, column)}
          </td>
        ))}
      </tr>
    );
  }

  /** A cell's value, drawn by its renderer or in its format, with the row's description under it when it has one. */
  private cell(row: TableRow, column: TableColumn): Node | string {
    const value = this.cellValue(row, column);
    const description = column.description === undefined ? '' : formatCell(row[column.description]);
    if (description === '') {
      return value;
    }
    return (
      <>
        <div class="cell-value">{value}</div>
        <div class="cell-description">{description}</div>
      </>
    );
  }

  private cellValue(row: TableRow, column: TableColumn): Node | string {
    const renderer = this.renderers.get()[column.key];
    if (renderer !== undefined) {
      return renderer(row);
    }
    const format = column.format ?? 'text';
    return CELL_MAKERS[format](formatCell(row[column.key], format), column);
  }

  private skeletonRows(columns: TableColumn[]): Node[] {
    const select = this.selectable.get();
    return Array.from({ length: SKELETON_ROWS }, () => (
      <tr class="skeleton">
        {select ? (
          <td class="select-cell">
            <span class="bone box" />
          </td>
        ) : null}
        {columns.map((column) => (
          <td class={`align-${columnAlign(column)}`}>
            <span class="bone" />
          </td>
        ))}
      </tr>
    ));
  }

  private emptyRow(span: number): Node {
    return (
      <tr class="empty">
        <td colSpan={Math.max(1, span)}>
          <span class="empty-content">
            <JlIcon name="inbox" size={EMPTY_ICON_SIZE} />
            <span>{this.emptyText.get()}</span>
          </span>
        </td>
      </tr>
    );
  }

  /** The bar and the shade of marked rows, changed in place: one body row per key while there are rows. */
  private renderMarks(): void {
    const marked = new Set(this.marked.get());
    const rows = this._view.keys.length === 0 ? [] : [...this._refs.body.children];
    for (const [index, row] of rows.entries()) {
      const key = this._view.keys[index];
      row.toggleAttribute(MARKED_ATTRIBUTE, key !== undefined && marked.has(key));
    }
  }

  /** The checkboxes and the shading of selected rows, changed in place. */
  private renderSelection(): void {
    const selected = new Set(this.selected.get());
    for (const input of this._refs.body.querySelectorAll<HTMLInputElement>('input.checkbox')) {
      const key = this._view.keys[Number(input.dataset.index)];
      const on = key !== undefined && selected.has(key);
      input.checked = on;
      input.closest('tr')?.toggleAttribute('data-selected', on);
    }
    const all = this._refs.head.querySelector<HTMLInputElement>('input.checkbox');
    if (all === null) {
      return;
    }
    const state = selectionState(this._view.keys, selected);
    all.checked = state === 'all';
    all.indeterminate = state === 'some';
    all.disabled = this._view.keys.length === 0;
  }
}

JlTable.register();
