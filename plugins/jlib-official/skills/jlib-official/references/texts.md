# jlib's texts in the app's language

What jlib's components say on their own (close and clear buttons, **Show more**, **Try again**, a file drop's
refusals, the labels screen readers hear, the defaults of their text inputs, "Leave without saving?") is jlib's to
translate. jlib has English, French and German, and shows English until the app chooses.

## Contents

- An app in one language
- An app with a Jadis `Translator`
- Another language, or a text changed
- What is not jlib's
- Your own components

## An app in one language

Choose once, in `main.tsx`, before anything is drawn:

```ts
import { jlTexts } from '@syware/jlib';

await jlTexts.setLocale('fr'); // a region takes its language: 'fr-CH' shows French
```

`jlTexts.locale` is the locale shown. A locale jlib has no texts for is refused (it throws): add it first (below).

## An app with a Jadis `Translator`

jlib follows the app's translator: it loads its texts for each of the app's locales, then changes language with the
app, every component drawing its texts again.

```ts
// src/main.tsx
import { jlTexts } from '@syware/jlib';

import { i18n } from './i18n';

await jlTexts.follow(i18n);
```

A language menu sets the app's translator only (`i18n.setLocale('de')`): jlib follows.

## Another language, or a text changed

Each is checked against the English texts, `DEFAULT_TEXTS`: every key, and each text's `{placeholders}`.

```ts
jlTexts.add('it', 'en'); // one of jlib's languages shown for Italian
jlTexts.add('es', () => import('./jl-es')); // all of jlib's texts in Spanish, loaded when shown
jlTexts.fix('de-CH', { close: 'Schliessen' }); // a few texts of one locale: Swiss German writes no ß
```

```ts
// jl-es.ts, beside main.tsx
import { defineTranslations } from '@jadis/core';
import { DEFAULT_TEXTS } from '@syware/jlib';

export default defineTranslations(DEFAULT_TEXTS, {
  // every key of DEFAULT_TEXTS, in Spanish; the type refuses a missing one
});
```

`JL_LANGUAGES` lists jlib's own languages (`['en', 'fr', 'de']`); `DEFAULT_TEXTS` every key with its English text.

## What is not jlib's

- The texts that name the app's content are inputs of each component, in the app's own words and translations: a
  page's `heading`, a table's `emptyText`, a load state's `errorHeading`, a confirmation's `heading` and `text`.
- An input that defaults to one of jlib's texts defaults to `''`: leave it empty to keep jlib's text in the language
  shown; set it only to say something more precise ("Delete the order").
- A text jlib shows that none of this can change is a gap: report it as an issue (see SKILL.md).

## Your own components

A component of the app that extends `JlElement` writes its own texts in a method of another name than `drawTexts`,
which is jlib's (called at every connection and at each change of jlib's language): `writeTexts`, with its own
`this.useTranslation(i18n, () => this.writeTexts())`.

In a test or a page rendered on a server, the language is module state shared by everything that runs: choose it
in each test that needs it, and in each server render from the request.
