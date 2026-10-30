import { css } from '@jadis/core';
import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, Inbox } from 'lucide';

import { JlBadge } from '../atoms/jl-badge';
import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf, oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { startedOnControl } from '../lib/surface';
import {
  columnAlign,
  columnWidth,
  formatCell,
  nextSortDirection,
  openRows,
  rowKeyOf,
  rowToggles,
  selectionState,
  sortRows,
  toggleAll,
  toggleKey,
  withRowOpen,
} from '../lib/table';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-table.css?raw';

import type {
  TableCellFormat,
  TableCellRenderer,
  TableColumn,
  TableDetailRenderer,
  TableExpansion,
  TableRow,
  TableRowKey,
  TableSort,
  TableSortDirection,
  TableToggle,
} from '../types/jl-table.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  'chevron-right': ChevronRight,
  'chevrons-up-down': ChevronsUpDown,
  inbox: Inbox,
});

export const TABLE_SORT_DIRECTIONS: readonly TableSortDirection[] = ['none', 'asc', 'desc'];
export const TABLE_EXPANSIONS: readonly TableExpansion[] = ['none', 'single', 'multiple'];

const MARKED_ATTRIBUTE = 'data-marked';
const EXPANDED_ATTRIBUTE = 'data-expanded';
const DETAIL_ID_PREFIX = 'detail-';
const DEFAULT_ROW_KEY = 'id';
const SKELETON_ROWS = 5;
const SORT_ICON_SIZE = 14;
const EMPTY_ICON_SIZE = 18;
const CHEVRON_SIZE = 16;
const NO_SORT: TableSortDirection = 'none';
const NO_EXPANSION: TableExpansion = 'none';

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

/** One of the table's own checkboxes, not an input a renderer drew. */
const isTableCheckbox = (target: EventTarget | null): target is HTMLInputElement =>
  target instanceof HTMLInputElement && target.matches('.select-cell > .check > .checkbox');

/** The detail drawn under a row while it is open. */
function detailOf(row: Element): Element | null {
  const next = row.nextElementSibling;
  return next?.classList.contains('detail') ? next : null;
}

/** Whether a press ends a drag that selected text, which leaves the row as it was. */
const isSelectingText = (): boolean => (document.getSelection()?.toString() ?? '') !== '';

type Part = 'head' | 'body';

/**
 * Rows of data under column headings. `columns` say what each column shows and how (`format`: text, number, date,
 * badge, code); `rows` are plain objects. Sortable headings cycle ascending, descending and unsorted, and sort the
 * rows in place; `selectable` adds a checkbox column. The header stays on top while the rows scroll within
 * `max-height`, and the table scrolls sideways on narrow screens. Cells of a column can be drawn by code with
 * `renderers`. `expandable` rows open on a press to show their `detail` under them, the row staying as it is: one at
 * a time (`single`) or any number (`multiple`).
 */
export class JlTable extends JlElement {
  static readonly selector = 'jl-table';

