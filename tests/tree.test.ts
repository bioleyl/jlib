import { describe, expect, it } from 'vitest';

import {
  ancestorsOf,
  childrenOf,
  isFolder,
  treeKeyAction,
  visibleItems,
  withExpanded,
  withExtraRows,
  withPage,
} from '../src/lib/tree';

import type { TreeItem } from '../src/types/jl-tree.types';

const TREE: TreeItem[] = [
  {
    children: [
      { children: [{ id: 'button', label: 'jl-button.tsx' }], id: 'atoms', label: 'atoms' },
      { id: 'index', label: 'index.ts' },
    ],
    id: 'src',
    label: 'src',
  },
  { children: [], id: 'empty', label: 'empty' },
  { id: 'readme', label: 'README.md' },
];

const visibleIds = (expanded: string[]): string[] =>
  visibleItems(TREE, new Set(expanded)).map((entry) => entry.item.id);

describe('visibleItems', () => {
  it('lists the roots and the children of open folders, with their depth and parent', () => {
    expect(visibleIds([])).toEqual(['src', 'empty', 'readme']);
    expect(visibleIds(['src'])).toEqual(['src', 'atoms', 'index', 'empty', 'readme']);
    // A child folder open inside a closed one stays hidden.
    expect(visibleIds(['atoms'])).toEqual(['src', 'empty', 'readme']);
    const nested = visibleItems(TREE, new Set(['src', 'atoms']));
    expect(nested.find((entry) => entry.item.id === 'button')).toMatchObject({ level: 3, parent: 'atoms' });
  });
});

describe('ancestorsOf', () => {
  it('gives the folders around an item, from the root', () => {
    expect(ancestorsOf(TREE, 'button')).toEqual(['src', 'atoms']);
    expect(ancestorsOf(TREE, 'readme')).toEqual([]);
    expect(ancestorsOf(TREE, 'missing')).toEqual([]);
  });
});

describe('withExpanded', () => {
  it('opens and closes a folder once', () => {
    expect(withExpanded(['a'], 'b', true)).toEqual(['a', 'b']);
    expect(withExpanded(['a', 'b'], 'a', false)).toEqual(['b']);
    expect(withExpanded(['a'], 'a', true)).toEqual(['a']);
  });
});

describe('treeKeyAction', () => {
  const open = new Set(['src']);

  it('moves up and down the visible items, and stops at the ends', () => {
    expect(treeKeyAction(TREE, open, 'src', 'ArrowDown')).toEqual({ id: 'atoms', kind: 'focus' });
    expect(treeKeyAction(TREE, open, 'empty', 'ArrowUp')).toEqual({ id: 'index', kind: 'focus' });
    expect(treeKeyAction(TREE, open, 'readme', 'ArrowDown')).toBeNull();
    expect(treeKeyAction(TREE, open, 'src', 'ArrowUp')).toBeNull();
  });

  it('opens a closed folder with Right, then enters it', () => {
    expect(treeKeyAction(TREE, open, 'atoms', 'ArrowRight')).toEqual({ id: 'atoms', kind: 'toggle', open: true });
    expect(treeKeyAction(TREE, open, 'src', 'ArrowRight')).toEqual({ id: 'atoms', kind: 'focus' });
    expect(treeKeyAction(TREE, new Set(['empty']), 'empty', 'ArrowRight')).toBeNull();
    expect(treeKeyAction(TREE, open, 'readme', 'ArrowRight')).toBeNull();
  });

  it('closes an open folder with Left, otherwise goes to the parent', () => {
    expect(treeKeyAction(TREE, open, 'src', 'ArrowLeft')).toEqual({ id: 'src', kind: 'toggle', open: false });
    expect(treeKeyAction(TREE, open, 'index', 'ArrowLeft')).toEqual({ id: 'src', kind: 'focus' });
    expect(treeKeyAction(TREE, open, 'readme', 'ArrowLeft')).toBeNull();
  });

  it('jumps with Home and End, selects with Enter and Space, ignores other keys', () => {
    expect(treeKeyAction(TREE, open, 'index', 'Home')).toEqual({ id: 'src', kind: 'focus' });
    expect(treeKeyAction(TREE, open, 'src', 'End')).toEqual({ id: 'readme', kind: 'focus' });
    expect(treeKeyAction(TREE, open, 'index', 'Enter')).toEqual({ id: 'index', kind: 'select' });
    expect(treeKeyAction(TREE, open, 'index', ' ')).toEqual({ id: 'index', kind: 'select' });
    expect(treeKeyAction(TREE, open, 'index', 'a')).toBeNull();
  });
});

describe('isFolder', () => {
  it('takes an item with children, even none, and a lazy one whose children are not loaded', () => {
    expect(isFolder({ children: [], id: 'a', label: 'a' })).toBe(true);
    expect(isFolder({ id: 'b', label: 'b', lazy: true })).toBe(true);
    expect(isFolder({ id: 'c', label: 'c' })).toBe(false);
  });
});

describe('childrenOf', () => {
  it('gives the roots for no parent, a folder its children, and nothing for a file or an unknown id', () => {
    expect(childrenOf(TREE, null).map((item) => item.id)).toEqual(['src', 'empty', 'readme']);
    expect(childrenOf(TREE, 'atoms').map((item) => item.id)).toEqual(['button']);
    expect(childrenOf(TREE, 'readme')).toEqual([]);
    expect(childrenOf(TREE, 'missing')).toEqual([]);
  });
});

describe('withPage', () => {
  it('adds a page at the end of the roots, or of a folder at any depth', () => {
    const page = [{ id: 'more', label: 'more.ts' }];
    expect(withPage(TREE, null, page).map((item) => item.id)).toEqual(['src', 'empty', 'readme', 'more']);
    expect(childrenOf(withPage(TREE, 'atoms', page), 'atoms').map((item) => item.id)).toEqual(['button', 'more']);
  });

  it('gives a lazy folder its first children, and leaves the tree it was given as it was', () => {
    const lazy = [{ id: 'object', label: 'object', lazy: true }];
    expect(withPage(lazy, 'object', [{ id: 'file', label: 'file' }])).toEqual([
      { children: [{ id: 'file', label: 'file' }], id: 'object', label: 'object', lazy: true },
    ]);
    expect(lazy).toEqual([{ id: 'object', label: 'object', lazy: true }]);
  });
});

describe('withExtraRows', () => {
  it('ends the levels that have one with their extra row, which the keyboard then reaches', () => {
    const extra = (parent: string | null) => (parent === null || parent === 'src' ? `end:${parent ?? ''}` : null);
    const items = withExtraRows(TREE, extra);
    expect(childrenOf(items, null).map((item) => item.id)).toEqual(['src', 'empty', 'readme', 'end:']);
    expect(childrenOf(items, 'src').map((item) => item.id)).toEqual(['atoms', 'index', 'end:src']);
    expect(treeKeyAction(items, new Set(), 'readme', 'ArrowDown')).toEqual({ id: 'end:', kind: 'focus' });
  });
});
