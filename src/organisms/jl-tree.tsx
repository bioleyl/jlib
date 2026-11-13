import { css } from '@jadis/core';
import { ChevronRight, CircleAlert, File, Folder, FolderOpen } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlSpinner } from '../atoms/jl-spinner';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { isModifiedClick, setOrRemove, uniqueId } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { pageLocale } from '../lib/locale';
import { jlTemplate, jlText } from '../lib/texts';
import { allItems, childrenOf, isFolder, treeKeyAction, withExpanded, withExtraRows, withPage } from '../lib/tree';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-tree.css?inline';

import type { TreeAction, TreeItem, TreeLevel, TreeLevelEnd, TreeLoader, TreePage } from '../types/jl-tree.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({
  'chevron-right': ChevronRight,
  'circle-alert': CircleAlert,
  file: File,
  folder: Folder,
  'folder-open': FolderOpen,
});

const ICON_SIZE = 16;
const CHEVRON_SIZE = 14;
const FOLDER_ICON = 'folder';
const OPEN_FOLDER_ICON = 'folder-open';
const FILE_ICON = 'file';
const ERROR_ICON = 'circle-alert';
// The row that ends a level (its next page, its error) is reached as an item: its id is no item's.
const LEVEL_END_PREFIX = 'jl-tree-level-end:';
const COUNT_PLACEHOLDER = '{count}';
// The children of a closed folder, which the CSS hides.
const CLOSED_GROUP = '[aria-expanded="false"] > .group';

type Rows = Map<string, HTMLElement>;

const levelEndId = (parent: string | null): string => `${LEVEL_END_PREFIX}${parent ?? ''}`;
const isLevelEnd = (id: string): boolean => id.startsWith(LEVEL_END_PREFIX);
const parentOfLevelEnd = (id: string): string | null => id.slice(LEVEL_END_PREFIX.length) || null;
const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** The rows of items in these nodes, by id: the nodes themselves and the rows inside them. */
const rowsIn = (nodes: readonly Node[]): Rows =>
  new Map(
    nodes
      .filter((node): node is HTMLElement => node instanceof HTMLElement)
      .flatMap((node) => [node, ...node.querySelectorAll<HTMLElement>('[role="treeitem"]')])
      .flatMap((row) => (row.dataset.id === undefined ? [] : [[row.dataset.id, row] as const]))
  );

/**
 * Nested items that open and close, as files in folders: `items` holds them, `expanded` lists the open folders and
 * `value` is the selected item. With a `loader`, the tree loads itself a level at a time and a page at a time, so a
 * large archive opens without loading everything: the roots first, a `lazy` folder's children when it opens, and
 * the next page of a level from the button that ends it. The keyboard follows the tree pattern: Up and Down move,
 * Right opens or enters a folder, Left closes it or goes to the parent, Home and End jump, Enter selects. Emits
 * `select` and `toggle`; an item with an `href` is a link instead.
 */
export class JlTree extends JlElement {
  static readonly selector = 'jl-tree';

  readonly events = this.useEvents<{ select: string; toggle: { id: string; open: boolean } }>();

  readonly items = this.useChange<TreeItem[]>([], () => this.renderItemsUnlessQuiet(), {
    attribute: 'items',
    parse: jsonOf<TreeItem[]>([]),
  });
  /** The ids of the open folders. */
  readonly expanded = this.useChange<string[]>(
    [],
    () => {
      this.renderExpanded();
      this.loadOpenFolders();
    },
    { attribute: 'expanded', parse: jsonOf<string[]>([]) }
  );
  /** The id of the selected item. */
  readonly value = this.useChange('', () => this.drawSelection(this._rows), { attribute: 'value' });
  /** The tree's name for screen readers. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.tree, 'aria-label', value), {
    attribute: 'label',
  });
  /** What an empty tree says, such as "No object yet"; none by default. */
  readonly emptyText = this.useChange('', () => this.drawLevelEnds(), { attribute: 'empty-text' });
  /** Said while a page loads; jlib's own text when empty. */
  readonly loadingText = this.useChange('', () => this.drawLevelEnds(), { attribute: 'loading-text' });
  /** The button that loads a level's next page, `{count}` being how many items are left; jlib's own when empty. */
  readonly moreText = this.useChange('', () => this.drawLevelEnds(), { attribute: 'more-text' });
  /** Said where a page could not be loaded; jlib's own text when empty. */
  readonly errorText = this.useChange('', () => this.drawLevelEnds(), { attribute: 'error-text' });
  /** The action that loads it again; jlib's own text when empty. */
  readonly retryLabel = this.useChange('', () => this.drawLevelEnds(), { attribute: 'retry-label' });

