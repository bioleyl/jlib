import { describe, expect, it } from 'vitest';

import { cssLength } from '../src/lib/css-length';

describe('cssLength', () => {
  it('puts plain numbers in pixels', () => {
    expect(cssLength('120')).toBe('120px');
    expect(cssLength(' 12.5 ')).toBe('12.5px');
  });

  it('keeps other lengths as they are', () => {
    expect(cssLength('50%')).toBe('50%');
    expect(cssLength('8rem')).toBe('8rem');
    expect(cssLength('')).toBe('');
  });
});
