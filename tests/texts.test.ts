import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { JlLanguageTexts } from '../src/types/texts.types';

/** What French writes between thousands. */
const FRENCH_THOUSANDS_SEPARATOR = ' ';

// @jadis/core defines its components on HTMLElement as it loads; these tests run without a DOM.
beforeAll(() => {
  if (!('HTMLElement' in globalThis)) {
    vi.stubGlobal('HTMLElement', class {});
  }
});

/** jlib's texts as a page first finds them: English, nothing fixed, added or followed. */
async function freshTexts() {
  vi.resetModules();
  return import('../src/lib/texts');
}

/** A translator as jlib's texts see it: its locale, its locales, and the bus that says when it changes. */
async function translatorOf<Locale extends string>(locale: Locale, locales: Locale[]) {
  const { Bus } = await import('@jadis/core');
  return { bus: new Bus<{ change: Locale }>(), locale, locales };
}

/** Lets the loads and the redraws waiting on promises end. */
const settle = () => new Promise((resolve) => setTimeout(resolve));

/** A loader the test settles itself. */
function deferredLoader(texts: JlLanguageTexts) {
  let settleLoad = () => {};
  const promise = new Promise<{ default: JlLanguageTexts }>((resolve) => {
    settleLoad = () => resolve({ default: texts });
  });
  return { load: vi.fn(() => promise), settle: () => settleLoad() };
}

