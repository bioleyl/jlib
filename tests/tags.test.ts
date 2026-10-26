import { describe, expect, it } from 'vitest';

import { addTags, hasTag, hasTagSeparator, splitTags } from '../src/lib/tags';

describe('splitTags', () => {
  it('splits on commas and line breaks, and drops blanks', () => {
    expect(splitTags('a, b,,c')).toEqual(['a', 'b', 'c']);
    expect(splitTags('design\nfrontend\r\n  ops  ')).toEqual(['design', 'frontend', 'ops']);
    expect(splitTags('   ')).toEqual([]);
  });

  it('tells whether a text holds a separator', () => {
    expect(hasTagSeparator('a, b')).toBe(true);
    expect(hasTagSeparator('just one')).toBe(false);
  });
});

describe('addTags', () => {
  it('adds new tags at the end', () => {
    expect(addTags(['a'], ['b', 'c'], 0)).toEqual({ duplicates: [], tags: ['a', 'b', 'c'] });
  });

  it('refuses duplicates whatever their case, and says which', () => {
    expect(addTags(['Design'], ['design', 'ops', 'OPS'], 0)).toEqual({
      duplicates: ['design', 'OPS'],
      tags: ['Design', 'ops'],
    });
    expect(hasTag(['Design'], 'DESIGN')).toBe(true);
  });

  it('stops at the maximum', () => {
    expect(addTags(['a', 'b'], ['c', 'd'], 3).tags).toEqual(['a', 'b', 'c']);
    expect(addTags(['a', 'b', 'c'], ['d'], 3).tags).toEqual(['a', 'b', 'c']);
  });

  it('trims the tags and drops blanks', () => {
    expect(addTags([], ['  a  ', ' '], 0).tags).toEqual(['a']);
  });
});
