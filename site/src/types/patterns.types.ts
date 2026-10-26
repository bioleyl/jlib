import type { CodeLanguage } from '@syware/jlib';
import type { GuideLink } from './site.types';

/**
 * Text of a pattern page, with a little inline markup: `code`, **strong** and [a link](/route). A link to a route
 * of the site goes through `pageHref`; any other address opens as it is.
 */
export type RichText = string;

/** A live preview (HTML of jl-* components) with what it shows. */
export type Guideline = { preview: string; text?: RichText };

/** A piece of a pattern page's section, in the order it reads. */
export type PatternBlock =
  | { kind: 'text'; text: RichText }
  | { kind: 'list'; items: readonly RichText[] }
  /** A do beside a don't. */
  | { kind: 'rules'; do: Guideline; dont: Guideline }
  /** A live preview alone, with an optional caption under it. */
  | { kind: 'preview'; html: string; caption?: RichText }
  /** A table whose first column names the case. */
  | { kind: 'table'; head: readonly string[]; rows: readonly (readonly RichText[])[] }
  | { kind: 'note'; text: RichText }
  /** Code, written indented in the source: it is dedented. */
  | { kind: 'code'; language: CodeLanguage; code: string };

export type PatternSection = { heading: string; blocks: readonly PatternBlock[] };

/** A page of the UX patterns: what it is about, in the navigation and the search, and what it says. */
export type PatternDoc = GuideLink & {
  path: `/patterns/${string}`;
  /** The heading of the page; the label is the short name of the navigation. */
  title: string;
  lead: string;
  sections: readonly PatternSection[];
  /** The components that do the work, by tag, linked at the end of the page. */
  components: readonly string[];
};

/** A rule shared by every pattern, on the overview. */
export type UxPrinciple = { title: string; text: string };
