import { describe, expect, it } from 'vitest';

import { safeLocale } from '../src/lib/locale';

describe('safeLocale', () => {
  it('gives the canonical form of a locale', () => {
    expect(safeLocale('fr-ch')).toBe('fr-CH');
    expect(safeLocale('en')).toBe('en');
  });

  it('falls back to the runtime locale for an empty or malformed one', () => {
    expect(safeLocale('')).toBeUndefined();
    expect(safeLocale('not a locale!')).toBeUndefined();
  });
});
