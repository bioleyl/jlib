import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseChangelog, parseMarkdown } from '../site/src/lib/changelog';

const CHANGELOG = readFileSync(join(import.meta.dirname, '..', 'CHANGELOG.md'), 'utf8');
const VERSION = /^\d+\.\d+\.\d+$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const UNRELEASED = 'Unreleased';

const text = (...lines: string[]): string => lines.join('\n');

describe('parseMarkdown', () => {
  it('reads headings, with their level', () => {
    expect(parseMarkdown(text('# Changelog', '', '### Added'))).toEqual([
      { kind: 'heading', level: 1, text: 'Changelog' },
      { kind: 'heading', level: 3, text: 'Added' },
    ]);
  });

  it('joins the lines of a paragraph, and ends it at a blank line', () => {
    expect(parseMarkdown(text('One line', 'and the next.', '', 'Another.'))).toEqual([
      { kind: 'paragraph', text: 'One line and the next.' },
      { kind: 'paragraph', text: 'Another.' },
    ]);
  });

  it('continues an item with the lines under it', () => {
    expect(parseMarkdown(text('- **First**: on', '  two lines.', '- Second.'))).toEqual([
      { items: ['**First**: on two lines.', 'Second.'], kind: 'list' },
    ]);
  });

  it('starts another list after a blank line or a heading', () => {
    expect(parseMarkdown(text('- A', '', '- B', '### Fixed', '- C'))).toEqual([
      { items: ['A'], kind: 'list' },
      { items: ['B'], kind: 'list' },
      { kind: 'heading', level: 3, text: 'Fixed' },
      { items: ['C'], kind: 'list' },
    ]);
  });

  it('starts a paragraph on the line under a heading', () => {
    expect(parseMarkdown(text('## 0.1.0', 'The first version.'))).toEqual([
      { kind: 'heading', level: 2, text: '0.1.0' },
      { kind: 'paragraph', text: 'The first version.' },
    ]);
  });
});

describe('parseChangelog', () => {
  const sample = text(
    '# Changelog',
    '',
    'What changed.',
    '',
    '## Unreleased',
    '',
    '### Added',
    '',
    '- A thing.',
    '',
    '## 0.9.0 (2026-10-30)',
    '',
    'Texts in three languages.'
  );

  it('reads each version under its heading, and leaves out what comes first', () => {
    expect(parseChangelog(sample)).toEqual([
      {
        blocks: [
          { kind: 'heading', level: 3, text: 'Added' },
          { items: ['A thing.'], kind: 'list' },
        ],
        version: UNRELEASED,
      },
      { blocks: [{ kind: 'paragraph', text: 'Texts in three languages.' }], date: '2026-10-30', version: '0.9.0' },
    ]);
  });

  it('reads no version from a text without any', () => {
    expect(parseChangelog(text('# Changelog', '', 'Nothing yet.'))).toEqual([]);
  });
});

describe("the project's CHANGELOG.md", () => {
  const releases = parseChangelog(CHANGELOG);
  const released = releases.filter((release) => release.version !== UNRELEASED);

  it('names each version once, with its day, Unreleased alone without one', () => {
    expect(released.length).toBeGreaterThan(0);
    expect(released.every((release) => VERSION.test(release.version) && DAY.test(release.date ?? ''))).toBe(true);
    expect(new Set(releases.map((release) => release.version)).size).toBe(releases.length);
    expect(releases.slice(1).some((release) => release.version === UNRELEASED)).toBe(false);
  });

  it('says something under every version, in the Markdown the site reads', () => {
    expect(releases.every((release) => release.blocks.length > 0)).toBe(true);
    const texts = releases.flatMap((release) =>
      release.blocks.flatMap((block) => (block.kind === 'list' ? block.items : [block.text]))
    );
    expect(texts.filter((line) => line.startsWith('#') || line.startsWith('- ') || line.includes('  '))).toEqual(
      []
    );
  });
});
