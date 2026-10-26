import { describe, expect, it } from 'vitest';

import { initialsOf, pickStable, splitVisible, stableHash } from '../src/lib/avatar';

describe('initialsOf', () => {
  it('takes the first letters of the first and last names', () => {
    expect(initialsOf('Ada Lovelace')).toBe('AL');
    expect(initialsOf('Grace Brewster Murray Hopper')).toBe('GH');
  });

  it('takes one letter for a single word, and nothing for an empty name', () => {
    expect(initialsOf('grace')).toBe('G');
    expect(initialsOf('   ')).toBe('');
  });

  it('keeps hyphenated first names as one word and skips punctuation', () => {
    expect(initialsOf('Jean-Luc Picard')).toBe('JP');
    expect(initialsOf('(Ada) "Countess" Lovelace')).toBe('AL');
  });

  it('upper-cases letters beyond ASCII', () => {
    expect(initialsOf('élodie ørsted')).toBe('ÉØ');
  });
});

describe('stableHash and pickStable', () => {
  it('gives the same result for the same text', () => {
    expect(stableHash('Ada Lovelace')).toBe(stableHash('Ada Lovelace'));
    expect(pickStable('Ada Lovelace', ['a', 'b', 'c'])).toBe(pickStable('Ada Lovelace', ['a', 'b', 'c']));
  });

  it('spreads different names over the options', () => {
    const names = ['Ada', 'Grace', 'Alan', 'Linus', 'Margaret', 'Barbara', 'Ken', 'Dennis', 'Radia', 'Frances'];
    const picked = new Set(names.map((name) => pickStable(name, ['a', 'b', 'c', 'd', 'e'])));
    expect(picked.size).toBeGreaterThan(2);
  });

  it('always returns one of the options', () => {
    expect(['x']).toContain(pickStable('', ['x']));
  });
});

describe('splitVisible', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];

  it('shows the first max items and counts the others', () => {
    expect(splitVisible(items, 3)).toEqual({ hidden: ['d', 'e'], shown: ['a', 'b', 'c'] });
  });

  it('shows everything without a max or when they fit', () => {
    expect(splitVisible(items, 0)).toEqual({ hidden: [], shown: items });
    expect(splitVisible(items, 5)).toEqual({ hidden: [], shown: items });
  });
});