  // A function cannot be a useChange input: its set() would call it as an updater.
  private readonly _source: { loader: TreeLoader | null } = { loader: null };
  private readonly _rows: Rows = new Map();
  private readonly _focus = { id: '' };
  // Each reload has a number: pages answering an earlier one are dropped.
  private readonly _loading = { generation: 0, levels: new Map<string | null, TreeLevel>() };
  // Set while `items` takes a page whose rows are drawn on their own (setItemsQuietly).
  private readonly _drawing = { quiet: false };

  private readonly _refs = this.useRefs((ref) => ({ tree: ref('.tree') }));

  /** Loads the items a page at a time; setting it forgets `items` and loads the roots. */
  get loader(): TreeLoader | null {
    return this._source.loader;
  }

  set loader(loader: TreeLoader | null) {
    this._source.loader = loader;
    this.whenRendered(() => void this.reload());
  }

  /** Opens or closes a folder, as a press on its chevron would. */
  toggle(id: string, open: boolean): void {
    this.expanded.set(withExpanded(this.expanded.get(), id, open));
    this.events.emit('toggle', { id, open });
  }

  /** Forgets what the loader gave and loads the roots again. */
  async reload(): Promise<void> {
    if (this.loader === null) {
      return;
    }
    this._loading.generation += 1;
    this._loading.levels.clear();
    this.items.set([]);
    await this.loadLevel(null, 0);
  }

  /**
   * Shows an item given the ids from its root down to it: opens the folders on the way, loading their levels and
   * pages as needed, then selects it, without firing `select`. False when an id is not found where the path says.
   */
  async reveal(path: readonly string[]): Promise<boolean> {
    const target = path.at(-1);
    if (target === undefined) {
      return false;
    }
    for (const [index, id] of path.entries()) {
      const found = await this.findInLevel(index === 0 ? null : (path[index - 1] ?? null), id);
      if (!found) {
        return false;
      }
      if (index < path.length - 1) {
        await this.openFolder(id);
      }
    }
    this.value.set(target);
    this.moveFocus(target, false);
    this.scrollToRow(target);
    return true;
  }

  templateHtml(): Node {
    return <div class="tree" role="tree" attrs={{ part: 'base' }} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const tree = this._refs.tree;
    this.on(tree, 'click', (event) => this.press(event));
    this.on(tree, 'keydown', (event) => this.handleKey(event));
    this.on(tree, 'focusin', (event) => {
      const id = this.idOf(event.target);
      if (id !== null) {
        this.moveFocus(id, false);
      }
    });
  }

  private idOf(target: EventTarget | null): string | null {
    const item = target instanceof Element ? target.closest<HTMLElement>('[role="treeitem"]') : null;
    return item?.dataset.id ?? null;
  }

  /**
   * A press selects the item; on a folder it also opens or closes it, and the chevron only does that. A link's row
   * leaves a modified click (a new tab) to the browser.
   */
  private press(event: MouseEvent): void {
    const id = this.idOf(event.target);
    if (id !== null && isLevelEnd(id)) {
      this.loadNextPage(parentOfLevelEnd(id));
      return;
    }
    const item = id === null ? undefined : this.findItem(id);
    if (id === null || item === undefined) {
      return;
    }
    const onChevron = event.target instanceof Element && event.target.closest('.chevron') !== null;
    if (onChevron) {
      // The chevron opens a link's folder; the link is not followed.
      event.preventDefault();
    }
    if (item.href !== undefined && !onChevron && isModifiedClick(event)) {
      return;
    }
    if (isFolder(item)) {
      this.toggle(id, !this.expanded.get().includes(id));
    }
    if (!onChevron) {
      this.select(item);
    }
    this.moveFocus(id, true);
  }

