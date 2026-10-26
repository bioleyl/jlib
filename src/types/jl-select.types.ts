/** One choice of a select: `group` gathers it with the others of the same group under that heading. */
export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
};

/** A run of options under one heading, or outside any group when `label` is null. */
export type SelectOptionGroup = {
  label: string | null;
  options: SelectOption[];
};
