import { css } from '@jadis/core';
import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, Columns3, Inbox } from 'lucide';

import { JlBadge } from '../atoms/jl-badge';
import { JlButton } from '../atoms/jl-button';
import { JlCheckbox } from '../atoms/jl-checkbox';
import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { clampedNumber, jsonOf, oneOf, textListOf, textOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { PRESS_EVENTS, pressButtonOf, tellPress } from '../lib/press';
import { watchSizes } from '../lib/resize';
import { shownSlotted, showsSlotted } from '../lib/slots';
import { startedOnControl } from '../lib/surface';
import {
  columnAlign,
  columnChoices,
  columnWidth,
  fieldOf,
  formatCell,
  frozenCells,
  frozenCss,
  nextSortDirection,
  openRows,
  rowKeyOf,
  rowToggles,
  selectionState,
  shownColumns,
  sortBy,
  stickyOffsets,
  toggleAll,
  toggleKey,
  withRowOpen,
} from '../lib/table';
import { jlText } from '../lib/texts';
import { JlPopover } from '../molecules/jl-popover';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-table.css?inline';

import type {
  TableCellFormat,
  TableColumn,
  TableColumnKey,
  TableDetailRenderer,
  TableExpansion,
  TableField,
  TableFrozen,
  TablePress,
  TableRenderers,
  TableRow,
  TableRowKey,
  TableSort,
  TableSortDirection,
  TableSortMode,
  TableToggle,
} from '../types/jl-table.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  'chevron-right': ChevronRight,
  'chevrons-up-down': ChevronsUpDown,
  'columns-3': Columns3,
  inbox: Inbox,
});

export const TABLE_SORT_DIRECTIONS: readonly TableSortDirection[] = ['none', 'asc', 'desc'];
export const TABLE_SORT_MODES: readonly TableSortMode[] = ['local', 'remote'];
export const TABLE_EXPANSIONS: readonly TableExpansion[] = ['none', 'single', 'multiple'];

const MARKED_ATTRIBUTE = 'data-marked';
const DETAIL_ID_PREFIX = 'detail-';
const DEFAULT_ROW_KEY = 'id';
const NO_SORT_KEY = '';
const SKELETON_ROWS = 5;
const SORT_ICON_SIZE = 14;
const EMPTY_ICON_SIZE = 18;
const CHEVRON_SIZE = 16;
const NO_SORT: TableSortDirection = 'none';
const LOCAL_SORT: TableSortMode = 'local';
const NO_EXPANSION: TableExpansion = 'none';
const NO_FROZEN = 0;

const ARIA_SORT: Record<TableSortDirection, string> = { asc: 'ascending', desc: 'descending', none: '' };
const SORT_ICONS: Record<TableSortDirection, string> = {
  asc: 'arrow-up',
  desc: 'arrow-down',
  none: 'chevrons-up-down',
};

type CellMaker = (text: string, column: Pick<TableColumn, 'tones'>) => Node | string;

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
      <input
        type="checkbox"
        class="checkbox"
        id={index === null ? 'select-all' : `select-${index}`}
        aria-label={label}
        data-index={index ?? undefined}
      />
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

/**
 * What a flush draws again: the headings, the rows, only the rows' order, the column chooser's boxes, only what they
 * show, or the frozen columns.
 */
type Part = 'head' | 'body' | 'order' | 'chooser' | 'choices' | 'frozen';

/** A row of data as drawn: its element, whose `data-index` is the row's place in `rows`, its key and its row. */
interface DrawnRow<Row> {
  element: HTMLElement;
  key: TableRowKey;
  row: Row;
}

/** The column chooser, drawn the first time it shows: its button, the popover it opens, and the list in it. */
interface ChooserParts {
  button: JlButton;
  list: HTMLFieldSetElement;
  popover: JlPopover;
}

/** A state the table draws on rows by their keys. */
type RowState = 'marked' | 'open' | 'selected';

const NO_ROW_STATES = (): Record<RowState, TableRowKey[]> => ({ marked: [], open: [], selected: [] });

/** Ticks or clears a row's own checkbox, whose state the row's shade follows in CSS. */
function checkRow(element: HTMLElement, on: boolean): void {
  const input = element.querySelector<HTMLInputElement>(':scope > .select-cell .checkbox');
  if (input !== null) {
    input.checked = on;
  }
}

