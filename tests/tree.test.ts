import { describe, expect, it } from 'vitest';

import { ancestorsOf, treeKeyAction, visibleItems, withExpanded } from '../src/lib/tree';

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
