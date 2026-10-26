import { describe, expect, it } from 'vitest';

import { trendOfDelta } from '../src/lib/trend';

describe('trendOfDelta', () => {
  it('reads the sign of a delta', () => {
    expect(trendOfDelta('+12.5%')).toBe('up');
    expect(trendOfDelta('-3')).toBe('down');
    expect(trendOfDelta('−0.4 pt')).toBe('down');
    expect(trendOfDelta('+$1,200')).toBe('up');
  });

  it('is flat for zero, no sign or no number', () => {
    expect(trendOfDelta('+0%')).toBe('flat');
    expect(trendOfDelta('12')).toBe('flat');
    expect(trendOfDelta('')).toBe('flat');
    expect(trendOfDelta('n/a')).toBe('flat');
  });
});