const isOpen = (row: Element): boolean =>
  row.querySelector(':scope > .expand-cell > .expand')?.getAttribute('aria-expanded') === 'true';

/**
 * Rows of data under column headings. `columns` say what each column shows and how (`format`: text, number, date,
 * badge, code); `rows` are plain objects. Sortable headings cycle ascending, descending and unsorted, and sort the
 * rows in place, or leave the order to the page (`sort-mode="remote"`); `selectable` adds a checkbox column.
 * `hidden-columns` leaves columns out, and `column-chooser` lets people choose them. The header stays on top while the
 * rows scroll within `max-height`, and the table scrolls sideways on narrow screens. Cells of a column can be drawn by
 * code with `renderers`. `expandable` rows open on a press to show their `detail` under them, the row staying as it is: one at
 * a time (`single`) or any number (`multiple`). A press on a row fires `press` with the row, the button and the
 * browser's event, which a page cancels to refuse it: to open a record on a click, its own menu on a right click.
 *
 * Typed by its rows, `JlTable<Order>` checks and completes the fields its columns name, and hands its renderers and
 * `detail` an order; `JlTable<Order, 'actions'>` adds a column that is not a field, which a renderer draws.
 */
export class JlTable<Row extends object = TableRow, Extra extends string = never> extends JlElement {
  static readonly selector = 'jl-table';

  readonly events = this.useEvents<{
    sort: TableSort<Row, Extra>;
    selection: TableRowKey[];
    toggle: TableToggle;
    press: TablePress<Row>;
    columns: TableColumnKey<Row, Extra>[];
  }>();

  readonly columns = this.useChange<TableColumn<Row, Extra>[]>(
    [],
    () => this.schedule('head', 'body', 'chooser'),
    {
      attribute: 'columns',
      parse: jsonOf<TableColumn<Row, Extra>[]>([]),
    }
  );
  readonly rows = this.useChange<Row[]>([], () => this.schedule('body'), {
    attribute: 'rows',
    parse: jsonOf<Row[]>([]),
  });
  /** The field that tells rows apart, for the selection. */
  readonly rowKey = this.useChange<TableField<Row> | typeof DEFAULT_ROW_KEY>(
    DEFAULT_ROW_KEY,
    () => this.schedule('body'),
    { attribute: 'row-key', parse: textOf<TableField<Row> | typeof DEFAULT_ROW_KEY>(DEFAULT_ROW_KEY) }
  );
  /** The column the rows are sorted by. */
  readonly sortKey = this.useChange<TableColumnKey<Row, Extra> | typeof NO_SORT_KEY>(
    NO_SORT_KEY,
    () => this.schedule('order'),
    { attribute: 'sort-key', parse: textOf<TableColumnKey<Row, Extra> | typeof NO_SORT_KEY>(NO_SORT_KEY) }
  );
  readonly sortDirection = this.useChange<TableSortDirection>(NO_SORT, () => this.schedule('order'), {
    attribute: 'sort-direction',
    parse: oneOf(TABLE_SORT_DIRECTIONS, NO_SORT),
  });
  /**
   * Who orders the rows: the table (`local`), or the page (`remote`): a heading's press then shows the sort and
   * emits `sort`, and the rows stay in the order given, as a server sorted them.
   */
  readonly sortMode = this.useChange<TableSortMode>(LOCAL_SORT, () => this.schedule('order'), {
    attribute: 'sort-mode',
    parse: oneOf(TABLE_SORT_MODES, LOCAL_SORT),
  });
  /** The keys of the columns not drawn; a column with `hideable: false` shows whatever it says. */
  readonly hiddenColumns = this.useChange<TableColumnKey<Row, Extra>[]>(
    [],
    () => this.schedule('head', 'body', 'choices'),
    { attribute: 'hidden-columns', parse: textListOf<TableColumnKey<Row, Extra>> }
  );
  /** A button at the end of the header row opens the list of columns, whose boxes show or hide them. */
  readonly columnChooser = this.useChange(false, (value) => this.renderColumnChooser(value), {
    attribute: 'column-chooser',
  });
  /** How many columns stay in view at the start while the rows scroll sideways; the checkbox and chevron stay too. */
  readonly frozenStart = this.useChange(NO_FROZEN, () => this.schedule('frozen'), {
    attribute: 'frozen-start',
    parse: clampedNumber(NO_FROZEN, NO_FROZEN, Number.MAX_SAFE_INTEGER),
  });
  /** How many columns stay in view at the end while the rows scroll sideways. */
  readonly frozenEnd = this.useChange(NO_FROZEN, () => this.schedule('frozen'), {
    attribute: 'frozen-end',
    parse: clampedNumber(NO_FROZEN, NO_FROZEN, Number.MAX_SAFE_INTEGER),
  });
  /** The column chooser's name, on its button and over its list; jlib's own text when empty. */
  readonly columnsLabel = this.useChange('', () => this.drawColumnsLabel(), { attribute: 'columns-label' });
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
  /** What the table says when it has no rows; jlib's own text when empty. */
  readonly emptyText = this.useChange('', () => this.schedule('body'), { attribute: 'empty-text' });
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
  readonly renderers = this.useChange<TableRenderers<Row, Extra>>({}, () => this.schedule('body'));

