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
