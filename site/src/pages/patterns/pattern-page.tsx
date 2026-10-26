import { css } from '@jadis/core';
import { JlElement, JlIcon } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { PATTERNS, PATTERNS_OVERVIEW, PATTERNS_PATH, PATTERNS_SECTION, patternBySlug } from '../../docs/patterns';
import { docBySlug, docRoute } from '../../docs/registry';
import { sectionIntro } from '../../lib/design-blocks';
import { patternBlock } from '../../lib/pattern-blocks';
import { pageHref } from '../../services/navigation';
import { DESIGN_STYLES, EXAMPLE_STYLES, PROSE_STYLES } from '../../styles/site-styles';
import styles from './pattern-page.css?raw';

import type { PatternDoc } from '../../types/patterns.types';
import type { GuideLink } from '../../types/site.types';

const TAG_PREFIX = /^jl-/;
const PAGER_ICON_SIZE = 15;

type Direction = 'previous' | 'next';

const DIRECTION_LABELS: Record<Direction, string> = { next: 'Next', previous: 'Previous' };

function pagerLink(page: GuideLink | undefined, direction: Direction): Node {
  if (page === undefined) {
    return <span />;
  }
  return (
    <a class={`pager-link ${direction}`} href={pageHref(page.path)}>
      <span class="label">{DIRECTION_LABELS[direction]}</span>
      <span class="pager-name">
        {direction === 'previous' ? <JlIcon name="arrow-left" size={PAGER_ICON_SIZE} /> : null}
        {page.label}
        {direction === 'next' ? <JlIcon name="arrow-right" size={PAGER_ICON_SIZE} /> : null}
      </span>
    </a>
  );
}

/** The components a pattern names, linked to their pages; a tag without a page is left out. */
function componentLinks(tags: readonly string[]): Node | null {
  const docs = tags.flatMap((tag) => docBySlug(tag.replace(TAG_PREFIX, '')) ?? []);
  if (docs.length === 0) {
    return null;
  }
  return (
    <section>
      <h2>Components</h2>
      <div class="component-links">
        {docs.map((doc) => (
          <a class="component-link" href={pageHref(docRoute(doc))}>
            {doc.name}
            <code>{`<${doc.tag}>`}</code>
          </a>
        ))}
      </div>
    </section>
  );
}

/** A page of the UX patterns, drawn from its doc: the intro, its sections, the components, and the pager. */
export class PatternPage extends JlElement {
  static readonly selector = 'site-pattern-page';

  /** The pattern's slug, from the route: `forms` for `/patterns/forms`. */
  readonly name = this.useChange('', (slug) => this.render(slug), { attribute: 'name' });

  private readonly _refs = this.useRefs((ref) => ({ page: ref('.page') }));

  templateHtml(): Node {
    return <div class="page" />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${EXAMPLE_STYLES}${DESIGN_STYLES}${styles}`;
  }

  private render(slug: string): void {
    const pattern = patternBySlug(slug);
    if (pattern === undefined) {
      this._refs.page.replaceChildren(this.missing(slug));
      return;
    }
    document.title = `${pattern.title} · ${PATTERNS_SECTION} · jlib`;
    this._refs.page.replaceChildren(this.article(pattern));
  }

  private article(pattern: PatternDoc): Node {
    const index = PATTERNS.indexOf(pattern);
    return (
      <article>
        {sectionIntro(PATTERNS_SECTION, pattern.title, pattern.lead)}
        {pattern.sections.map((part) => (
          <section>
            <h2>{part.heading}</h2>
            {part.blocks.map((block) => patternBlock(block))}
          </section>
        ))}
        {componentLinks(pattern.components)}
        <nav class="pager" aria-label={PATTERNS_SECTION}>
          {pagerLink(index === 0 ? PATTERNS_OVERVIEW : PATTERNS[index - 1], 'previous')}
          {pagerLink(PATTERNS[index + 1], 'next')}
        </nav>
      </article>
    );
  }

  private missing(slug: string): Node {
    document.title = `${PATTERNS_SECTION} · jlib`;
    return (
      <article>
        <h1>No such pattern</h1>
        <p class="lead">
          There is no pattern called <code>{slug}</code>. <a href={pageHref(PATTERNS_PATH)}>See them all</a>.
        </p>
      </article>
    );
  }
}

PatternPage.register();
