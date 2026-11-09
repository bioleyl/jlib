import { describe, expect, it } from 'vitest';

import { collator, dateTimeFormat, numberFormat } from '../src/lib/intl';

describe('dateTimeFormat, numberFormat and collator', () => {
  it('make one per locale and options, and give it back after', () => {
    expect(dateTimeFormat('fr-CH', { dateStyle: 'medium' })).toBe(
      dateTimeFormat('fr-CH', { dateStyle: 'medium' })
    );
    expect(numberFormat('de-CH')).toBe(numberFormat('de-CH'));
    expect(collator('en', { numeric: true })).toBe(collator('en', { numeric: true }));
  });

  it('make another for another locale or other options', () => {
    expect(dateTimeFormat('fr-CH', { dateStyle: 'medium' })).not.toBe(
      dateTimeFormat('en-US', { dateStyle: 'medium' })
    );
    expect(dateTimeFormat('fr-CH', { dateStyle: 'medium' })).not.toBe(
      dateTimeFormat('fr-CH', { dateStyle: 'long' })
    );
    expect(collator('en')).not.toBe(collator('en', { numeric: true }));
  });

  it('write as the Intl object they stand for', () => {
    const date = Date.UTC(2026, 10, 9);
    const options: Intl.DateTimeFormatOptions = { dateStyle: 'long', timeZone: 'UTC' };
    expect(dateTimeFormat('de-CH', options).format(date)).toBe(
      new Intl.DateTimeFormat('de-CH', options).format(date)
    );
    expect(numberFormat('de-CH').format(1234.5)).toBe(new Intl.NumberFormat('de-CH').format(1234.5));
    expect(['item 10', 'item 2'].sort(collator('en', { numeric: true }).compare)).toEqual(['item 2', 'item 10']);
  });
});
