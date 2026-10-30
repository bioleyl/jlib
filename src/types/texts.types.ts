import type { Bus, TranslationLoader, Translations } from '@jadis/core';
import type { DEFAULT_TEXTS, JL_LANGUAGES } from '../lib/texts';

/** jlib's texts in English: the source every language translates. */
export type JlSourceTexts = typeof DEFAULT_TEXTS;

/** The name of one of the texts jlib's components show on their own. */
export type JlTextKey = keyof JlSourceTexts;

/** A language jlib translates itself. */
export type JlLanguage = (typeof JL_LANGUAGES)[number];

/** All of jlib's texts in one language, each with the placeholders of its English text. */
export type JlLanguageTexts = Translations<JlSourceTexts>;

/** Some of jlib's texts in one language, each with the placeholders of its English text. */
export type JlFixes = Partial<JlLanguageTexts>;

/** What a language added to jlib shows: its texts, their loader, or one of jlib's own languages. */
export type JlLanguageEntry = JlLanguageTexts | TranslationLoader<JlLanguageTexts> | JlLanguage;

/** A translator jlib's texts can follow, such as a Jadis `Translator`. */
export interface FollowedTranslator<Locale extends string> {
  readonly locale: Locale;
  readonly locales: readonly Locale[];
  readonly bus: Bus<{ change: Locale }>;
}

/** A locale a page can add: one jlib does not translate itself, whose texts are fixed instead. */
export type AddedLocale<Locale extends string> = Locale extends JlLanguage
  ? `jlib translates ${Locale} itself: fix its texts with jlTexts.fix`
  : Locale;

/** The texts shown, in the locale they are shown for, with that locale's number format. */
export interface ShownTexts {
  locale: string;
  numbers: Intl.NumberFormat;
  texts: Readonly<Record<JlTextKey, string>>;
}