  private handleKey(event: KeyboardEvent): void {
    const focused = this._focus.id;
    const keyboardItems = withExtraRows(this.items.get(), (parent) =>
      this.hasLevelEndRow(parent) ? levelEndId(parent) : null
    );
    const action = treeKeyAction(keyboardItems, new Set(this.expanded.get()), focused, event.key);
    if (action === null) {
      return;
    }
    event.preventDefault();
    const run: Record<TreeAction['kind'], () => void> = {
      focus: () => this.moveFocus(action.id, true),
      select: () => this.activate(action.id),
      toggle: () => this.toggle(action.id, action.kind === 'toggle' && action.open),
    };
    run[action.kind]();
  }

  /** Enter on an item: the row that ends a level loads its page, a link is followed, an item is selected. */
  private activate(id: string): void {
    if (isLevelEnd(id)) {
      this.loadNextPage(parentOfLevelEnd(id));
      return;
    }
    const item = this.findItem(id);
    if (item === undefined) {
      return;
    }
    this.select(item);
    const link = this._rows.get(id)?.querySelector<HTMLAnchorElement>(':scope > a.row');
    if (link) {
      location.assign(link.href);
    }
  }

  /** Marks the item; one that is not a link says so with `select`. */
  private select(item: TreeItem): void {
    this.value.set(item.id);
    if (item.href === undefined) {
      this.events.emit('select', item.id);
    }
  }

  private findItem(id: string): TreeItem | undefined {
    return allItems(this.items.get()).find((entry) => entry.item.id === id)?.item;
  }

  /** Gives an item the Tab stop, which one item holds, and the focus when asked. */
  private moveFocus(id: string, focus: boolean): void {
    const row = this._rows.get(id);
    if (row === undefined) {
      return;
    }
    this._rows.get(this._focus.id)?.setAttribute('tabindex', '-1');
    this._focus.id = id;
    row.setAttribute('tabindex', '0');
    if (focus) {
      row.focus();
    }
  }

  private hasFocusInside(): boolean {
    const active = this.shadowRoot?.activeElement;
    return active instanceof Element && this._refs.tree.contains(active);
  }

  private scrollToRow(id: string): void {
    const row = this._rows.get(id);
    // jsdom has no layout, nor scrollIntoView.
    if (row !== undefined && typeof row.scrollIntoView === 'function') {
      row.scrollIntoView({ block: 'nearest' });
    }
  }

  // Loading

  /** Loads a page of a level, once at a time: a second call while it loads waits for the same page. */
  private loadLevel(parent: string | null, offset: number): Promise<void> {
    const loader = this.loader;
    const level = this._loading.levels.get(parent);
    if (loader === null) {
      return Promise.resolve();
    }
    if (level !== undefined && level.pending !== null) {
      return level.pending;
    }
    const generation = this._loading.generation;
    const pending = Promise.resolve()
      .then(() => loader(parent, offset))
      .then(
        (page) => this.addPage(parent, page, generation),
        (error: unknown) => this.failLevel(parent, error, generation)
      );
    this._loading.levels.set(parent, { error: '', pending, total: level?.total ?? 0 });
    this.whenRendered(() => this.redrawLevelEnd(parent));
    return pending;
  }

  private loadNextPage(parent: string | null): void {
    void this.loadLevel(parent, childrenOf(this.items.get(), parent).length);
  }

  private addPage(parent: string | null, page: TreePage, generation: number): void {
    if (generation !== this._loading.generation) {
      return;
    }
    // Pressed with the keyboard, the button for the next page hands the focus to the first item it brought.
    const focusFirst = this._focus.id === levelEndId(parent) && this.hasFocusInside();
    const loaded = childrenOf(this.items.get(), parent).length + page.items.length;
    // A loader that answers an empty page has no more to give, whatever its total said.
    const total = page.items.length === 0 ? loaded : page.total;
    this._loading.levels.set(parent, { error: '', pending: null, total });
    this.drawPage(parent, withPage(this.items.get(), parent, page.items), page.items);
    this.loadOpenFolders();
    const first = page.items[0];
    // Given once: each focus lays the tree out. The row that held it may be gone with the level's last page.
    this.moveFocus(focusFirst && first !== undefined ? first.id : this.tabStop(), focusFirst);
  }

