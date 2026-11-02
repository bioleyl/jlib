export type ThemeMode = 'system' | 'light' | 'dark';

/** How the Theming page shows a token's value. */
export type TokenKind = 'colour' | 'radius' | 'length' | 'shadow' | 'text';

export type TokenDoc = { name: string; description: string; kind: TokenKind };

export type TokenGroup = { label: string; tokens: readonly TokenDoc[] };

/** A page of the guide, in the side navigation and the search. */
export type GuideLink = {
  path: `/${string}`;
  label: string;
  icon: string;
  summary: string;
  /** Other words the search finds the page by. */
  keywords?: string[];
};

/** The whole SyWare logo, or its mark alone. */
export type LogoVariant = 'mark' | 'logo';

/** Loads a page's module, and gives its class: `() => import('./colour-page').then((module) => module.ColourPage)`. */
export type PageLoader = () => Promise<CustomElementConstructor>;
