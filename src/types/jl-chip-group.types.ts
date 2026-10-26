/** One choice of a chip group. */
export type ChipGroupOption = {
  value: string;
  label: string;
  /** An icon name before the label; a chosen chip without one shows a check. */
  icon?: string;
  /** A count or a short word after the label: how many things the choice holds. */
  badge?: string | number;
  disabled?: boolean;
};