  /**
   * Shows the items with a page added: only the page's rows when its level is drawn, so a tree of thousands of rows
   * is not drawn and laid out again for each page; the whole tree otherwise.
   */
  private drawPage(parent: string | null, items: TreeItem[], page: readonly TreeItem[]): void {
    const container = this.levelContainer(parent);
    if (container === null) {
      this.items.set(items);
      return;
    }
    this.setItemsQuietly(items);
    this.appendToLevel(container, parent, page);
  }

  private failLevel(parent: string | null, error: unknown, generation: number): void {
    if (generation !== this._loading.generation) {
      return;
    }
    const total = this._loading.levels.get(parent)?.total ?? 0;
    this._loading.levels.set(parent, { error: messageOf(error) || this.errorLabel(), pending: null, total });
    this.whenRendered(() => this.redrawLevelEnd(parent));
  }

  /** The open folders whose children the loader has not given yet: their first page. */
  private loadOpenFolders(): void {
    for (const id of this.expanded.get()) {
      const item = this.findItem(id);
      if (item?.lazy === true && !this._loading.levels.has(id)) {
        void this.loadLevel(id, 0);
      }
    }
  }

  /** The item of an id in a level, loading the level's next pages until it shows or none is left. */
  private async findInLevel(parent: string | null, id: string): Promise<boolean> {
    const isThere = () => childrenOf(this.items.get(), parent).some((item) => item.id === id);
    await this._loading.levels.get(parent)?.pending;
    while (!isThere() && this.levelEnd(parent) === 'more') {
      await this.loadLevel(parent, childrenOf(this.items.get(), parent).length);
    }
    return isThere();
  }

  private async openFolder(id: string): Promise<void> {
    if (!this.expanded.get().includes(id)) {
      this.expanded.set(withExpanded(this.expanded.get(), id, true));
    }
    await this._loading.levels.get(id)?.pending;
  }

  private levelEnd(parent: string | null): TreeLevelEnd {
    const level = this._loading.levels.get(parent);
    if (level !== undefined && level.pending !== null) {
      return 'loading';
    }
    if (level !== undefined && level.error !== '') {
      return 'error';
    }
    if (level !== undefined && level.total > childrenOf(this.items.get(), parent).length) {
      return 'more';
    }
    const isEmptyTree = parent === null && this.items.get().length === 0 && this.emptyText.get() !== '';
    return isEmptyTree ? 'empty' : 'none';
  }

  private hasLevelEndRow(parent: string | null): boolean {
    const end = this.levelEnd(parent);
    return end !== 'none' && end !== 'empty';
  }

  // Drawing: a `render…` method draws every row, a `draw…` method only the rows it is given.

  protected drawTexts(): void {
    this.drawLevelEnds();
  }

  /**
   * The tree's own texts show only in the rows that end a level (a note, a spinner, "show more", an error): those
   * are drawn again, the items stay. Every input's callback runs as the tree appears: each one building every row,
   * a tree built its rows seven times.
   */
  private drawLevelEnds(): void {
    // An empty tree is its note, and nothing else to build.
    if (this.items.get().length === 0) {
      this.renderItems();
      return;
    }
    const drawnLevels = [...this._loading.levels.keys()].filter((parent) => this.levelContainer(parent) !== null);
    for (const parent of drawnLevels) {
      this.redrawLevelEnd(parent);
    }
  }

  private errorLabel(): string {
    return this.errorText.get() || jlText('loadError');
  }

  private renderItemsUnlessQuiet(): void {
    if (this._drawing.quiet) {
      return;
    }
    this.renderItems();
  }

  /** Sets `items` without drawing every row again, which its callback does on each set(), even of an equal value. */
  private setItemsQuietly(items: TreeItem[]): void {
    this._drawing.quiet = true;
    try {
      this.items.set(items);
    } finally {
      this._drawing.quiet = false;
    }
  }

