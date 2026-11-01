// CHANGELOG.md read for the site's Changelog page. It takes the Markdown the changelog writes, nothing more: headings,
// paragraphs and `- ` lists, a line under an item continuing it. Inline markup stays in the text (`richText` draws it).

import type { MarkdownBlock, Release } from '../types/changelog.types';

type LineKind = 'blank' | 'heading' | 'item' | 'text';

/** Adds a line to the blocks read so far; says whether the next line of text continues the last one. */
type LineReader = (blocks: MarkdownBlock[], line: string, open: boolean) => boolean;

const HEADING = /^(#+)\s+(.*)$/;
const ITEM = /^-\s+(.*)$/;
const BLANK = /^\s*$/;
// The heading of a version: `0.9.0 (2026-10-30)`, or `Unreleased` without a date.
const RELEASE_HEADING = /^(.+?)(?:\s+\((\d{4}-\d{2}-\d{2})\))?$/;
const RELEASE_LEVEL = 2;

const LINE_KINDS: readonly { kind: LineKind; pattern: RegExp }[] = [
  { kind: 'blank', pattern: BLANK },
  { kind: 'heading', pattern: HEADING },
  { kind: 'item', pattern: ITEM },
];

const kindOf = (line: string): LineKind => LINE_KINDS.find(({ pattern }) => pattern.test(line))?.kind ?? 'text';

/** Adds a line to a paragraph, or to a list's last item. */
function extend(block: Exclude<MarkdownBlock, { kind: 'heading' }>, line: string): void {
  if (block.kind === 'paragraph') {
    block.text = `${block.text} ${line}`;
    return;
  }
  block.items.push(`${block.items.pop() ?? ''} ${line}`);
}

const READERS: Record<LineKind, LineReader> = {
  blank: () => false,
  heading: (blocks, line) => {
    const [, marks = '', text = ''] = HEADING.exec(line) ?? [];
    blocks.push({ kind: 'heading', level: marks.length, text });
    return false;
  },
  item: (blocks, line, open) => {
    const item = line.replace(ITEM, '$1');
    const last = blocks.at(-1);
    if (open && last?.kind === 'list') {
      last.items.push(item);
      return true;
    }
    blocks.push({ items: [item], kind: 'list' });
    return true;
  },
  text: (blocks, line, open) => {
    const last = blocks.at(-1);
    if (!open || last === undefined || last.kind === 'heading') {
      blocks.push({ kind: 'paragraph', text: line });
      return true;
    }
    extend(last, line);
    return true;
  },
};

/** The blocks of a Markdown text: a blank line ends a paragraph or a list, an item starts a list or adds to it. */
export function parseMarkdown(text: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let open = false;
  for (const line of text.split('\n')) {
    open = READERS[kindOf(line)](blocks, line.trim(), open);
  }
  return blocks;
}

const isReleaseHeading = (block: MarkdownBlock): block is Extract<MarkdownBlock, { kind: 'heading' }> =>
  block.kind === 'heading' && block.level === RELEASE_LEVEL;

/** A version, still empty, from its heading. */
function releaseOf(heading: string): Release {
  const [, version = heading, date] = RELEASE_HEADING.exec(heading) ?? [];
  return date === undefined ? { blocks: [], version } : { blocks: [], date, version };
}

/** The versions of a changelog, in its order: each `## ` heading and what follows it. What comes first is left out. */
export function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = [];
  for (const block of parseMarkdown(markdown)) {
    if (isReleaseHeading(block)) {
      releases.push(releaseOf(block.text));
      continue;
    }
    releases.at(-1)?.blocks.push(block);
  }
  return releases;
}
