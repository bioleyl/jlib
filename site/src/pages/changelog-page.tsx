import { css } from '@jadis/core';
import { JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import changelog from '../../../CHANGELOG.md?raw';
import { parseChangelog } from '../lib/changelog';
import { richText } from '../lib/pattern-blocks';
import { CHANGELOG_URL, PACKAGE_URL } from '../lib/project';
import { PROSE_STYLES } from '../styles/site-styles';
import styles from './changelog-page.css?inline';
import guideStyles from './guide-page.css?inline';

import type { MarkdownBlock, Release } from '../types/changelog.types';

const RELEASES = parseChangelog(changelog);
// The dates are days, written in UTC: read in the reader's zone, 2026-10-30 could show as the 29th.
const DATES = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' });

type BlockRenderers = { [K in MarkdownBlock['kind']]: (block: Extract<MarkdownBlock, { kind: K }>) => Node };

// Under a version, every heading is one of its parts (Added, Fixed…).
const BLOCKS: BlockRenderers = {
  heading: (block) => <h3>{richText(block.text)}</h3>,
  list: (block) => (
    <ul>
      {block.items.map((item) => (
        <li>{richText(item)}</li>
      ))}
    </ul>
  ),
  paragraph: (block) => <p>{richText(block.text)}</p>,
};

const changelogBlock = <K extends MarkdownBlock['kind']>(block: Extract<MarkdownBlock, { kind: K }>): Node =>
  (BLOCKS[block.kind] as (block: Extract<MarkdownBlock, { kind: K }>) => Node)(block);

const releaseDate = (date: string | undefined): Node | string =>
  date === undefined ? 'Next version' : <time dateTime={date}>{DATES.format(new Date(date))}</time>;

const release = (entry: Release): Node => (
  <section class="release">
    <header class="release-head">
      <h2>{entry.version}</h2>
      <span class="date">{releaseDate(entry.date)}</span>
    </header>
    {entry.blocks.map(changelogBlock)}
  </section>
);

/** What changed in each version, drawn from CHANGELOG.md as it is. */
export class ChangelogPage extends JlElement {
  static readonly selector = 'site-changelog-page';

  templateHtml(): Node {
    return (
      <article class="page">
        <header class="intro">
          <p class="label">Guide</p>
          <h1>Changelog</h1>
          <p class="lead">
            What changed in each version of jlib, the newest first, and what to look at when an app updates. The
            site follows the source: what is under Unreleased is on its pages already, and reaches npm with the
            next version.
          </p>
          <p>
            The package is{' '}
            <a href={PACKAGE_URL} target="_blank" rel="noopener">
              @syware/jlib on npm
            </a>
            ; this page is{' '}
            <a href={CHANGELOG_URL} target="_blank" rel="noopener">
              CHANGELOG.md
            </a>{' '}
            in the repository.
          </p>
        </header>
        {RELEASES.map(release)}
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${guideStyles}${styles}`;
  }

  onConnect(): void {
    document.title = 'Changelog · jlib';
  }
}

ChangelogPage.register();