  private renderItems(): void {
    const hadFocus = this.hasFocusInside();
    this._rows.clear();
    this._refs.tree.replaceChildren(
      ...this.items.get().map((item) => this.itemNode(item)),
      ...this.levelEndNodes(null)
    );
    this.renderExpanded();
    this.drawSelection(this._rows);
    this.moveFocus(this.tabStop(), hadFocus);
  }

  /** Where the Tab stop goes once rows are drawn: where it was, else the selected item, else the first. */
  private tabStop(): string {
    if (this._rows.has(this._focus.id)) {
      return this._focus.id;
    }
    const first = this._rows.keys().next().value ?? '';
    return this._rows.has(this.value.get()) ? this.value.get() : first;
  }

  /** Draws again the row that ends a level (its spinner, its error), and only it; the whole tree when it is not drawn. */
  private redrawLevelEnd(parent: string | null): void {
    const container = this.levelContainer(parent);
    if (container === null) {
      this.renderItems();
      return;
    }
    const hadFocus = this.hasFocusInside();
    this.appendToLevel(container, parent, []);
    // The row that held the focus was replaced: the one replacing it takes it.
    this.moveFocus(this.tabStop(), hadFocus && !this.hasFocusInside());
  }

  /** Draws items at the end of a drawn level, then the row that ends it again; the tree's other rows stay as they are. */
  private appendToLevel(container: HTMLElement, parent: string | null, items: readonly TreeItem[]): void {
    const endId = levelEndId(parent);
    this._rows.get(endId)?.remove();
    this._rows.delete(endId);
    const nodes = [...items.map((item) => this.itemNode(item)), ...this.levelEndNodes(parent)];
    container.append(...nodes);
    const drawn = rowsIn(nodes);
    this.drawExpanded(drawn);
    this.drawSelection(drawn);
  }

  /** The element holding a level's rows; null when they are not drawn, and for an empty tree, whose note only `renderItems` draws. */
  private levelContainer(parent: string | null): HTMLElement | null {
    if (parent === null) {
      return this.items.get().length > 0 ? this._refs.tree : null;
    }
    return this._rows.get(parent)?.querySelector<HTMLElement>(':scope > .group') ?? null;
  }

  /** An item's row, and its children's under a folder: the CSS indents each by its depth. */
  private itemNode(item: TreeItem): HTMLElement {
    const folder = isFolder(item);
    const labelId = uniqueId('tree-label');
    // A folder's own icon stays; the default one opens and closes with it.
    const iconClass = item.icon === undefined && folder ? 'icon auto' : 'icon';
    const content = [
      <span class="chevron" aria-hidden="true">
        {folder ? <JlIcon name="chevron-right" size={CHEVRON_SIZE} /> : null}
      </span>,
      <JlIcon class={iconClass} size={ICON_SIZE} name={item.icon ?? (folder ? FOLDER_ICON : FILE_ICON)} />,
      <span class="label" id={labelId}>
        {item.label}
      </span>,
      item.badge === undefined ? null : <span class="badge">{String(item.badge)}</span>,
    ];
    // A link's row is the link, out of the Tab order: the item holds the focus, and Enter follows it.
    const row =
      item.href === undefined ? (
        <div class="row" title={item.hint}>
          {content}
        </div>
      ) : (
        <a class="row" href={item.href} title={item.hint} tabIndex={-1}>
          {content}
        </a>
      );
    const node = (
      <div
        class="item"
        role="treeitem"
        data-id={item.id}
        tabIndex={-1}
        aria-selected="false"
        aria-labelledby={labelId}>
        {row}
      </div>
    );
    this._rows.set(item.id, node);
    if (folder) {
      // biome-ignore lint/a11y/useSemanticElements: the children of a tree item are an ARIA group, with no HTML element
      const group = <div class="group" role="group" />;
      group.replaceChildren(
        ...(item.children ?? []).map((child) => this.itemNode(child)),
        ...this.levelEndNodes(item.id)
      );
      node.append(group);
    }
    return node;
  }

