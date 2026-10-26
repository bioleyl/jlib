const LEADING_SPACE = /^[ \t]*/;

/**
 * Removes the indentation every line shares, and the blank lines around the text: code written indented inside
 * an HTML element reads as it was meant.
 */
export function dedent(text: string): string {
  const lines = text
    .replace(/^\s*\n/, '')
    .trimEnd()
    .split('\n');
  const indents = lines
    .filter((line) => line.trim() !== '')
    .map((line) => LEADING_SPACE.exec(line)?.[0].length ?? 0);
  const shared = indents.length === 0 ? 0 : Math.min(...indents);
  return lines.map((line) => line.slice(shared)).join('\n');
}

/** A run of a headline: plain, or `accent` for the words written between asterisks. */
export type StarredPart = { text: string; accent: boolean };

const STAR = '*';

/**
 * A headline's runs: the words between asterisks are the accented ones, "Workflows that *ask* before they act."
 * A lone asterisk stays as it is; empty runs are left out.
 */
export function starredParts(text: string): StarredPart[] {
  const pieces = text.split(STAR);
  // An even count of pieces means an asterisk left open: it is a plain one, glued back to the last run.
  const closed =
    pieces.length % 2 === 1 ? pieces : [...pieces.slice(0, -2), `${pieces.at(-2)}${STAR}${pieces.at(-1)}`];
  return closed
    .map((piece, index) => ({ accent: index % 2 === 1, text: piece }))
    .filter((part) => part.text !== '');
}
