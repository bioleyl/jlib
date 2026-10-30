/**
 * One place in a bottom tab bar: an icon over a short label. Typed by its ids (`TabBarItem<'home' | 'jobs'>`), `id`
 * is one of them.
 */
export type TabBarItem<Id extends string = string> = {
  id: Id;
  label: string;
  /** An icon name: the tab bar draws one over every label. */
  icon: string;
  /** A link to follow; without it the item is a button that only fires `select`. */
  href?: string;
  /** A count or a short word over the icon: `3`, `New`. Counts above 99 show as `99+`. */
  badge?: string | number;
};
