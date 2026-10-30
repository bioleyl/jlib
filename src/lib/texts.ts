import { assert, Bus, defineTranslations } from '@jadis/core';

import { safeLocale } from './locale';
import { fillText } from './text';

import type { PlaceholderValue, TranslationArgs, TranslationLoader, TranslationOf } from '@jadis/core';
import type {
  AddedLocale,
  FollowedTranslator,
  JlFixes,
  JlLanguage,
  JlLanguageEntry,
  JlLanguageTexts,
  JlSourceTexts,
  JlTextKey,
  ShownTexts,
} from '../types/texts.types';

/** The languages jlib translates itself. English is shown until a page chooses another, and every text's source. */
export const JL_LANGUAGES = ['en', 'fr', 'de'] as const;

const DEFAULT_LANGUAGE = 'en';
const LOCALE_SEPARATOR = '-';

/**
 * Every text jlib's components show or say on their own, in English: labels for screen readers, buttons, states,
 * the defaults of their text inputs. `{placeholders}` are filled when the text is shown.
 */
export const DEFAULT_TEXTS = defineTranslations({
  addedNamed: 'Added {names}',
  addTag: 'Add at least one tag.',
  addValue: 'Add a value',
  authOrigin: 'Made in Switzerland by SyWare',
  back: 'Back',
  breadcrumb: 'Breadcrumb',
  browse: 'Browse',
  cancel: 'Cancel',
  chooseDate: 'Choose a date',
  chooseDateFrom: 'Choose {date} or later.',
  chooseDateMissing: 'Choose a date.',
  chooseDateUntil: 'Choose {date} or earlier.',
  chooseFile: 'Choose a file.',
  chooseOption: 'Choose an option.',
  chooseRating: 'Choose a rating.',
  chosenFiles: 'Chosen files',
  clear: 'Clear',
  clearSearch: 'Clear the search',
  close: 'Close',
  closeMenu: 'Close the menu',
  collapseMenu: 'Collapse the menu',
  commandPalette: 'Command palette',
  commandPlaceholder: 'Type a command or search…',
  commands: 'Commands',
  confirm: 'Confirm',
  copied: 'Copied',
  copy: 'Copy',
  decrease: 'Decrease',
  details: 'Details',
  detailsOf: 'Details of {name}',
  dismiss: 'Dismiss',
  downloadCancel: 'Cancel',
  downloadFailed: 'Not downloaded: {error}',
  downloadPreparing: 'Preparing the file… {time}',
  downloadReceived: '{received} received',
  downloadReceivedOf: '{received} of {total}',
  downloadSaved: 'Saved as {name}, {size}',
  dragToConnect: 'Drag to another node to connect',
  dropFile: 'Drop a file here',
  dropFiles: 'Drop files here',
  expandMenu: 'Expand the menu',
  failedStep: ', failed',
  fileTooLarge: 'is larger than {size}',
  fileTooMany: 'is one too many: the field takes a single file',
  fileUpTo: 'up to {size}',
  fileWrongType: 'is not an accepted type ({types})',
  fillField: 'Please fill in this field.',
  fitView: 'Show every node',
  flow: 'Flow',
  flowEmpty: 'Nothing here yet.',
  hidePassword: 'Hide the password',
  increase: 'Increase',
  leave: 'Leave',
  leaveHeading: 'Leave without saving?',
  leaveText: 'Your changes are lost.',
  loadError: 'This could not be loaded.',
  loading: 'Loading',
  loadingMore: 'Loading…',
  loadStateError: 'Check the connection, then try again. Nothing was changed.',
  loadStateHeading: 'This could not be loaded',
  mainNavigation: 'Main',
  menu: 'Menu',
  navigation: 'Navigation',
  nextMonth: 'Next month',
  nextPage: 'Next page',
  noCommands: 'No matching commands',
  noData: 'No data',
  node: 'node',
  noRating: 'No rating',
  noResults: 'No results',
  notifications: 'Notifications',
  page: 'Page',
  pageNumber: 'Page {page}',
  pageOfTotal: '{page} of {total}',
  pagination: 'Pagination',
  previousMonth: 'Previous month',
  previousPage: 'Previous page',
  progress: 'Progress',
  rating: 'Rating',
  ratingOf: '{value} of {max}',
  remove: 'Remove',
  removedNamed: 'Removed {name}',
  removeEdge: 'Remove this edge',
  removeNamed: 'Remove {name}',
  removeValue: 'Remove this value',
  resizePanes: 'Resize the panes',
  retry: 'Try again',
  search: 'Search',
  selectAllRows: 'Select all rows',
  selectNamed: 'Select {name}',
  selectOption: 'Please select one of these options.',
  shortcuts: 'Shortcuts',
  showMore: 'Show more',
  showMoreCount: 'Show {count} more',
  shownOfTotal: '{shown} of {total}',
  showOptions: 'Show the options',
  showPagesOf: 'Show the pages of {name}',
  showPassword: 'Show the password',
  stay: 'Keep editing',
  stepCurrent: ', current step',
  stepDone: ', completed',
  tidyLayout: 'Tidy up the layout',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
});

