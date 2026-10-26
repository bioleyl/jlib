/** A run of a pattern page's text: plain, `code`, **strong**, or a [link](/route). */
export type TextRun =
  | { kind: 'plain'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'link'; text: string; href: string };

// `code`, then **strong**, then [label](address): the first that starts earliest wins.
const MARKUP = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** The run one match of MARKUP stands for. */
function runOf(match: RegExpMatchArray): TextRun {
  const [, code, strong, label, href] = match;
  if (code !== undefined) {
    return { kind: 'code', text: code };
  }
  if (strong !== undefined) {
    return { kind: 'strong', text: strong };
  }
  return { href: href ?? '', kind: 'link', text: label ?? '' };
}

/** Splits a text into its runs; markup left open (a lone backtick) stays plain text. */
export function parseRichText(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let last = 0;
  for (const match of text.matchAll(MARKUP)) {
    const start = match.index ?? 0;
    if (start > last) {
      runs.push({ kind: 'plain', text: text.slice(last, start) });
    }
    runs.push(runOf(match));
    last = start + match[0].length;
  }
  if (last < text.length) {
    runs.push({ kind: 'plain', text: text.slice(last) });
  }
  return runs;
}

/** Whether an address is one of the site's routes (`/patterns/forms`), not another site or an anchor. */
export const isRoute = (href: string): boolean => href.startsWith('/') && !href.startsWith('//');