  // A function cannot be a useChange input: its set() would call it as an updater.
  private readonly _source: { detail: TableDetailRenderer<Row> | null } = { detail: null };
  private readonly _pending = {
    body: false,
    choices: false,
    chooser: false,
    frozen: false,
    head: false,
    order: false,
    queued: false,
  };
  // What watches `hidden` on the page's elements in the table: the bar under the rows follows those it holds.
  private readonly _footWatch = new MutationObserver((records) => {
    if (records.some((record) => record.target.parentNode === this)) {
      this.drawFoot();
    }
  });
  // What watches the frozen headings, the scroller and the table: a width that changes moves the frozen cells.
  private readonly _frozen = { sizes: watchSizes(() => this.measureFrozen()) };
  /**
   * The column chooser once drawn, its boxes by column key, changed in place so the focus stays on the box pressed,
   * and what watches the rows' scrollbar, which the chooser stands beside.
   */
  private readonly _chooser: {
    boxes: Map<string, JlCheckbox>;
    parts: ChooserParts | null;
    sizes: ResizeObserver;
  } = { boxes: new Map(), parts: null, sizes: watchSizes(() => this.placeChooser()) };
  /**
   * The rows as drawn in the order of `rows` (the rows and their checkboxes carry their place), by key, and their
   * keys in the order shown; the keys each state was last drawn for, so a change redraws only the rows it concerns.
   */
  private readonly _view: {
    byKey: Map<TableRowKey, DrawnRow<Row>[]>;
    drawn: DrawnRow<Row>[];
    keys: TableRowKey[];
    shown: Record<RowState, TableRowKey[]>;
  } = { byKey: new Map(), drawn: [], keys: [], shown: NO_ROW_STATES() };

  private readonly _refs = this.useRefs((ref) => ({
    body: ref('tbody'),
    chooser: ref('.chooser'),
    foot: ref('.foot'),
    footSlot: ref<HTMLSlotElement>('slot[name="footer"]'),
    frozenRules: ref<HTMLStyleElement>('style.frozen-rules'),
    head: ref<HTMLTableSectionElement>('thead'),
    scroll: ref('.scroll'),
    table: ref('table'),
  }));

  /** Draws what an open row shows under it, from the row: `(row) => <JlFacts items={…} />`. */
  get detail(): TableDetailRenderer<Row> | null {
    return this._source.detail;
  }