/** jlib's other languages, each loaded the first time it is shown. */
const LANGUAGE_LOADERS: Record<
  Exclude<JlLanguage, typeof DEFAULT_LANGUAGE>,
  TranslationLoader<JlLanguageTexts>
> = {
  de: () => import('./texts-de'),
  fr: () => import('./texts-fr'),
};

const missingLanguages = (locales: readonly string[]): string =>
  `jlib has no texts for ${locales.join(', ')}: add them with jlTexts.add('${locales[0]}', …), `
  + `or show one of jlib's languages for it with jlTexts.add('${locales[0]}', 'en')`;

const languageOf = (locale: string): string => (locale.split(LOCALE_SEPARATOR)[0] ?? locale).toLowerCase();

const isJlLanguage = (value: unknown): value is JlLanguage => JL_LANGUAGES.some((language) => language === value);

/**
 * jlib's texts, in the language they are shown in: English until a page chooses another. jlib translates English,
 * French and German itself; a page fixes some of their texts, adds a language, or has them follow its translator.
 */
class JlTexts {
  /** Emits `change` with the locale shown, once its texts are the ones `jlText` gives. */
  readonly bus = new Bus<{ change: string }>();
  private readonly _languages = new Map<string, JlLanguageEntry>([
    [DEFAULT_LANGUAGE, DEFAULT_TEXTS],
    ...Object.entries(LANGUAGE_LOADERS),
  ]);
  private readonly _fixes = new Map<string, JlFixes>();
  private readonly _loaded = new Map<string, Promise<JlLanguageTexts>>();
  private _shown: ShownTexts = {
    locale: DEFAULT_LANGUAGE,
    numbers: new Intl.NumberFormat(DEFAULT_LANGUAGE),
    texts: DEFAULT_TEXTS,
  };
  /** The locale asked last: a slower load asked before it is not shown. */
  private _wanted: string = DEFAULT_LANGUAGE;
  private _following?: AbortController;

  /** The locale whose texts are shown. */
  get locale(): string {
    return this._shown.locale;
  }

  /**
   * Shows jlib's texts in a locale: its own, else its language's (`fr-CH` shows `fr`), with the fixes given for
   * either. Loads them the first time, then emits `change`. When it is called again before the texts are loaded,
   * the locale asked last wins.
   * @throws When jlib has no texts for the locale: add them with `add`.
   */
  async setLocale(locale: string): Promise<void> {
    this.assertShown([locale]);
    this._wanted = locale;
    const texts = await this.compose(locale);
    if (this._wanted !== locale || this._shown.locale === locale) {
      return;
    }
    this.show(locale, texts);
  }

  /**
   * Fixes some of jlib's texts in one locale, each with the placeholders of its English text. Fixes given for a
   * language (`de`) apply to its regions (`de-CH`) too.
   */
  fix<const T>(
    locale: string,
    fixes: T extends Partial<TranslationOf<T, JlSourceTexts>> ? T : Partial<TranslationOf<T, JlSourceTexts>>
  ): void;
  fix(locale: string, fixes: JlFixes): void {
    this._fixes.set(locale, { ...this._fixes.get(locale), ...fixes });
    this.redrawWhenShown(locale);
  }

  /**
   * Adds a language jlib does not translate: one of jlib's own languages shown for it (`add('es', 'en')`), or all
   * of jlib's texts in it, as they are or with their loader (`add('es', () => import('./jl-es'))`).
   */
  add<const Locale extends string>(locale: AddedLocale<Locale>, language: JlLanguage): void;
  add<const Locale extends string>(locale: AddedLocale<Locale>, loader: TranslationLoader<JlLanguageTexts>): void;
  add<const Locale extends string, const T>(
    locale: AddedLocale<Locale>,
    texts: T extends TranslationOf<T, JlSourceTexts> ? T : TranslationOf<T, JlSourceTexts>
  ): void;
  add(locale: string, entry: JlLanguageEntry): void {
    assert(
      !isJlLanguage(locale),
      `jlib translates ${locale} itself: fix its texts with jlTexts.fix('${locale}', …)`
    );
    this._languages.set(locale, entry);
    this._loaded.delete(locale);
    this.redrawWhenShown(locale);
  }

