/** One choice of a segmented control; without a label it shows its icon, and its value names it. */
export type SegmentedOption = {
  value: string;
  label?: string;
  icon?: string;
  disabled?: boolean;
};