  /** The row that ends a level, if it has one. */
  private levelEndNodes(parent: string | null): Node[] {
    const nodes: Record<TreeLevelEnd, () => Node[]> = {
      empty: () => [this.noteNode(this.emptyText.get())],
      error: () => [this.errorNode(parent)],
      loading: () => [this.loadingNode(parent)],
      more: () => [this.moreNode(parent)],
      none: () => [],
    };
    return nodes[this.levelEnd(parent)]();
  }

  private levelEndRow(parent: string | null, content: Node[], disabled: boolean): HTMLElement {
    const id = levelEndId(parent);
    const node = (
      <div
        class="item level-end"
        role="treeitem"
        data-id={id}
        tabIndex={-1}
        aria-disabled={disabled ? 'true' : undefined}>
        <div class="row">
          <span class="chevron" aria-hidden="true" />
          {content}
        </div>
      </div>
    );
    this._rows.set(id, node);
    return node;
  }

  private loadingNode(parent: string | null): HTMLElement {
    const text = this.loadingText.get() || jlText('loadingMore');
    return this.levelEndRow(
      parent,
      [
        <JlSpinner class="spinner" size={ICON_SIZE} label={text} />,
        <span class="label" aria-hidden="true">
          {text}
        </span>,
      ],
      true
    );
  }

  private moreNode(parent: string | null): HTMLElement {
    const left = (this._loading.levels.get(parent)?.total ?? 0) - childrenOf(this.items.get(), parent).length;
    const template = this.moreText.get() || jlTemplate('showMoreCount');
    const text = template.replace(COUNT_PLACEHOLDER, left.toLocaleString(pageLocale()));
    return this.levelEndRow(parent, [<span class="label more">{text}</span>], false);
  }

  private errorNode(parent: string | null): HTMLElement {
    const node = this.levelEndRow(
      parent,
      [
        <JlIcon class="icon error" size={ICON_SIZE} name={ERROR_ICON} />,
        <span class="label">{this.errorLabel()}</span>,
        <span class="retry">{this.retryLabel.get() || jlText('retry')}</span>,
      ],
      false
    );
    // What went wrong, for whoever needs to know more.
    setOrRemove(node, 'title', this._loading.levels.get(parent)?.error ?? '');
    return node;
  }

  private noteNode(text: string): HTMLElement {
    return (
      <div class="note">
        <span class="chevron" aria-hidden="true" />
        <span class="label">{text}</span>
      </div>
    );
  }

  private renderExpanded(): void {
    this.drawExpanded(this._rows);
    if (!this.isVisible(this._focus.id)) {
      this.moveFocus(this.visibleAncestor(this._focus.id), false);
    }
  }

  /** Opens or closes the groups of these rows, as `expanded` says; a folder already in that state is left alone. */
  private drawExpanded(rows: Rows): void {
    const expanded = new Set(this.expanded.get());
    for (const [id, row] of rows) {
      const open = expanded.has(id);
      // Its icon's set() would draw the icon again even under the same name: a tree of many folders, each time one
      // of them opened or closed.
      if (row.getAttribute('aria-expanded') === String(open)) {
        continue;
      }
      const group = row.querySelector<HTMLElement>(':scope > .group');
      if (group === null) {
        continue;
      }
      // The CSS shows its group while it says it is open.
      row.setAttribute('aria-expanded', String(open));
      row.querySelector<JlIcon>(':scope > .row > .icon.auto')?.name.set(open ? OPEN_FOLDER_ICON : FOLDER_ICON);
    }
  }

  private isVisible(id: string): boolean {
    const row = this._rows.get(id);
    return row !== undefined && row.closest(CLOSED_GROUP) === null;
  }

  /** The item itself when it shows, else the nearest folder around it that does: the focus goes there. */
  private visibleAncestor(id: string): string {
    const row = this._rows.get(id);
    const hiddenGroup = row?.closest(CLOSED_GROUP);
    const owner = hiddenGroup?.closest<HTMLElement>('[role="treeitem"]');
    return owner?.dataset.id === undefined ? id : this.visibleAncestor(owner.dataset.id);
  }

  private drawSelection(rows: Rows): void {
    const value = this.value.get();
    for (const [id, row] of rows) {
      row.setAttribute('aria-selected', String(id === value));
    }
  }
}

JlTree.register();
