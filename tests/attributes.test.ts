import { describe, expect, it } from 'vitest';

import { stringList, textListOf, textOf } from '../src/lib/attributes';

describe('stringList', () => {
  it('reads a JSON list', () => {
    expect(stringList('["design","data"]')).toEqual(['design', 'data']);
  });

  it('takes a plain value as a list of one', () => {
    expect(stringList('open')).toEqual(['open']);
    expect(stringList('  open  ')).toEqual(['open']);
  });

  it('gives an empty list for nothing', () => {
    expect(stringList(null)).toEqual([]);
    expect(stringList('')).toEqual([]);
    expect(stringList('   ')).toEqual([]);
  });

  it('gives an empty list for unreadable JSON or what is not a list', () => {
    expect(stringList('[oops')).toEqual([]);
  });

  it('turns the entries into strings', () => {
    expect(stringList('[1, true, "x"]')).toEqual(['1', 'true', 'x']);
  });
});

describe('textOf', () => {
  it('takes the text as it is, and the fallback when the attribute is missing', () => {
    const view = textOf<'list' | 'grid' | ''>('');
    expect(view('grid')).toBe('grid');
    expect(view(null)).toBe('');
  });

  it('reads a list of values as stringList does', () => {
    expect(textListOf<'open' | 'done'>('["open","done"]')).toEqual(['open', 'done']);
    expect(textListOf<'open' | 'done'>('open')).toEqual(['open']);
  });
});
