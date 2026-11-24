import { describe, expect, it } from 'vitest';

import {
  edgeEnabledIndex,
  filterOptions,
  findMatches,
  foldText,
  matchParts,
  nextEnabledIndex,
} from '../src/lib/option-filter';

const options = (...labels: string[]) => labels.map((label) => ({ label, value: label.toLowerCase() }));
const labels = (list: { label: string }[]) => list.map((option) => option.label);

describe('foldText', () => {
  it('ignores case and accents', () => {
    expect(foldText('Crème Brûlée')).toBe('creme brulee');
    expect(foldText('ZÜRICH')).toBe('zurich');
  });
});

describe('findMatches', () => {
  it('finds the search in the text whatever the case and accents', () => {
    expect(findMatches('Genève', 'gene')).toEqual([{ end: 4, start: 0 }]);
    expect(findMatches('Genève', 'EVE')).toEqual([{ end: 6, start: 3 }]);
  });

  it('keeps an accent written as a separate mark with its letter', () => {
    const decomposed = 'Gene\u0300ve';
    expect(findMatches(decomposed, 'gene')).toEqual([{ end: 5, start: 0 }]);
  });

  it('finds each word of the search, wherever it is in the text', () => {
    expect(findMatches('Archives communales de Briningen', 'arch com')).toEqual([
      { end: 4, start: 0 },
      { end: 12, start: 9 },
    ]);
    expect(findMatches('Commune de Laudorf, archives', 'arch com')).toEqual([
      { end: 3, start: 0 },
      { end: 24, start: 20 },
    ]);
  });

  it('marks a word where one of the text’s words starts with it, rather than inside another', () => {
    expect(findMatches('Recommandé, commune', 'com')).toEqual([{ end: 15, start: 12 }]);
    expect(findMatches('Recommandé', 'com')).toEqual([{ end: 5, start: 2 }]);
  });

  it('makes one range of words that overlap or touch, and of a word typed twice', () => {
    expect(findMatches('Archives', 'arch archives')).toEqual([{ end: 8, start: 0 }]);
    expect(findMatches('Archives', 'arc hives')).toEqual([{ end: 8, start: 0 }]);
    expect(findMatches('Archives', 'arch arch')).toEqual([{ end: 4, start: 0 }]);
  });

  it('marks the words it holds and leaves out those it does not', () => {
    expect(findMatches('Archives communales', 'arch paroisse')).toEqual([{ end: 4, start: 0 }]);
  });

  it('gives nothing for an empty search or no match', () => {
    expect(findMatches('Lausanne', '')).toEqual([]);
    expect(findMatches('Lausanne', '   ')).toEqual([]);
    expect(findMatches('Lausanne', 'bern')).toEqual([]);
  });
});

describe('matchParts', () => {
  it('cuts the text around its match', () => {
    expect(matchParts('San Francisco', 'fran')).toEqual([
      { matched: false, text: 'San ' },
      { matched: true, text: 'Fran' },
      { matched: false, text: 'cisco' },
    ]);
  });

  it('cuts the text around each word of the search', () => {
    expect(matchParts('Archives communales de Briningen', ' arch  com ')).toEqual([
      { matched: true, text: 'Arch' },
      { matched: false, text: 'ives ' },
      { matched: true, text: 'com' },
      { matched: false, text: 'munales de Briningen' },
    ]);
  });

  it('leaves out empty pieces', () => {
    expect(matchParts('Basel', 'bas')).toEqual([
      { matched: true, text: 'Bas' },
      { matched: false, text: 'el' },
    ]);
    expect(matchParts('Basel', 'x')).toEqual([{ matched: false, text: 'Basel' }]);
    expect(matchParts('', 'x')).toEqual([]);
  });
});

describe('filterOptions', () => {
  const cities = options('Lausanne', 'New Zealand', 'Zug', 'Zürich', 'Bazel', 'Ascona');

  it('keeps every option for an empty search', () => {
    expect(labels(filterOptions(cities, ''))).toEqual(labels(cities));
  });

  it('lists the labels that start with the search, then word starts, then the rest', () => {
    expect(labels(filterOptions(cities, 'z'))).toEqual(['Zug', 'Zürich', 'New Zealand', 'Bazel']);
  });

  it('ignores accents in the labels and in the search', () => {
    expect(labels(filterOptions(cities, 'zur'))).toEqual(['Zürich']);
    expect(labels(filterOptions(cities, 'ZÜR'))).toEqual(['Zürich']);
  });

  it('gives nothing when no label contains the search', () => {
    expect(filterOptions(cities, 'paris')).toEqual([]);
  });
});

describe('nextEnabledIndex', () => {
  const list = [{}, { disabled: true }, {}, {}];

  it('steps over options that cannot be chosen', () => {
    expect(nextEnabledIndex(list, 0, 1)).toBe(2);
    expect(nextEnabledIndex(list, 2, -1)).toBe(0);
  });

  it('wraps around the ends', () => {
    expect(nextEnabledIndex(list, 3, 1)).toBe(0);
    expect(nextEnabledIndex(list, 0, -1)).toBe(3);
  });

  it('starts at the first or the last option when none is active', () => {
    expect(nextEnabledIndex(list, -1, 1)).toBe(0);
    expect(nextEnabledIndex(list, -1, -1)).toBe(3);
    expect(edgeEnabledIndex([{ disabled: true }, {}], 1)).toBe(1);
  });

  it('gives -1 when no option can be chosen', () => {
    expect(nextEnabledIndex([{ disabled: true }], -1, 1)).toBe(-1);
    expect(nextEnabledIndex([], -1, 1)).toBe(-1);
  });
});
