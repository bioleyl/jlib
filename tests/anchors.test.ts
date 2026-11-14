import { describe, expect, it } from 'vitest';

import { freeSlug, slugOf, subtitleSlug } from '../site/src/lib/anchors';

describe('the names of the places in a page', () => {
  it('reads a title as an address does', () => {
    expect(slugOf('Pages, in the footer')).toBe('pages-in-the-footer');
    expect(slugOf('0.16.0')).toBe('0-16-0');
    expect(slugOf('  Écrire – déjà vu?  ')).toBe('écrire-déjà-vu');
    expect(slugOf('—')).toBe('');
  });

  it('puts a subtitle under its title, and leaves one without a title as it is', () => {
    expect(subtitleSlug('0-16-0', 'Added')).toBe('0-16-0-added');
    expect(subtitleSlug('', 'Added')).toBe('added');
  });

  it('gives the name itself while it is free, then the first copy that is', () => {
    expect(freeSlug('api', new Set())).toBe('api');
    expect(freeSlug('api', new Set(['api']))).toBe('api-2');
    expect(freeSlug('api', new Set(['api', 'api-2']))).toBe('api-3');
  });
});