  set detail(draw: TableDetailRenderer<Row> | null) {
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
      <div class="frame" attrs={{ part: 'base' }}>
        <style class="frozen-rules" />
        <div class="chooser" hidden />
        <div class="scroll">
          <table>
            <thead />
            <tbody />
          </table>
        </div>
        <div class="foot" attrs={{ part: 'footer' }} hidden>
          <slot name="footer" />
        </div>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    // The first slotchange can come before onConnect: draw the bar now, then follow the changes.
    this.drawFoot();
    this.on(this._refs.footSlot, 'slotchange', () => this.drawFoot());
    // Hiding or showing what the bar holds changes no slot: the attribute is watched on the page's own elements.
    this._footWatch.observe(this, { attributeFilter: ['hidden'], subtree: true });
    this.on(this._refs.head, 'click', (event) => {
      const key = (event.target as Element).closest<HTMLElement>('button.sort')?.dataset.key;
      if (key !== undefined) {
        this.sortBy(key);
      }
    });
    // A box's native input event crosses the shadow root: stop it, or the listeners around would hear it, without a value.
    this.on(this._refs.table, 'input', (event) => {
      if (isTableCheckbox(event.target)) {
        event.stopPropagation();
      }
    });
    this.on(this._refs.table, 'change', (event) => {
      if (isTableCheckbox(event.target)) {
        this.changeSelection(event.target);
      }
    });
    for (const type of PRESS_EVENTS) {
      this.on(this._refs.body, type, (event) => this.pressRow(event));
    }
    this.watchScrollbar();
    this.watchFrozen();
  }

  onDisconnect(): void {
    this._footWatch.disconnect();
    this._chooser.sizes.disconnect();
    this._frozen.sizes.disconnect();
  }

  /** Shows or hides the column chooser, drawn the first time it shows: a table without one builds none. */
  private renderColumnChooser(shown: boolean): void {
    this.reflect('column-chooser', shown);
    this._refs.chooser.hidden = !shown;
    if (shown && this._chooser.parts === null) {
      this.drawChooser();
    }
    this.watchScrollbar();
  }

  private drawChooser(): void {
    const button: JlButton = <JlButton slot="trigger" icon="columns-3" variant="ghost" size="sm" />;
    const list: HTMLFieldSetElement = <fieldset class="column-list" />;
    const popover: JlPopover = (
      <JlPopover placement="bottom-end">
        {button}
        {list}
      </JlPopover>
    );
    this._chooser.parts = { button, list, popover };
    this._refs.chooser.replaceChildren(popover);
    this.drawColumnsLabel();
    this.schedule('chooser');
  }

  /** The rows' scrollbar is watched while the chooser shows, so it stands beside the bar, not over it. */
  private watchScrollbar(): void {
    this._chooser.sizes.disconnect();
    if (this.isConnected && this.columnChooser.get()) {
      this._chooser.sizes.observe(this._refs.scroll);
    }
  }

  /** The scroller's width counts its scrollbar and its client width does not: the chooser moves left by the bar. */
  private placeChooser(): void {
    const scroll = this._refs.scroll;
    this.style.setProperty('--scrollbar', `${scroll.offsetWidth - scroll.clientWidth}px`);
  }

  /**
   * The bar under the rows shows when the page put something in it that shows; what stands there alone goes to its
   * end. What the page keeps `hidden` (pages until there are several) is not there.
   */
  private drawFoot(): void {
    const foot = this._refs.foot;
    foot.hidden = !showsSlotted(this._refs.footSlot);
    foot.classList.toggle('alone', shownSlotted(this._refs.footSlot).length === 1);
  }

  /** Draws on the next microtask: the inputs set while connecting give one drawing, not one each. */
  protected drawTexts(): void {
    this.drawColumnsLabel();
    this.schedule('head', 'body');
  }

