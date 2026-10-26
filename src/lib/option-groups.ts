import type { SelectOption, SelectOptionGroup } from '../types/jl-select.types';

/**
 * Options laid out as a select draws them: the options of a group gather under it, where the group first appears;
 * options without a group stay in place, between the groups.
 */
export function groupOptions(options: readonly SelectOption[]): SelectOptionGroup[] {
  const groups: SelectOptionGroup[] = [];
  for (const option of options) {
    const label = option.group ?? null;
    const target = label === null ? lastIfUngrouped(groups) : groups.find((group) => group.label === label);
    if (target === undefined) {
      groups.push({ label, options: [option] });
      continue;
    }
    target.options.push(option);
  }
  return groups;
}

const lastIfUngrouped = (groups: SelectOptionGroup[]): SelectOptionGroup | undefined => {
  const last = groups.at(-1);
  return last?.label === null ? last : undefined;
};
