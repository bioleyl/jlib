/**
 * One choice of a select: `group` gathers it with the others of the same group under that heading. Typed by its
 * values (`SelectOption<'eur' | 'chf'>`), `value` is one of them.
 */
export type SelectOption<Value extends string = string> = {
  value: Value;
  label: string;
  disabled?: boolean;
  group?: string;
};

/** A run of options under one heading, or outside any group when `label` is null. */
export type SelectOptionGroup = {
  label: string | null;
  options: SelectOption[];
};