  /**
   * Shows jlib's texts in the language of a translator, now and at each of its changes. Loads them for each of
   * its locales first, so they change with the page's own texts.
   * @throws When jlib has no texts for one of the translator's locales: add them with `add`.
   */
  async follow<Locale extends string>(translator: FollowedTranslator<Locale>): Promise<void> {
    this.assertShown(translator.locales);
    this._following?.abort();
    this._following = new AbortController();
    translator.bus.register('change', (locale) => void this.setLocale(locale), this._following.signal);
    await Promise.all(translator.locales.map((locale) => this.compose(locale)));
    await this.setLocale(translator.locale);
  }

  /** A text in the locale shown, its placeholders filled; a number is written the way the locale writes it. */
  text(key: JlTextKey, values: Readonly<Record<string, PlaceholderValue>>): string {
    return fillText(this._shown.texts[key], this.formatted(values));
  }

  /** A text in the locale shown, as it is written. */
  template(key: JlTextKey): string {
    return this._shown.texts[key];
  }

  private assertShown(locales: readonly string[]): void {
    const missing = locales.filter((locale) => this.languageFor(locale) === undefined);
    assert(missing.length === 0, missingLanguages(missing));
  }

  /** The language whose texts a locale shows: its own, else its language's. */
  private languageFor(locale: string): string | undefined {
    if (this._languages.has(locale)) {
      return locale;
    }
    const language = languageOf(locale);
    return this._languages.has(language) ? language : undefined;
  }

  private async compose(locale: string): Promise<ShownTexts['texts']> {
    const language = this.languageFor(locale) ?? DEFAULT_LANGUAGE;
    const texts = await this.textsOf(language);
    const ownFixes = locale === language ? undefined : this._fixes.get(locale);
    return { ...texts, ...this._fixes.get(language), ...ownFixes };
  }

  /** A language's texts; a load that fails is forgotten, so the next `setLocale` tries again. */
  private textsOf(language: string): Promise<JlLanguageTexts> {
    const known = this._loaded.get(language);
    if (known) {
      return known;
    }
    const loading = this.read(language);
    this._loaded.set(language, loading);
    loading.catch(() => this._loaded.delete(language));
    return loading;
  }

  private async read(language: string): Promise<JlLanguageTexts> {
    const entry = this._languages.get(language) ?? DEFAULT_TEXTS;
    if (isJlLanguage(entry)) {
      return this.textsOf(entry);
    }
    return typeof entry === 'function' ? (await entry()).default : entry;
  }

  private shows(locale: string): boolean {
    return this._shown.locale === locale || this.languageFor(this._shown.locale) === locale;
  }

  private redrawWhenShown(locale: string): void {
    if (!this.shows(locale)) {
      return;
    }
    void this.redraw();
  }

  private async redraw(): Promise<void> {
    const { locale } = this._shown;
    const texts = await this.compose(locale);
    if (this._wanted !== locale) {
      return;
    }
    this.show(locale, texts);
  }

  private show(locale: string, texts: ShownTexts['texts']): void {
    this._shown = { locale, numbers: new Intl.NumberFormat(safeLocale(locale)), texts };
    this.bus.emit('change', locale);
  }

  private formatted(values: Readonly<Record<string, PlaceholderValue>>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(values).map(([name, value]) => [
        name,
        typeof value === 'number' ? this._shown.numbers.format(value) : value,
      ])
    );
  }
}

/** jlib's texts: shown in English until a page chooses another language, or has them follow its translator. */
export const jlTexts = new JlTexts();

/** One of jlib's texts, in the language shown, its `{placeholders}` filled. */
export function jlText<K extends JlTextKey>(key: K, ...params: TranslationArgs<JlSourceTexts, K>): string;
export function jlText(key: JlTextKey, values: Readonly<Record<string, PlaceholderValue>> = {}): string {
  return jlTexts.text(key, values);
}

/**
 * One of jlib's texts in the language shown, as it is written, its `{placeholders}` left for the component to fill:
 * the default of an input that holds a text with placeholders.
 */
export const jlTemplate = (key: JlTextKey): string => jlTexts.template(key);