  readonly events = this.useEvents<{ sort: TableSort; selection: TableRowKey[]; toggle: TableToggle }>();

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
  /** Rows open on a press to show their `detail` under them: one at a time (`single`), any number (`multiple`). */
  readonly expandable = this.useChange<TableExpansion>(
    NO_EXPANSION,
    (value) => {
      this.reflect('expandable', value === NO_EXPANSION ? false : value);
      this.schedule('head', 'body');
    },
    { attribute: 'expandable', parse: oneOf(TABLE_EXPANSIONS, NO_EXPANSION) }
  );
  /** The keys of the open rows. */
  readonly expanded = this.useChange<TableRowKey[]>([], () => this.renderExpansion(), {
    attribute: 'expanded',
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

  // A function cannot be a useChange input: its set() would call it as an updater.
  private readonly _source: { detail: TableDetailRenderer | null } = { detail: null };
  private readonly _pending = { body: false, head: false, queued: false };
  /** The rows as drawn and their keys, by their place: the rows and their checkboxes carry the place. */
  private readonly _view = { keys: [] as TableRowKey[], rows: [] as TableRow[] };

  private readonly _refs = this.useRefs((ref) => ({
    body: ref('tbody'),
    head: ref('thead'),
    table: ref('table'),
  }));

  /** Draws what an open row shows under it, from the row: `(row) => <JlFacts items={…} />`. */
  get detail(): TableDetailRenderer | null {
    return this._source.detail;
  }

  set detail(draw: TableDetailRenderer | null) {
    this._source.detail = draw;
    this.whenRendered(() => this.schedule('body'));
  }

  /** Opens or closes a row, as a press on it would; one at a time, opening a row closes the one that was open. */
  toggle(key: TableRowKey, open: boolean): void {
    const expansion = this.expandable.get();
    if (expansion === NO_EXPANSION) {
      return;
    }
    const before = openRows(this.expanded.get(), expansion);
    const expanded = withRowOpen(this.expanded.get(), key, open, expansion);
    this.expanded.set(expanded);
    for (const change of rowToggles(before, openRows(expanded, expansion))) {
      this.events.emit('toggle', change);
    }
  }

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
      if (isTableCheckbox(event.target)) {
        this.changeSelection(event.target);
      }
    });
    this.on(this._refs.body, 'click', (event) => this.pressRow(event));
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
    this.renderExpansion();
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

  /** A press on a row's chevron, or on the row anywhere but its controls and its checkbox, opens or closes it. */
  private pressRow(event: MouseEvent): void {
    const row = this.dataRowOf(event);
    const key = row === undefined ? undefined : this.keyOf(row);
    if (row === undefined || key === undefined || !this.opensOnPress(event, row)) {
      return;
    }
    this.toggle(key, !row.hasAttribute(EXPANDED_ATTRIBUTE));
  }

  /** The row of data a press is on: one of the table's, not a row in the content of a detail. */
  private dataRowOf(event: Event): HTMLElement | undefined {
    const body = this._refs.body;
    return event
      .composedPath()
      .find(
        (target): target is HTMLElement =>
          target instanceof HTMLTableRowElement
          && target.parentElement === body
          && target.dataset.index !== undefined
      );
  }

  private opensOnPress(event: MouseEvent, row: HTMLElement): boolean {
    const path = event.composedPath();
    const chevron = row.querySelector('button.expand');
    if (chevron === null) {
      return false;
    }
    const select = row.querySelector('.select-cell');
    const elsewhere =
      startedOnControl(event, row) || (select !== null && path.includes(select)) || isSelectingText();
    return path.includes(chevron) || !elsewhere;
  }

  private renderMaxHeight(value: string): void {
    const height = /^\d+(\.\d+)?$/.test(value.trim()) ? `${value.trim()}px` : value;
    this.style.setProperty('--max-height', height === '' ? 'none' : height);
    this.reflect('scrolls', height !== '');
  }

  private isExpandable(): boolean {
    return this.expandable.get() !== NO_EXPANSION;
  }

  /** The number of cells in a row: the columns, after the checkbox and the chevron when there are. */
  private span(columns: TableColumn[]): number {
    return columns.length + Number(this.selectable.get()) + Number(this.isExpandable());
  }

