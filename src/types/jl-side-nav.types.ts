/** One entry of a side navigation; with `children`, it opens and closes to show them. */
export type SideNavItem = {
  id: string;
  label: string;
  /** An icon name; the collapsed rail shows only the icons. */
  icon?: string;
  /** A link to follow; without it the item is a button that fires `select`. */
  href?: string;
  /** A count or a short word beside the label: `3`, `New`. */
  badge?: string | number;
  children?: SideNavItem[];
};

/** A group of items under an optional heading. */
export type SideNavSection = {
  label?: string;
  items: SideNavItem[];
};
