export type TreeItem = {
  id: string;
  label: string;
  /** An icon name; folders get a folder and the rest a file when absent. */
  icon?: string;
  /** Present, even empty, the item is a folder that opens. */
  children?: TreeItem[];
  /** A folder whose children the tree's `loader` brings, the first time it opens. */
  lazy?: boolean;
  /** An address: the row is a link, which a middle click opens in a new tab, and it fires no `select`. */
  href?: string;
  /** The row's tooltip, such as the whole name of an item whose label is short. */
  hint?: string;
  /** A count or a short word after the label: how many items a folder holds. */
  badge?: string | number;
};

/** One page of a level, as a loader answers it: some of its items, and how many the level has in all. */
export type TreePage = {
  items: TreeItem[];
  total: number;
};

/** Loads a page of a level, from `offset` on: the roots when `parent` is null. */
export type TreeLoader = (parent: string | null, offset: number) => Promise<TreePage>;

/** A level the tree loads: how many items it has in all, the page on its way, and the last load's error. */
export type TreeLevel = {
  total: number;
  pending: Promise<void> | null;
  error: string;
};

/**
 * The row that ends a level of the tree: its page on the way, the error of its last load, the button for its next
 * page, the text of an empty tree, or none.
 */
export type TreeLevelEnd = 'loading' | 'error' | 'more' | 'empty' | 'none';

/** An item as listed: its depth from 1 at the roots, and its parent's id. */
export type VisibleTreeItem = {
  item: TreeItem;
  level: number;
  parent: string | null;
};

/** What a key does in the tree: move the focus, open or close a folder, or select an item. */
export type TreeAction =
  | { kind: 'focus'; id: string }
  | { kind: 'toggle'; id: string; open: boolean }
  | { kind: 'select'; id: string };
