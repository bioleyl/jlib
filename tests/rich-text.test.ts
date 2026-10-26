import { describe, expect, it } from 'vitest';

import { isRoute, parseRichText } from '../site/src/lib/rich-text';

describe('parseRichText', () => {
  it('keeps plain text as one run', () => {
    expect(parseRichText('Plain words.')).toEqual([{ kind: 'plain', text: 'Plain words.' }]);
  });

  it('reads code, strong and links between plain text', () => {
    expect(parseRichText('Use `jl-empty` with **an action**, see [Forms](/patterns/forms).')).toEqual([
      { kind: 'plain', text: 'Use ' },
      { kind: 'code', text: 'jl-empty' },
      { kind: 'plain', text: ' with ' },
      { kind: 'strong', text: 'an action' },
      { kind: 'plain', text: ', see ' },
      { href: '/patterns/forms', kind: 'link', text: 'Forms' },
      { kind: 'plain', text: '.' },
    ]);
  });

  it('leaves markup inside code alone', () => {
    expect(parseRichText('`**not bold**`')).toEqual([{ kind: 'code', text: '**not bold**' }]);
  });

  it('leaves unclosed markup as plain text', () => {
    expect(parseRichText('A lone ` and ** stay.')).toEqual([{ kind: 'plain', text: 'A lone ` and ** stay.' }]);
  });

  it('gives nothing for an empty text', () => {
    expect(parseRichText('')).toEqual([]);
  });
});

describe('isRoute', () => {
  it("tells the site's routes from other addresses", () => {
    expect(isRoute('/patterns/forms')).toBe(true);
    expect(isRoute('https://example.com')).toBe(false);
    expect(isRoute('//example.com/x')).toBe(false);
    expect(isRoute('#top')).toBe(false);
  });
});
