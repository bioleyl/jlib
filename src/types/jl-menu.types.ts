/** A choice of a menu: `select` fires with its value. */
export type MenuAction = {
  value: string;
  label: string;
  icon?: string;
  /** The keys that do the same, shown at the end: "⌘D". */
  shortcut?: string;
  /** A second, quieter line under the label. */
  description?: string;
  /** Destroys or removes something: drawn in the danger colour. */
  danger?: boolean;
  disabled?: boolean;
};

/** A line between groups of choices. */
export type MenuDivider = { divider: true };

/** A title over the choices that follow it, up to the next title. */
export type MenuHeading = { heading: string };

export type MenuItem = MenuAction | MenuDivider | MenuHeading;
