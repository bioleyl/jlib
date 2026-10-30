/** One choice of a chip group. Typed by its values (`ChipGroupOption<'open' | 'done'>`), `value` is one of them. */
export type ChipGroupOption<Value extends string = string> = {
  value: Value;
  label: string;
  /** An icon name before the label; a chosen chip without one shows a check. */
  icon?: string;
  /** A count or a short word after the label: how many things the choice holds. */
  badge?: string | number;
  disabled?: boolean;
};
