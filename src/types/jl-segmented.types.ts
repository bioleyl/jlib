/** One choice of a segmented control; without a label it shows its icon, and its value names it. */
export type SegmentedOption = {
  value: string;
  label?: string;
  icon?: string;
  /** A count or a short word after the label: what waits behind the choice. */
  badge?: string | number;
  disabled?: boolean;
};
