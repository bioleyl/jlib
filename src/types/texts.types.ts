import type { DEFAULT_TEXTS } from '../lib/texts';

/** The name of one of the texts jlib's components show on their own. */
export type JlTextKey = keyof typeof DEFAULT_TEXTS;

/** The texts in the page's language: some or all of them, the rest staying in English. */
export type JlTexts = Partial<Record<JlTextKey, string>>;
