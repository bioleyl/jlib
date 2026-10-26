import type { TreeAction, TreeItem, VisibleTreeItem } from '../types/jl-tree.types';

/** An item with `children`, even empty, is a folder. */
export const isFolder = (item: TreeItem): boolean => Array.isArray(item.children);

/** The items a person sees, in order: the roots, and the children of every open folder, with their depth. */
export function visibleItems(
  items: readonly TreeItem[],
  expanded: ReadonlySet<string>,
  level = 1,
  parent: string | null = null
): VisibleTreeItem[] {
  return items.flatMap((item) => {
    const own: VisibleTreeItem = { item, level, parent };
    if (!(isFolder(item) && expanded.has(item.id))) {
      return [own];
    }
    return [own, ...visibleItems(item.children ?? [], expanded, level + 1, item.id)];
  });
}

/** Every item of the tree with its parent, open or not. */
export function allItems(items: readonly TreeItem[], level = 1, parent: string | null = null): VisibleTreeItem[] {
  return items.flatMap((item) => [{ item, level, parent }, ...allItems(item.children ?? [], level + 1, item.id)]);
}

/** The ids of the folders around an item, from the root down: open them to show it. */
export function ancestorsOf(items: readonly TreeItem[], id: string): string[] {
  const byId = new Map(allItems(items).map((entry) => [entry.item.id, entry]));
  const ancestors: string[] = [];
  const cursor = { parent: byId.get(id)?.parent ?? null };
  while (cursor.parent !== null && !ancestors.includes(cursor.parent)) {
    ancestors.unshift(cursor.parent);
    cursor.parent = byId.get(cursor.parent)?.parent ?? null;
  }
  return ancestors;
}

/** The open folders after one is opened or closed. */
export function withExpanded(expanded: readonly string[], id: string, open: boolean): string[] {
  const others = expanded.filter((candidate) => candidate !== id);
  return open ? [...others, id] : others;
}

type KeyHandler = (visible: VisibleTreeItem[], index: number, expanded: ReadonlySet<string>) => TreeAction | null;

const focusAt = (visible: VisibleTreeItem[], index: number): TreeAction | null => {
  const target = visible[index];
  return target === undefined ? null : { id: target.item.id, kind: 'focus' };
};

/** Right: opens a closed folder, enters an open one; nothing on a file. */
function moveRight(visible: VisibleTreeItem[], index: number, expanded: ReadonlySet<string>): TreeAction | null {
  const current = visible[index];
  if (current === undefined || !isFolder(current.item)) {
    return null;
  }
  if (!expanded.has(current.item.id)) {
    return { id: current.item.id, kind: 'toggle', open: true };
  }
  const child = visible[index + 1];
  return child?.parent === current.item.id ? focusAt(visible, index + 1) : null;
}

/** Left: closes an open folder, otherwise goes to the parent. */
function moveLeft(visible: VisibleTreeItem[], index: number, expanded: ReadonlySet<string>): TreeAction | null {
  const current = visible[index];
  if (current === undefined) {
    return null;
  }
  if (isFolder(current.item) && expanded.has(current.item.id)) {
    return { id: current.item.id, kind: 'toggle', open: false };
  }
  return current.parent === null ? null : { id: current.parent, kind: 'focus' };
}

const selectAt: KeyHandler = (visible, index) => {
  const current = visible[index];
  return current === undefined ? null : { id: current.item.id, kind: 'select' };
};

const KEY_HANDLERS: ReadonlyMap<string, KeyHandler> = new Map<string, KeyHandler>([
  [' ', selectAt],
  ['ArrowDown', (visible, index) => focusAt(visible, index + 1)],
  ['ArrowLeft', moveLeft],
  ['ArrowRight', moveRight],
  ['ArrowUp', (visible, index) => focusAt(visible, index - 1)],
  ['End', (visible) => focusAt(visible, visible.length - 1)],
  ['Enter', selectAt],
  ['Home', (visible) => focusAt(visible, 0)],
]);

/**
 * What a key does on the focused item, by the tree pattern: Up and Down move, Right opens or enters, Left closes
 * or goes to the parent, Home and End jump, Enter and Space select. `null` for a key the tree leaves alone.
 */
export function treeKeyAction(
  items: readonly TreeItem[],
  expanded: ReadonlySet<string>,
  focused: string,
  key: string
): TreeAction | null {
  const handler = KEY_HANDLERS.get(key);
  if (handler === undefined) {
    return null;
  }
  const visible = visibleItems(items, expanded);
  const index = visible.findIndex((entry) => entry.item.id === focused);
  return handler(visible, Math.max(0, index), expanded);
}
