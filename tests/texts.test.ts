import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_TEXTS, jlText, setTexts } from '../src/lib/texts';

describe("jlib's texts", () => {
  afterEach(() => setTexts(DEFAULT_TEXTS));

  it('are English until a page gives its own, its placeholders filled', () => {
    expect(jlText('close')).toBe('Close');
    expect(jlText('shownOfTotal', { shown: '30', total: '120' })).toBe('30 of 120');
  });

  it('take the texts a page sets, and keep English for the others', () => {
    setTexts({ close: 'Fermer', shownOfTotal: '{shown} sur {total}' });
    expect(jlText('close')).toBe('Fermer');
    expect(jlText('shownOfTotal', { shown: '30', total: '120' })).toBe('30 sur 120');
    expect(jlText('dismiss')).toBe('Dismiss');
  });

  it('leave a placeholder they are not given as it is: a component fills it later', () => {
    expect(jlText('showMoreCount')).toBe('Show {count} more');
  });
});
