/**
 * One entry of a side navigation; with `children`, it opens and closes to show them. Typed by its ids
 * (`SideNavItem<'jobs' | 'people'>`), `id` is one of them.
 */
export type SideNavItem<Id extends string = string> = {
  id: Id;
  label: string;
  /** An icon name; the collapsed rail shows only the icons. */
  icon?: string;
  /** A link to follow; without it the item is a button that fires `select`. */
  href?: string;
  /** Where the link opens: `_blank` for a new tab (the API's documentation beside the app). */
  target?: string;
  /** A count or a short word beside the label: `3`, `New`. */
  badge?: string | number;
  children?: SideNavItem<Id>[];
};

/** A group of items under an optional heading. */
export type SideNavSection<Id extends string = string> = {
  label?: string;
  items: SideNavItem<Id>[];
};