  /** The chooser's name: its button's, its list's and the heading over the list. */
  private drawColumnsLabel(): void {
    const parts = this._chooser.parts;
    if (parts === null) {
      return;
    }
    const label = this.columnsLabel.get() || jlText('columns');
    parts.button.hint.set(label);
    parts.popover.heading.set(label);
    parts.list.setAttribute('aria-label', label);
  }

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
    const { body, choices, chooser, frozen, head, order } = this._pending;
    Object.assign(this._pending, {
      body: false,
      choices: false,
      chooser: false,
      frozen: false,
      head: false,
      order: false,
      queued: false,
    });
    if (chooser) {
      this.renderChooser();
    }
    if (choices && !chooser) {
      this.renderChoices();
    }
    if (head) {
      this.renderHead();
    }
    if (head || frozen) {
      this.renderFrozen();
    }
    if (head || order) {
      this.renderSortState();
    }
    if (body) {
      this.renderBody();
    }
    if (order && !body) {
      this.renderOrder();
    }
    this.renderMarks();
    this.renderSelection();
    this.renderExpansion();
  }

  /** The columns drawn: all but the hidden ones, a column that cannot be hidden staying. */
  private shownColumns(): TableColumn<Row, Extra>[] {
    return shownColumns(this.columns.get(), this.hiddenColumns.get());
  }

  /** One box per column, in their order, drawn again when the columns change. */
  private renderChooser(): void {
    const list = this._chooser.parts?.list;
    if (list === undefined) {
      return;
    }
    const boxes = this.columns
      .get()
      .map(({ key, label }): [string, JlCheckbox] => [
        key,
        <JlCheckbox label={label} onChange={(shown) => this.chooseColumn(key, shown)} />,
      ]);
    this._chooser.boxes = new Map(boxes);
    list.replaceChildren(...this._chooser.boxes.values());
    this.renderChoices();
  }

  /** Ticks the boxes of the columns shown and turns off those that cannot change, in place. */
  private renderChoices(): void {
    for (const { key, locked, shown } of columnChoices(this.columns.get(), this.hiddenColumns.get())) {
      const box = this._chooser.boxes.get(key);
      box?.checked.set(shown);
      box?.disabled.set(locked);
    }
  }

  /** A box of the chooser was ticked or cleared: the column shows or hides, and the page hears which are hidden. */
  private chooseColumn(key: TableColumnKey<Row, Extra>, shown: boolean): void {
    const hidden = toggleKey(this.hiddenColumns.get(), key, !shown);
    this.hiddenColumns.set(hidden);
    this.events.emit('columns', hidden);
  }

  private sortBy(name: string): void {
    const key = this.columns.get().find((column) => column.key === name)?.key;
    if (key === undefined) {
      return;
    }
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
        : toggleKey(selected, this._view.drawn[Number(index)]?.key ?? Number(index), input.checked);
    this.selected.set(keys);
    this.events.emit('selection', keys);
  }

  /** A press on a row's chevron, or on the row anywhere but its controls and its checkbox, opens or closes it. */
  /**
   * A press on a row. The page hears of it first (`press`); then, for a click it did not refuse, an expandable row
   * opens or closes.
   */
  private pressRow(event: MouseEvent): void {
    const element = this.dataRowOf(event);
    const drawn = element === undefined ? undefined : this._view.drawn[Number(element.dataset.index)];
    const button = pressButtonOf(event);
    if (element === undefined || drawn === undefined || button === null) {
      return;
    }
    const onRow = this.isOnRowItself(event, element);
    const press = { button, event, key: drawn.key, row: drawn.row };
    const refused = onRow && tellPress(event, () => this.events.emit('press', press));
    if (refused || button !== 'main' || !this.opensOnPress(event, element, onRow)) {
      return;
    }
    this.toggle(drawn.key, !isOpen(element));
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

  /**
   * Whether a press is on the row itself: not on a control in it (a link, a button, its chevron), nor in its
   * selection cell, nor the end of a drag that selected text. Those keep their press for themselves.
   */
  private isOnRowItself(event: MouseEvent, row: HTMLElement): boolean {
    const select = row.querySelector('.select-cell');
    const onSelectCell = select !== null && event.composedPath().includes(select);
    return !(startedOnControl(event, row) || onSelectCell || isSelectingText());
  }

  /** An expandable row opens on a press on itself, and on its chevron. */
  private opensOnPress(event: MouseEvent, row: HTMLElement, onRow: boolean): boolean {
    const chevron = row.querySelector('button.expand');
    return chevron !== null && (onRow || event.composedPath().includes(chevron));
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
  private span(columns: TableColumn<Row, Extra>[]): number {
    return columns.length + Number(this.selectable.get()) + Number(this.isExpandable());
  }

  /** The cells that stay in view at each side: the frozen columns among those shown, the lead cells with the start. */
  private frozenCells(): TableFrozen {
    const lead = Number(this.selectable.get()) + Number(this.isExpandable());
    return frozenCells(this.shownColumns().length, lead, {
      end: this.frozenEnd.get(),
      start: this.frozenStart.get(),
    });
  }

  /** The rules that keep the frozen cells in view, by their place in the row: rows drawn later need nothing. */
  private renderFrozen(): void {
    const rules = frozenCss(this.frozenCells());
    if (this._refs.frozenRules.textContent !== rules) {
      this._refs.frozenRules.textContent = rules;
    }
    this.watchFrozen();
  }

  private watchFrozen(): void {
    const sizes = this._frozen.sizes;
    sizes.disconnect();
    const { end, start } = this.frozenCells();
    if (!this.isConnected || start + end === 0) {
      this.reflect('scrolls-sideways', false);
      return;
    }
    const cells = this.headingCells();
    const frozen = [...cells.slice(0, start), ...cells.slice(cells.length - end)];
    for (const element of [...frozen, this._refs.scroll, this._refs.table]) {
      sizes.observe(element);
    }
  }

  /** The frozen cells' offsets, from the headings' widths, and whether the rows scroll sideways, which shows the lines. */
  private measureFrozen(): void {
    const { end, start } = this.frozenCells();
    const widths = this.headingCells().map((cell) => cell.getBoundingClientRect().width);
    this.setFrozenOffsets('start', stickyOffsets(widths.slice(0, start)));
    this.setFrozenOffsets('end', stickyOffsets(widths.slice(widths.length - end).reverse()));
    const scroll = this._refs.scroll;
    this.reflect('scrolls-sideways', scroll.scrollWidth > scroll.clientWidth);
  }

  private setFrozenOffsets(side: keyof TableFrozen, offsets: number[]): void {
    offsets.forEach((offset, index) => {
      this.style.setProperty(`--frozen-${side}-${index}`, `${offset}px`);
    });
  }

  private headingCells(): HTMLTableCellElement[] {
    return [...(this._refs.head.rows[0]?.cells ?? [])];
  }

  private renderHead(): void {
    const selectAll = this.selectable.get() ? (
      <th class="select-cell" scope="col">
        {checkbox(jlText('selectAllRows'), null)}
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
        {this.shownColumns().map((column) => this.headerCell(column))}
      </tr>
    );
  }

  private headerCell(column: TableColumn<Row, Extra>): HTMLElement {
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

  /** The arrows and `aria-sort` of the sortable headings, changed in place so a pressed heading keeps the focus. */
  private renderSortState(): void {
    const sortKey = this.sortKey.get();
    for (const cell of this._refs.head.querySelectorAll<HTMLElement>('th[data-key]:has(> .sort)')) {
      const direction = cell.dataset.key === sortKey ? this.sortDirection.get() : NO_SORT;
      setOrRemove(cell, 'aria-sort', ARIA_SORT[direction]);
      cell.querySelector<JlIcon>('.sort-icon')?.name.set(SORT_ICONS[direction]);
    }
  }

  /**
   * The drawn rows in the order of the sort; each row's sort value is read once, not at every comparison. Sorted by
   * the page, they stay in the order given.
   */
  private sortedView(): DrawnRow<Row>[] {
    const key = this.sortKey.get();
    if (key === NO_SORT_KEY || this.sortMode.get() === 'remote') {
      return [...this._view.drawn];
    }
    const format = this.columns.get().find((column) => column.key === key)?.format;
    return sortBy(this._view.drawn, ({ row }) => fieldOf(row, key), {
      direction: this.sortDirection.get(),
      format,
    });
  }

  private renderBody(): void {
    const columns = this.shownColumns();
    if (this.loading.get()) {
      this.setView([]);
      this._refs.body.replaceChildren(...this.skeletonRows(columns));
      return;
    }
    const rows = this.rows.get();
    if (rows.length === 0) {
      this.setView([]);
      this._refs.body.replaceChildren(this.emptyRow(this.span(columns)));
      return;
    }
    const keyField = this.rowKey.get();
    this.setView(
      rows.map((row, index) => ({
        element: this.bodyRow(row, index, columns),
        key: rowKeyOf(row, keyField, index),
        row,
      }))
    );
    this._refs.body.replaceChildren(...this.placeInOrder().map(({ element }) => element));
  }

  /** New rows, which show no state yet: the flush draws the selection, the marks and the open rows on them. */
  private setView(drawn: DrawnRow<Row>[]): void {
    this._view.drawn = drawn;
    this._view.byKey = Map.groupBy(drawn, ({ key }) => key);
    // None until they are placed in order: an empty or loading table has no row for the select-all box to take.
    this._view.keys = [];
    this._view.shown = NO_ROW_STATES();
  }

  /** The rows in the order of the sort, whose keys the select-all box goes by from now on. */
  private placeInOrder(): DrawnRow<Row>[] {
    const sorted = this.sortedView();
    this._view.keys = sorted.map(({ key }) => key);
    return sorted;
  }

  /** Moves the rows into the order of the sort, each open row's detail with it: no row is drawn again. */
  private renderOrder(): void {
    const body = this._refs.body;
    const nodes = this.placeInOrder().flatMap(({ element }) => {
      const detail = detailOf(element);
      return detail === null ? [element] : [element, detail];
    });
    nodes.forEach((node, index) => {
      const current = body.children.item(index);
      if (current !== node) {
        body.insertBefore(node, current);
      }
    });
  }

  private bodyRow(row: Row, index: number, columns: TableColumn<Row, Extra>[]): HTMLElement {
    const first = columns[0];
    const name = first === undefined ? String(index + 1) : formatCell(fieldOf(row, first.key), first.format);
    const select = this.selectable.get() ? (
      <td class="select-cell">{checkbox(jlText('selectNamed', { name }), index)}</td>
    ) : null;
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
  private cell(row: Row, column: TableColumn<Row, Extra>): Node | string {
    const value = this.cellValue(row, column);
    const description = column.description === undefined ? '' : formatCell(fieldOf(row, column.description));
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

  private cellValue(row: Row, column: TableColumn<Row, Extra>): Node | string {
    const renderer = this.renderers.get()[column.key];
    if (renderer !== undefined) {
      return renderer(row);
    }
    const format = column.format ?? 'text';
    return CELL_MAKERS[format](formatCell(fieldOf(row, column.key), format), column);
  }

  private skeletonRows(columns: TableColumn<Row, Extra>[]): Node[] {
    const select = this.selectable.get();
    const expand = this.isExpandable();
    return Array.from({ length: SKELETON_ROWS }, () => (
      <tr class="skeleton" attrs={{ 'aria-hidden': 'true' }}>
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
            <span>{this.emptyText.get() || jlText('noData')}</span>
          </span>
        </td>
      </tr>
    );
  }

  /**
   * Draws a state on the rows whose keys came into it or left it since it was last drawn: checking or opening one
   * row changes that row alone, whatever the number of rows.
   */
  private redraw(state: RowState, keys: TableRowKey[], draw: (element: HTMLElement, on: boolean) => void): void {
    const changes = rowToggles(this._view.shown[state], keys);
    this._view.shown[state] = keys;
    for (const { key, open } of changes) {
      for (const { element } of this._view.byKey.get(key) ?? []) {
        draw(element, open);
      }
    }
  }

  /** The bar and the shade of marked rows, changed in place; `aria-selected` tells a screen reader the same. */
  private renderMarks(): void {
    this.redraw('marked', this.marked.get(), (element, on) => {
      element.toggleAttribute(MARKED_ATTRIBUTE, on);
      setOrRemove(element, 'aria-selected', on ? 'true' : '');
    });
  }

  /** The details of the open rows, added under them and taken away in place: one that stays open keeps its content. */
  private renderExpansion(): void {
    this.redraw('open', openRows(this.expanded.get(), this.expandable.get()), (element, open) =>
      this.renderRowOpen(element, open)
    );
  }

  private renderRowOpen(row: HTMLElement, open: boolean): void {
    const chevron = row.querySelector<HTMLButtonElement>('button.expand');
    if (chevron === null) {
      return;
    }
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
    const data = this._view.drawn[Number(row.dataset.index)]?.row;
    const draw = this._source.detail;
    return (
      <tr class="detail" id={id}>
        <td colSpan={this.span(this.shownColumns())}>
          <div class="detail-body">{data === undefined || draw === null ? '' : draw(data)}</div>
        </td>
      </tr>
    );
  }

  /** The checkboxes of the rows whose selection changed, and the select-all box. */
  private renderSelection(): void {
    this.redraw('selected', this.selected.get(), checkRow);
    const all = this._refs.head.querySelector<HTMLInputElement>('input.checkbox');
    if (all === null) {
      return;
    }
    const state = selectionState(this._view.keys, new Set(this.selected.get()));
    all.checked = state === 'all';
    all.indeterminate = state === 'some';
    all.disabled = this._view.keys.length === 0;
  }
}

JlTable.register();
