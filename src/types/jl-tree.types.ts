export type TreeItem = {
  id: string;
  label: string;
  /** An icon name; folders get a folder and the rest a file when absent. */
  icon?: string;
  /** Present, even empty, the item is a folder that opens. */
  children?: TreeItem[];
};

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
