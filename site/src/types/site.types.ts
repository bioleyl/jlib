export type ThemeMode = 'system' | 'light' | 'dark';

/** How the Theming page shows a token's value. */
export type TokenKind = 'colour' | 'radius' | 'length' | 'shadow' | 'text';

export type TokenDoc = { name: string; description: string; kind: TokenKind };

export type TokenGroup = { label: string; tokens: readonly TokenDoc[] };

/** A page of the guide, in the side navigation and the search. */
export type GuideLink = { path: `/${string}`; label: string; icon: string; summary: string };

/** The whole SyWare logo, or its mark alone. */
export type LogoVariant = 'mark' | 'logo';