  private renderHead(): void {
    const selectAll = this.selectable.get() ? (
      <th class="select-cell" scope="col">
        {checkbox('Select all rows', null)}
      </th>
    ) : null;
    const details = this.isExpandable() ? (
      <th class="expand-cell" scope="col">
        <span class="sr-only">{jlText('details')}</span>
      </th>
    ) : null;
    this._refs.head.replaceChildren(
      <tr>
        {selectAll}
        {details}
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
    if (this.loading.get()) {
      this.setView([], []);
      this._refs.body.replaceChildren(...this.skeletonRows(columns));
      return;
    }
    const rows = this.rows.get();
    if (rows.length === 0) {
      this.setView([], []);
      this._refs.body.replaceChildren(this.emptyRow(this.span(columns)));
      return;
    }
    const keyField = this.rowKey.get();
    const keys = new Map(rows.map((row, index) => [row, rowKeyOf(row, keyField, index)]));
    const sorted = this.sortedRows();
    this.setView(
      sorted,
      sorted.map((row, index) => keys.get(row) ?? index)
    );
    this._refs.body.replaceChildren(...sorted.map((row, index) => this.bodyRow(row, index, columns)));
    this.renderMarks();
  }

  private setView(rows: TableRow[], keys: TableRowKey[]): void {
    this._view.rows = rows;
    this._view.keys = keys;
  }

  private bodyRow(row: TableRow, index: number, columns: TableColumn[]): Node {
    const first = columns[0];
    const name = first === undefined ? String(index + 1) : formatCell(row[first.key], first.format);
    const select = this.selectable.get() ? <td class="select-cell">{checkbox(`Select ${name}`, index)}</td> : null;
    const chevron = this.isExpandable() ? (
      <td class="expand-cell">
        <button type="button" class="expand" aria-expanded="false" aria-label={jlText('detailsOf', { name })}>
          <JlIcon class="chevron" name="chevron-right" size={CHEVRON_SIZE} />
        </button>
      </td>
    ) : null;
    return (
      <tr data-index={index}>
        {select}
        {chevron}
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
    const expand = this.isExpandable();
    return Array.from({ length: SKELETON_ROWS }, () => (
      <tr class="skeleton">
        {select ? (
          <td class="select-cell">
            <span class="bone box" />
          </td>
        ) : null}
        {expand ? <td class="expand-cell" /> : null}
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

  /** The rows of data, without the details under the open ones. */
  private dataRows(): HTMLElement[] {
    return [...this._refs.body.querySelectorAll<HTMLElement>(':scope > tr[data-index]')];
  }

  private keyOf(row: HTMLElement): TableRowKey | undefined {
    return this._view.keys[Number(row.dataset.index)];
  }

  /** The bar and the shade of marked rows, changed in place. */
  private renderMarks(): void {
    const marked = new Set(this.marked.get());
    for (const row of this.dataRows()) {
      const key = this.keyOf(row);
      row.toggleAttribute(MARKED_ATTRIBUTE, key !== undefined && marked.has(key));
    }
  }

  /** The details of the open rows, added under them and taken away in place: one that stays open keeps its content. */
  private renderExpansion(): void {
    const open = new Set(openRows(this.expanded.get(), this.expandable.get()));
    for (const row of this.dataRows()) {
      const key = this.keyOf(row);
      this.renderRowOpen(row, key !== undefined && open.has(key));
    }
  }

  private renderRowOpen(row: HTMLElement, open: boolean): void {
    const chevron = row.querySelector<HTMLButtonElement>('button.expand');
    if (chevron === null) {
      return;
    }
    row.toggleAttribute(EXPANDED_ATTRIBUTE, open);
    chevron.setAttribute('aria-expanded', String(open));
    const detail = detailOf(row);
    if (!open) {
      detail?.remove();
      chevron.removeAttribute('aria-controls');
      return;
    }
    if (detail !== null) {
      return;
    }
    const id = `${DETAIL_ID_PREFIX}${row.dataset.index}`;
    row.after(this.detailRow(row, id));
    chevron.setAttribute('aria-controls', id);
  }

  private detailRow(row: HTMLElement, id: string): Node {
    const data = this._view.rows[Number(row.dataset.index)];
    const draw = this._source.detail;
    return (
      <tr class="detail" id={id}>
        <td colSpan={this.span(this.columns.get())}>
          <div class="detail-body">{data === undefined || draw === null ? '' : draw(data)}</div>
        </td>
      </tr>
    );
  }

  /** The checkboxes and the shading of selected rows, changed in place. */
  private renderSelection(): void {
    const selected = new Set(this.selected.get());
    for (const input of this._refs.body.querySelectorAll<HTMLInputElement>(
      ':scope > tr > .select-cell .checkbox'
    )) {
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
