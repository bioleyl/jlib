import { describe, expect, it } from 'vitest';

import { groupOptions } from '../src/lib/option-groups';

describe('groupOptions', () => {
  it('keeps a list without groups as one run', () => {
    const options = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ];
    expect(groupOptions(options)).toEqual([{ label: null, options }]);
  });

  it('gathers the options of a group where the group first appears', () => {
    const groups = groupOptions([
      { label: 'Any', value: 'any' },
      { group: 'Europe', label: 'Bern', value: 'bern' },
      { group: 'Asia', label: 'Tokyo', value: 'tokyo' },
      { group: 'Europe', label: 'Paris', value: 'paris' },
      { label: 'Other', value: 'other' },
    ]);
    expect(groups.map((group) => [group.label, group.options.map((option) => option.value)])).toEqual([
      [null, ['any']],
      ['Europe', ['bern', 'paris']],
      ['Asia', ['tokyo']],
      [null, ['other']],
    ]);
  });

  it('gives no groups for no options', () => {
    expect(groupOptions([])).toEqual([]);
  });
});
