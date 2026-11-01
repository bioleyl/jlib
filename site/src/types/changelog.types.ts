/** A block of Markdown as the changelog writes it: a heading, a paragraph, or a list. */
export type MarkdownBlock =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] };

/** A version in the changelog, `0.9.0` with its date or `Unreleased` without one, and what is written under it. */
export type Release = { version: string; date?: string; blocks: MarkdownBlock[] };
