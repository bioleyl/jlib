/** One fact about a thing: its label and value. A fact without a value is left out. */
export type Fact = {
  label: string;
  value: string | number | null;
  /** Drawn in the monospace font and broken anywhere: an identifier, a digest, a path. */
  code?: boolean;
  /** An address: the value is a link to it. */
  href?: string;
  /** The value's tooltip. */
  hint?: string;
  /** Names the fact for a renderer of `renderers`, which then draws its value. */
  key?: string;
};

/** Draws a fact's value: a badge, links, a list. */
export type FactRenderer = (fact: Fact) => Node;

/** `horizontal` puts each label beside its value, `vertical` over it, the facts side by side. */
export type FactsOrientation = 'horizontal' | 'vertical';