describe("jlib's texts", () => {
  it('are English until a page chooses another language, their placeholders filled', async () => {
    const { jlText, jlTexts } = await freshTexts();

    expect(jlTexts.locale).toBe('en');
    expect(jlText('close')).toBe('Close');
    expect(jlText('shownOfTotal', { shown: 30, total: 1200 })).toBe('30 of 1,200');
  });

  it('give a text as it is written, for a component to fill', async () => {
    const { jlTemplate } = await freshTexts();

    expect(jlTemplate('showMoreCount')).toBe('Show {count} more');
  });

  it('are in French and in German too, loaded when chosen', async () => {
    const { jlText, jlTexts } = await freshTexts();

    await jlTexts.setLocale('fr');
    expect(jlTexts.locale).toBe('fr');
    expect(jlText('close')).toBe('Fermer');

    await jlTexts.setLocale('de');
    expect(jlText('detailsOf', { name: 'a.pdf' })).toBe('Details zu a.pdf');
  });

  it('show a region in its language', async () => {
    const { jlText, jlTexts } = await freshTexts();

    await jlTexts.setLocale('fr-CH');

    expect(jlTexts.locale).toBe('fr-CH');
    expect(jlText('close')).toBe('Fermer');
  });

  it('write numbers the way the language shown writes them', async () => {
    const { jlText, jlTexts } = await freshTexts();

    await jlTexts.setLocale('fr');

    expect(jlText('shownOfTotal', { shown: 30, total: 1200 })).toBe(`30 sur 1${FRENCH_THOUSANDS_SEPARATOR}200`);
  });

  it('say when they change, and only then', async () => {
    const { jlTexts } = await freshTexts();
    const onChange = vi.fn();
    jlTexts.bus.register('change', onChange, new AbortController().signal);

    await jlTexts.setLocale('fr');
    await jlTexts.setLocale('fr');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('fr');
  });

  it('refuse a language they have no texts for', async () => {
    const { jlTexts } = await freshTexts();

    await expect(jlTexts.setLocale('es')).rejects.toThrowError(
      "jlib has no texts for es: add them with jlTexts.add('es'"
    );
    expect(jlTexts.locale).toBe('en');
  });

  describe('fix', () => {
    it('changes texts of one language, its regions included', async () => {
      const { jlText, jlTexts } = await freshTexts();
      jlTexts.fix('fr', { close: 'Fermer la fenêtre' });
      jlTexts.fix('fr-CH', { dismiss: 'Masquer' });

      await jlTexts.setLocale('fr-CH');
      expect(jlText('close')).toBe('Fermer la fenêtre');
      expect(jlText('dismiss')).toBe('Masquer');

      await jlTexts.setLocale('fr');
      expect(jlText('dismiss')).toBe('Fermer');
    });

    it('draws the language shown again', async () => {
      const { jlText, jlTexts } = await freshTexts();
      await jlTexts.setLocale('de');
      const onChange = vi.fn();
      jlTexts.bus.register('change', onChange, new AbortController().signal);

      jlTexts.fix('de-CH', { close: 'Schliessen' });
      jlTexts.fix('de', { close: 'Zumachen' });
      await settle();

      expect(jlText('close')).toBe('Zumachen');
      expect(onChange).toHaveBeenCalledExactlyOnceWith('de');
    });
  });

  describe('add', () => {
    it('shows one of their languages for another', async () => {
      const { jlText, jlTexts } = await freshTexts();
      jlTexts.add('es', 'fr');

      await jlTexts.setLocale('es');

      expect(jlText('close')).toBe('Fermer');
    });

    it('loads the texts of a language when it is first chosen', async () => {
      const { DEFAULT_TEXTS, jlText, jlTexts } = await freshTexts();
      const load = vi.fn(() => Promise.resolve({ default: { ...DEFAULT_TEXTS, close: 'Cerrar' } }));
      jlTexts.add('es', load);
      expect(load).not.toHaveBeenCalled();

      await jlTexts.setLocale('es');
      await jlTexts.setLocale('en');
      await jlTexts.setLocale('es');

      expect(jlText('close')).toBe('Cerrar');
      expect(load).toHaveBeenCalledOnce();
    });

    it('refuses a language they translate themselves', async () => {
      const { jlTexts } = await freshTexts();

      expect(() => Reflect.apply(jlTexts.add, jlTexts, ['fr', 'en'])).toThrowError('jlib translates fr itself');
    });

    it('tries a load that failed again', async () => {
      const { DEFAULT_TEXTS, jlTexts } = await freshTexts();
      const load = vi
        .fn<() => Promise<{ default: JlLanguageTexts }>>()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce({ default: DEFAULT_TEXTS });
      jlTexts.add('es', load);

      await expect(jlTexts.setLocale('es')).rejects.toThrowError('offline');
      expect(jlTexts.locale).toBe('en');

      await jlTexts.setLocale('es');
      expect(jlTexts.locale).toBe('es');
    });
  });

  it('show the locale asked last when an earlier one loads after it', async () => {
    const { DEFAULT_TEXTS, jlTexts } = await freshTexts();
    const spanish = deferredLoader(DEFAULT_TEXTS);
    jlTexts.add('es', spanish.load);

    const toSpanish = jlTexts.setLocale('es');
    await jlTexts.setLocale('fr');
    spanish.settle();
    await toSpanish;

    expect(jlTexts.locale).toBe('fr');
  });

  describe('follow', () => {
    it("shows the translator's language, now and at each change", async () => {
      const { jlText, jlTexts } = await freshTexts();
      const translator = await translatorOf('fr', ['en', 'fr', 'de']);

      await jlTexts.follow(translator);
      expect(jlText('close')).toBe('Fermer');

      translator.bus.emit('change', 'de');
      await settle();
      expect(jlText('close')).toBe('Schließen');
    });

    it('loads the texts of each of its languages first', async () => {
      const { DEFAULT_TEXTS, jlTexts } = await freshTexts();
      const load = vi.fn(() => Promise.resolve({ default: DEFAULT_TEXTS }));
      jlTexts.add('es', load);

      await jlTexts.follow(await translatorOf('en', ['en', 'es']));

      expect(load).toHaveBeenCalledOnce();
      expect(jlTexts.locale).toBe('en');
    });

    it('refuses a translator with languages they have no texts for, naming them all', async () => {
      const { jlTexts } = await freshTexts();

      await expect(jlTexts.follow(await translatorOf('en', ['en', 'es', 'pt']))).rejects.toThrowError(
        'jlib has no texts for es, pt'
      );
    });

    it('follows the last translator only', async () => {
      const { jlTexts } = await freshTexts();
      const first = await translatorOf('en', ['en', 'fr']);
      await jlTexts.follow(first);
      await jlTexts.follow(await translatorOf('en', ['en', 'de']));

      first.bus.emit('change', 'fr');
      await settle();

      expect(jlTexts.locale).toBe('en');
    });
  });
});
