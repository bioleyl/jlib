/**
 * One choice of a segmented control; without a label it shows its icon, and its value names it. Typed by its values
 * (`SegmentedOption<'list' | 'grid'>`), `value` is one of them.
 */
export type SegmentedOption<Value extends string = string> = {
  value: Value;
  label?: string;
  icon?: string;
  /** A count or a short word after the label: what waits behind the choice. */
  badge?: string | number;
  disabled?: boolean;
};
