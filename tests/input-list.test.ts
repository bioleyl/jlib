import { describe, expect, it } from 'vitest';

import {
  canAddRow,
  filledOrigins,
  filledValues,
  rowsOf,
  sameValues,
  withoutRowAt,
  withRowAt,
} from '../src/lib/input-list';

describe('the rows of a field with several values', () => {
  it('show the values, or one empty row to type the first one in', () => {
    expect(rowsOf(['a', 'b'])).toEqual([
      { origin: 0, value: 'a' },
      { origin: 1, value: 'b' },
    ]);
    expect(rowsOf([])).toEqual([{ origin: undefined, value: '' }]);
  });

  it('change and lose rows one at a time, keeping one row to type in', () => {
    expect(withRowAt(rowsOf(['a', 'b']), 1, 'c')).toEqual([
      { origin: 0, value: 'a' },
      { origin: 1, value: 'c' },
    ]);
    expect(withoutRowAt(rowsOf(['a', 'b']), 0)).toEqual([{ origin: 1, value: 'b' }]);
    expect(withoutRowAt(rowsOf(['a']), 0)).toEqual([{ origin: undefined, value: '' }]);
  });

  it('keep the rows filled in as the values, with the index each came from', () => {
    const rows = rowsOf(['a', 'b', 'c']);
    // The second row removed, the third corrected to 'c 2'.
    const edited = withRowAt(withoutRowAt(rows, 1), 1, 'c 2');
    expect(filledValues(edited)).toEqual(['a', 'c 2']);
    expect(filledOrigins(edited)).toEqual([0, 2]);
    // The second row corrected, the third removed: the same values, other origins.
    const other = withoutRowAt(withRowAt(rows, 1, 'b 2'), 2);
    expect(filledValues(other)).toEqual(['a', 'b 2']);
    expect(filledOrigins(other)).toEqual([0, 1]);
    expect(filledValues(rowsOf(['a', '', '  ', 'b']))).toEqual(['a', 'b']);
    expect(filledOrigins(rowsOf(['a', '', '  ', 'b']))).toEqual([0, 3]);
  });

  it('take another row under the limit, or always without one', () => {
    expect(canAddRow(2, 3)).toBe(true);
    expect(canAddRow(3, 3)).toBe(false);
    expect(canAddRow(10, 0)).toBe(true);
  });

  it('compare lists by their values and order', () => {
    expect(sameValues(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(sameValues(['a', 'b'], ['b', 'a'])).toBe(false);
  });
});
