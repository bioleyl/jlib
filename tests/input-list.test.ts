import { describe, expect, it } from 'vitest';

import { canAddRow, filledValues, rowsOf, sameValues, withoutRowAt, withRowAt } from '../src/lib/input-list';

describe('the rows of a field with several values', () => {
  it('show the values, or one empty row to type the first one in', () => {
    expect(rowsOf(['a', 'b'])).toEqual(['a', 'b']);
    expect(rowsOf([])).toEqual(['']);
  });

  it('change and lose rows one at a time, keeping one row to type in', () => {
    expect(withRowAt(['a', 'b'], 1, 'c')).toEqual(['a', 'c']);
    expect(withoutRowAt(['a', 'b'], 0)).toEqual(['b']);
    expect(withoutRowAt(['a'], 0)).toEqual(['']);
  });

  it('keep the rows filled in as the values', () => {
    expect(filledValues(['a', '', '  ', 'b'])).toEqual(['a', 'b']);
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
