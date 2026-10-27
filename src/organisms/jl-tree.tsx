import { css } from '@jadis/core';
import { ChevronRight, CircleAlert, File, Folder, FolderOpen } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlSpinner } from '../atoms/jl-spinner';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { isModifiedClick, setOrRemove, uniqueId } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { pageLocale } from '../lib/locale';
import { jlText } from '../lib/texts';
import { allItems, childrenOf, isFolder, treeKeyAction, withExpanded, withExtraRows, withPage } from '../lib/tree';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-tree.css?raw';

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

type Rows = Map<string, HTMLElement>;

const levelEndId = (parent: string | null): string => `${LEVEL_END_PREFIX}${parent ?? ''}`;
const isLevelEnd = (id: string): boolean => id.startsWith(LEVEL_END_PREFIX);
const parentOfLevelEnd = (id: string): string | null => id.slice(LEVEL_END_PREFIX.length) || null;
const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

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

  readonly items = this.useChange<TreeItem[]>([], () => this.renderItems(), {
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
  readonly value = this.useChange('', () => this.renderSelection(), { attribute: 'value' });
  /** The tree's name for screen readers. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.tree, 'aria-label', value), {
    attribute: 'label',
  });
  /** What an empty tree says, such as "No object yet"; none by default. */
  readonly emptyText = this.useChange('', () => this.renderItems(), { attribute: 'empty-text' });
  /** Said while a page loads. */
  readonly loadingText = this.useChange(jlText('loadingMore'), () => this.renderItems(), {
    attribute: 'loading-text',
  });
  /** The button that loads a level's next page; `{count}` is how many items are left. */
  readonly moreText = this.useChange(jlText('showMoreCount'), () => this.renderItems(), {
    attribute: 'more-text',
  });
  /** Said where a page could not be loaded. */
  readonly errorText = this.useChange(jlText('loadError'), () => this.renderItems(), { attribute: 'error-text' });
  /** The action that loads it again. */
  readonly retryLabel = this.useChange(jlText('retry'), () => this.renderItems(), {
    attribute: 'retry-label',
  });

  // A function cannot be a useChange input: its set() would call it as an updater.
  private readonly _source: { loader: TreeLoader | null } = { loader: null };
  private readonly _rows: Rows = new Map();
  private readonly _focus = { id: '' };
  // Each reload has a number: pages answering an earlier one are dropped.
  private readonly _loading = { generation: 0, levels: new Map<string | null, TreeLevel>() };

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

  /** One item takes the Tab stop: the focused one, else the selected one, else the first. */
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
    this.whenRendered(() => this.renderItems());
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
    this.items.set(withPage(this.items.get(), parent, page.items));
    this.loadOpenFolders();
    const first = page.items[0];
    if (focusFirst && first !== undefined) {
      this.moveFocus(first.id, true);
    }
  }

  private failLevel(parent: string | null, error: unknown, generation: number): void {
    if (generation !== this._loading.generation) {
      return;
    }
    const total = this._loading.levels.get(parent)?.total ?? 0;
    this._loading.levels.set(parent, { error: messageOf(error) || this.errorText.get(), pending: null, total });
    this.whenRendered(() => this.renderItems());
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

  // Drawing

  private renderItems(): void {
    const hadFocus = this.hasFocusInside();
    this._rows.clear();
    this._refs.tree.replaceChildren(
      ...this.items.get().map((item) => this.itemNode(item, 1)),
      ...this.levelEndNodes(null, 1)
    );
    this.renderExpanded();
    this.renderSelection();
    const first = this._rows.keys().next().value ?? '';
    const start = this._rows.has(this.value.get()) ? this.value.get() : first;
    this.moveFocus(this._rows.has(this._focus.id) ? this._focus.id : start, hadFocus);
  }

  private itemNode(item: TreeItem, level: number): HTMLElement {
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
    node.style.setProperty('--level', String(level - 1));
    this._rows.set(item.id, node);
    if (folder) {
      // biome-ignore lint/a11y/useSemanticElements: the children of a tree item are an ARIA group, with no HTML element
      const group = <div class="group" role="group" />;
      group.style.setProperty('--level', String(level - 1));
      group.replaceChildren(
        ...(item.children ?? []).map((child) => this.itemNode(child, level + 1)),
        ...this.levelEndNodes(item.id, level + 1)
      );
      node.append(group);
    }
    return node;
  }

  /** The row that ends a level, if it has one. */
  private levelEndNodes(parent: string | null, level: number): Node[] {
    const nodes: Record<TreeLevelEnd, () => Node[]> = {
      empty: () => [this.noteNode(this.emptyText.get(), level)],
      error: () => [this.errorNode(parent, level)],
      loading: () => [this.loadingNode(parent, level)],
      more: () => [this.moreNode(parent, level)],
      none: () => [],
    };
    return nodes[this.levelEnd(parent)]();
  }

  private levelEndRow(parent: string | null, level: number, content: Node[], disabled: boolean): HTMLElement {
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
    node.style.setProperty('--level', String(level - 1));
    this._rows.set(id, node);
    return node;
  }

  private loadingNode(parent: string | null, level: number): HTMLElement {
    const text = this.loadingText.get();
    return this.levelEndRow(
      parent,
      level,
      [
        <JlSpinner class="spinner" size={ICON_SIZE} label={text} />,
        <span class="label" aria-hidden="true">
          {text}
        </span>,
      ],
      true
    );
  }

  private moreNode(parent: string | null, level: number): HTMLElement {
    const left = (this._loading.levels.get(parent)?.total ?? 0) - childrenOf(this.items.get(), parent).length;
    const text = this.moreText.get().replace(COUNT_PLACEHOLDER, left.toLocaleString(pageLocale()));
    return this.levelEndRow(parent, level, [<span class="label more">{text}</span>], false);
  }

  private errorNode(parent: string | null, level: number): HTMLElement {
    const node = this.levelEndRow(
      parent,
      level,
      [
        <JlIcon class="icon error" size={ICON_SIZE} name={ERROR_ICON} />,
        <span class="label">{this.errorText.get()}</span>,
        <span class="retry">{this.retryLabel.get()}</span>,
      ],
      false
    );
    // What went wrong, for whoever needs to know more.
    setOrRemove(node, 'title', this._loading.levels.get(parent)?.error ?? '');
    return node;
  }

  private noteNode(text: string, level: number): HTMLElement {
    const node = (
      <div class="note">
        <span class="chevron" aria-hidden="true" />
        <span class="label">{text}</span>
      </div>
    );
    node.style.setProperty('--level', String(level - 1));
    return node;
  }

  private renderExpanded(): void {
    const expanded = new Set(this.expanded.get());
    for (const [id, row] of this._rows) {
      const group = row.querySelector<HTMLElement>(':scope > .group');
      if (group === null) {
        continue;
      }
      const open = expanded.has(id);
      row.setAttribute('aria-expanded', String(open));
      group.hidden = !open;
      row.querySelector<JlIcon>(':scope > .row > .icon.auto')?.name.set(open ? OPEN_FOLDER_ICON : FOLDER_ICON);
    }
    if (!this.isVisible(this._focus.id)) {
      this.moveFocus(this.visibleAncestor(this._focus.id), false);
    }
  }

  private isVisible(id: string): boolean {
    const row = this._rows.get(id);
    return row !== undefined && row.closest('.group[hidden]') === null;
  }

  /** The item itself when it shows, else the nearest folder around it that does: the focus goes there. */
  private visibleAncestor(id: string): string {
    const row = this._rows.get(id);
    const hiddenGroup = row?.closest('.group[hidden]');
    const owner = hiddenGroup?.closest<HTMLElement>('[role="treeitem"]');
    return owner?.dataset.id === undefined ? id : this.visibleAncestor(owner.dataset.id);
  }

  private renderSelection(): void {
    const value = this.value.get();
    for (const [id, row] of this._rows) {
      row.setAttribute('aria-selected', String(id === value));
    }
  }
}

JlTree.register();
