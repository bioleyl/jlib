import { describe, expect, it } from 'vitest';

import { findItem, firstLeaf, pathInSections, pathTo } from '../src/lib/nav-tree';

import type { SideNavSection } from '../src/types/jl-side-nav.types';

const SECTIONS: SideNavSection[] = [
  { items: [{ id: 'home', label: 'Home' }] },
  {
    items: [
      {
        children: [
          { id: 'web', label: 'Web' },
          {
            children: [{ id: 'ios', label: 'iOS' }],
            id: 'mobile',
            label: 'Mobile',
          },
        ],
        id: 'projects',
        label: 'Projects',
      },
    ],
    label: 'Work',
  },
];

describe('pathTo', () => {
  it('gives the ids from the top down to the item', () => {
    expect(pathInSections(SECTIONS, 'ios')).toEqual(['projects', 'mobile', 'ios']);
    expect(pathInSections(SECTIONS, 'home')).toEqual(['home']);
  });

  it('gives an empty path for an unknown id', () => {
    expect(pathInSections(SECTIONS, 'nope')).toEqual([]);
    expect(pathTo([], 'home')).toEqual([]);
  });
});

describe('firstLeaf', () => {
  it('goes down to the first item without children', () => {
    const projects = findItem(SECTIONS, 'projects');
    expect(projects === null ? null : firstLeaf(projects).id).toBe('web');
    const mobile = findItem(SECTIONS, 'mobile');
    expect(mobile === null ? null : firstLeaf(mobile).id).toBe('ios');
  });
});

describe('findItem', () => {
  it('finds an item at any depth', () => {
    expect(findItem(SECTIONS, 'ios')?.label).toBe('iOS');
    expect(findItem(SECTIONS, 'nope')).toBeNull();
  });
});
