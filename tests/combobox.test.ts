import { describe, expect, it } from 'vitest';

import { heldValues, keptLabels, sameValues, toggledValue } from '../src/lib/combobox';

describe('heldValues', () => {
  it('reads one value as a list of one, and no value as none', () => {
    expect(heldValues('fr')).toEqual(['fr']);
    expect(heldValues('')).toEqual([]);
  });

  it('copies a list of values', () => {
    const values = ['fr', 'de'];
    expect(heldValues(values)).toEqual(['fr', 'de']);
    expect(heldValues(values)).not.toBe(values);
  });
});

describe('toggledValue', () => {
  it('adds a value at the end', () => {
    expect(toggledValue([], 'fr')).toEqual(['fr']);
    expect(toggledValue(['fr'], 'de')).toEqual(['fr', 'de']);
  });

  it('takes out a value held, keeping the order of the others', () => {
    expect(toggledValue(['fr', 'de', 'it'], 'de')).toEqual(['fr', 'it']);
    expect(toggledValue(['fr'], 'fr')).toEqual([]);
  });
});

describe('sameValues', () => {
  it('compares the values and their order', () => {
    expect(sameValues([], [])).toBe(true);
    expect(sameValues(['fr', 'de'], ['fr', 'de'])).toBe(true);
    expect(sameValues(['fr', 'de'], ['de', 'fr'])).toBe(false);
    expect(sameValues(['fr'], ['fr', 'de'])).toBe(false);
  });
});

describe('keptLabels', () => {
  const kept = new Map([
    ['be', 'Bern'],
    ['zh', 'Zürich'],
  ]);

  it("takes each value's label from the options given", () => {
    expect(keptLabels(new Map(), ['ge'], [{ label: 'Genève', value: 'ge' }])).toEqual(new Map([['ge', 'Genève']]));
  });

  it('keeps the label of a value whose option is no longer given', () => {
    expect(keptLabels(kept, ['be'], [{ label: 'Genève', value: 'ge' }])).toEqual(new Map([['be', 'Bern']]));
  });

  it('prefers the label the options now give', () => {
    expect(keptLabels(kept, ['be'], [{ label: 'Berne', value: 'be' }])).toEqual(new Map([['be', 'Berne']]));
  });

  it('forgets the values no longer held, and knows none for a value never seen', () => {
    expect(keptLabels(kept, ['zh', 'lu'], [])).toEqual(new Map([['zh', 'Zürich']]));
    expect(keptLabels(kept, [], [])).toEqual(new Map());
  });
});
