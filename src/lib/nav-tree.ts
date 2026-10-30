import type { SideNavItem, SideNavSection } from '../types/jl-side-nav.types';

const hasChildren = (item: SideNavItem): boolean => (item.children?.length ?? 0) > 0;

/** The ids from the top of the tree down to the item, the item included; empty when no item has that id. */
export function pathTo(items: readonly SideNavItem[], id: string): string[] {
  for (const item of items) {
    if (item.id === id) {
      return [item.id];
    }
    const below = pathTo(item.children ?? [], id);
    if (below.length > 0) {
      return [item.id, ...below];
    }
  }
  return [];
}

/** The path to an item, looked for in every section. */
export const pathInSections = (sections: readonly SideNavSection[], id: string): string[] =>
  pathTo(
    sections.flatMap((section) => section.items),
    id
  );

/** The item itself when it has no children, otherwise its first leaf: where a parent leads in the icon rail. */
export function firstLeaf<Id extends string>(item: SideNavItem<Id>): SideNavItem<Id> {
  const first = item.children?.[0];
  return hasChildren(item) && first !== undefined ? firstLeaf(first) : item;
}

/** Finds an item by id anywhere in the sections. */
export function findItem<Id extends string>(
  sections: readonly SideNavSection<Id>[],
  id: string
): SideNavItem<Id> | null {
  const search = (items: readonly SideNavItem<Id>[]): SideNavItem<Id> | null => {
    for (const item of items) {
      const found = item.id === id ? item : search(item.children ?? []);
      if (found !== null) {
        return found;
      }
    }
    return null;
  };
  return search(sections.flatMap((section) => section.items));
}
