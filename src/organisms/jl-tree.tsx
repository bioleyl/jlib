import { css } from '@jadis/core';
import { ChevronRight, File, Folder, FolderOpen } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { setOrRemove, uniqueId } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { allItems, isFolder, treeKeyAction, withExpanded } from '../lib/tree';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-tree.css?raw';

import type { TreeAction, TreeItem } from '../types/jl-tree.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'chevron-right': ChevronRight, file: File, folder: Folder, 'folder-open': FolderOpen });

const ICON_SIZE = 16;
const CHEVRON_SIZE = 14;
const FOLDER_ICON = 'folder';
const OPEN_FOLDER_ICON = 'folder-open';
const FILE_ICON = 'file';

type Rows = Map<string, HTMLElement>;

/**
 * Nested items that open and close, as files in folders: `items` holds them, `expanded` lists the open folders and
 * `value` is the selected item. The keyboard follows the tree pattern: Up and Down move, Right opens or enters a
 * folder, Left closes it or goes to the parent, Home and End jump, Enter selects. Emits `select` and `toggle`.
 */
export class JlTree extends JlElement {
  static readonly selector = 'jl-tree';

  readonly events = this.useEvents<{ select: string; toggle: { id: string; open: boolean } }>();

  readonly items = this.useChange<TreeItem[]>([], () => this.renderItems(), {
    attribute: 'items',
    parse: jsonOf<TreeItem[]>([]),
  });
  /** The ids of the open folders. */
  readonly expanded = this.useChange<string[]>([], () => this.renderExpanded(), {
    attribute: 'expanded',
    parse: jsonOf<string[]>([]),
  });
  /** The id of the selected item. */
  readonly value = this.useChange('', () => this.renderSelection(), { attribute: 'value' });
  /** The tree's name for screen readers. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.tree, 'aria-label', value), {
    attribute: 'label',
  });

  private readonly _rows: Rows = new Map();
  private readonly _focus = { id: '' };

  private readonly _refs = this.useRefs((ref) => ({ tree: ref('.tree') }));

  /** Opens or closes a folder, as a press on its chevron would. */
  toggle(id: string, open: boolean): void {
    this.expanded.set(withExpanded(this.expanded.get(), id, open));
    this.events.emit('toggle', { id, open });
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

  /** A press selects the item; on a folder it also opens or closes it, and the chevron only does that. */
  private press(event: MouseEvent): void {
    const id = this.idOf(event.target);
    const item = id === null ? undefined : this.findItem(id);
    if (id === null || item === undefined) {
      return;
    }
    const onChevron = event.target instanceof Element && event.target.closest('.chevron') !== null;
    if (isFolder(item)) {
      this.toggle(id, !this.expanded.get().includes(id));
    }
    if (!onChevron) {
      this.select(id);
    }
    this.moveFocus(id, true);
  }

  private handleKey(event: KeyboardEvent): void {
    const focused = this._focus.id;
    const action = treeKeyAction(this.items.get(), new Set(this.expanded.get()), focused, event.key);
    if (action === null) {
      return;
    }
    event.preventDefault();
    const run: Record<TreeAction['kind'], () => void> = {
      focus: () => this.moveFocus(action.id, true),
      select: () => this.select(action.id),
      toggle: () => this.toggle(action.id, action.kind === 'toggle' && action.open),
    };
    run[action.kind]();
  }

  private select(id: string): void {
    this.value.set(id);
    this.events.emit('select', id);
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

  private renderItems(): void {
    this._rows.clear();
    this._refs.tree.replaceChildren(...this.items.get().map((item) => this.itemNode(item, 1)));
    this.renderExpanded();
    this.renderSelection();
    const start = this._rows.has(this.value.get()) ? this.value.get() : (this.items.get()[0]?.id ?? '');
    this.moveFocus(this._rows.has(this._focus.id) ? this._focus.id : start, false);
  }

  private itemNode(item: TreeItem, level: number): HTMLElement {
    const folder = isFolder(item);
    const labelId = uniqueId('tree-label');
    // A folder's own icon stays; the default one opens and closes with it.
    const iconClass = item.icon === undefined && folder ? 'icon auto' : 'icon';
    const node = (
      <div
        class="item"
        role="treeitem"
        data-id={item.id}
        tabIndex={-1}
        aria-selected="false"
        aria-labelledby={labelId}>
        <div class="row">
          <span class="chevron" aria-hidden="true">
            {folder ? <JlIcon name="chevron-right" size={CHEVRON_SIZE} /> : null}
          </span>
          <JlIcon class={iconClass} size={ICON_SIZE} name={item.icon ?? (folder ? FOLDER_ICON : FILE_ICON)} />
          <span class="label" id={labelId}>
            {item.label}
          </span>
        </div>
      </div>
    );
    node.style.setProperty('--level', String(level - 1));
    this._rows.set(item.id, node);
    if (folder) {
      // biome-ignore lint/a11y/useSemanticElements: the children of a tree item are an ARIA group, with no HTML element
      const group = <div class="group" role="group" />;
      group.style.setProperty('--level', String(level - 1));
      group.replaceChildren(...(item.children ?? []).map((child) => this.itemNode(child, level + 1)));
      node.append(group);
    }
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
