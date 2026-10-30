// Type tests: `npm run typecheck` checks them, nothing runs them. jlib's texts take the parameters each text has,
// and a page's fixes and languages are checked against the English texts: their keys and their placeholders.
import { Translator } from '@jadis/core';
import { describe, it } from 'vitest';

import { DEFAULT_TEXTS, jlText, jlTexts } from '../src/lib/texts';

describe('jlText', () => {
  it('takes the parameters of the text, and only them', () => {
    jlText('close');
    jlText('detailsOf', { name: 'a.pdf' });
    jlText('shownOfTotal', { shown: 30, total: 120 });
    // @ts-expect-error: {name} is missing
    jlText('detailsOf');
    // @ts-expect-error: close has no placeholder
    jlText('close', { name: 'a.pdf' });
    // @ts-expect-error: not one of jlib's texts
    jlText('closeAll');
  });
});

describe('fix', () => {
  it("takes some of jlib's texts, each with its placeholders", () => {
    jlTexts.fix('fr', { close: 'Fermer la fenêtre', detailsOf: 'À propos de {name}' });
    jlTexts.fix('de-CH', { close: 'Schliessen' });
    // @ts-expect-error: {name} is missing
    jlTexts.fix('fr', { detailsOf: 'Détails' });
    // @ts-expect-error: {nom} would never be filled
    jlTexts.fix('fr', { detailsOf: 'Détails de {name} ({nom})' });
    // @ts-expect-error: not one of jlib's texts
    jlTexts.fix('fr', { closeAll: 'Tout fermer' });
  });
});

describe('add', () => {
  it("takes one of jlib's languages, or all of its texts", () => {
    jlTexts.add('es', 'en');
    jlTexts.add('es', () => Promise.resolve({ default: { ...DEFAULT_TEXTS, close: 'Cerrar' } }));
    jlTexts.add('es', { ...DEFAULT_TEXTS, close: 'Cerrar' });
    // @ts-expect-error: jlib translates French itself, its texts are fixed instead
    jlTexts.add('fr', 'en');
    // @ts-expect-error: not one of jlib's languages
    jlTexts.add('pt', 'es');
    // @ts-expect-error: a language has every text
    jlTexts.add('es', { close: 'Cerrar' });
    // @ts-expect-error: detailsOf writes {name}
    jlTexts.add('es', { ...DEFAULT_TEXTS, detailsOf: 'Detalles' });
  });
});

describe('follow', () => {
  it('takes a Jadis translator', () => {
    const en = { home: 'Home' } as const;
    void jlTexts.follow(new Translator({ en }, { fr: { home: 'Accueil' } }));
  });
});
