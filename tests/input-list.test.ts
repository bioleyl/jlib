// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { JlSelect } from '../src/atoms/jl-select';
import {
  canAddRow,
  filledOrigins,
  filledValues,
  filledValuesOf,
  rowsOf,
  sameValues,
  withoutRowAt,
  withRowAt,
} from '../src/lib/input-list';
import { JlInputList } from '../src/molecules/jl-input-list';

import type { JlInput } from '../src/atoms/jl-input';

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

  it('keep the filled ones of a list given from outside', () => {
    expect(filledValuesOf(['a', '', '  ', 'b'])).toEqual(['a', 'b']);
    expect(filledValuesOf([])).toEqual([]);
  });
});

describe('a list of values', () => {
  // Connected first: a row's control hears its input from the moment the row lives.
  const list = (): JlInputList => {
    const element = new JlInputList();
    document.body.append(element);
    return element;
  };

  const rowTexts = (element: JlInputList): string[] =>
    Array.from(element.shadowRoot?.querySelectorAll('.rows .row') ?? []).map((row) => {
      const control = row.firstElementChild;
      return control instanceof JlSelect ? control.value.get() : (control as JlInput).value.get();
    });

  it('keeps the values filled in, the blank ones set from outside left out', () => {
    const element = list();
    element.values.set(['A', '', 'C']);
    expect(element.values.get()).toEqual(['A', 'C']);
    expect(element.origins()).toEqual([0, 2]);
    expect(rowTexts(element)).toEqual(['A', '', 'C']);
  });

  it('takes the origins of the values set from outside, also when the rows already hold them', () => {
    const element = list();
    element.values.set(['A', 'B', 'C']);
    // The row of B removed: the values saved are ['A', 'C'], with origins [0, 2].
    element.values.set(['A', 'C']);
    expect(element.values.get()).toEqual(['A', 'C']);
    expect(element.origins()).toEqual([0, 1]);
    expect(rowTexts(element)).toEqual(['A', 'C']);
  });

  it('keeps its rows as it publishes them, and their origins as the page sets them', () => {
    const element = list();
    element.values.set(['A', 'B', 'C']);
    const rows = element.shadowRoot!.querySelector('.rows')!;
    const control = rows.firstElementChild!.firstElementChild as JlInput;
    // happy-dom does not bubble the native input's event to the host: the test sends it there, as a browser does.
    control.shadowRoot!.querySelector('input')!.value = 'A 2';
    control.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: 'A 2' }));
    expect(element.values.get()).toEqual(['A 2', 'B', 'C']);
    expect(element.origins()).toEqual([0, 1, 2]);
    expect(rows.childElementCount).toBe(3);
    expect(element.shadowRoot?.querySelector('.rows')).toBe(rows);
  });
});
