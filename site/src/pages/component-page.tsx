import { css } from '@jadis/core';
import { JlBadge, JlCodeBlock, JlElement, JlIcon } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { SiteApi } from '../components/site-api';
import { SiteExample } from '../components/site-example';
import { SitePlayground } from '../components/site-playground';
import { COMPONENT_DOCS, docBySlug, docRoute, LEVEL_SINGULAR } from '../docs/registry';
import { importSnippet } from '../lib/snippets';
import { pageHref } from '../services/navigation';
import { EXAMPLE_STYLES, PROSE_STYLES } from '../styles/site-styles';
import styles from './component-page.css?raw';

import type { ComponentDoc } from '../types/docs.types';

const paragraphs = (text: string | undefined): Node[] =>
  (text ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '')
    .map((paragraph) => <p>{paragraph}</p>);

function pagerLink(doc: ComponentDoc | undefined, direction: 'previous' | 'next'): Node {
  if (doc === undefined) {
    return <span />;
  }
  return (
    <a class={`pager-link ${direction}`} href={pageHref(docRoute(doc))}>
      <span class="label">{direction === 'previous' ? 'Previous' : 'Next'}</span>
      <span class="pager-name">
        {direction === 'previous' ? <JlIcon name="arrow-left" size={15} /> : null}
        {doc.name}
        {direction === 'next' ? <JlIcon name="arrow-right" size={15} /> : null}
      </span>
    </a>
  );
}

/** The page of one component, made from its documentation: intro, playground, examples, then the API. */
export class ComponentPage extends JlElement {
  static readonly selector = 'site-component-page';

  /** The component's slug, from the route: `button` for `jl-button`. */
  readonly name = this.useChange('', (slug) => this.render(slug), { attribute: 'name' });

  private readonly _refs = this.useRefs((ref) => ({ page: ref('.page') }));

  templateHtml(): Node {
    return <div class="page" />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${EXAMPLE_STYLES}${styles}`;
  }

  private render(slug: string): void {
    const doc = docBySlug(slug);
    if (doc === undefined) {
      this._refs.page.replaceChildren(this.missing(slug));
      return;
    }
    document.title = `${doc.name} · jlib`;
    this._refs.page.replaceChildren(this.article(doc));
  }

  private article(doc: ComponentDoc): Node {
    const index = COMPONENT_DOCS.indexOf(doc);
    return (
      <article>
        <header class="intro">
          <div class="kicker">
            <JlBadge label={LEVEL_SINGULAR[doc.level]} tone="accent" />
            <code>{`<${doc.tag}>`}</code>
          </div>
          <h1>{doc.name}</h1>
          <p class="lead">{doc.summary}</p>
          {paragraphs(doc.description)}
          <JlCodeBlock language="ts" code={importSnippet(doc.className)} />
          <p class="define-hint">
            Writing <code>{`<${doc.tag}>`}</code> in HTML without using the class in your code? Also call{' '}
            <code>{`define(${doc.className})`}</code>, or the bundler drops it.{' '}
            <a href={pageHref('/getting-started')}>Why</a>
          </p>
        </header>
        <section class="block">
          <h2>Playground</h2>
          <SitePlayground doc={doc} />
        </section>
        <section class="block">
          <h2>Examples</h2>
          {doc.examples.map((example) => (
            <SiteExample example={example} />
          ))}
        </section>
        <section class="block">
          <h2>API</h2>
          <SiteApi doc={doc} />
        </section>
        <nav class="pager" aria-label="Components">
          {pagerLink(COMPONENT_DOCS[index - 1], 'previous')}
          {pagerLink(COMPONENT_DOCS[index + 1], 'next')}
        </nav>
      </article>
    );
  }

  private missing(slug: string): Node {
    return (
      <article>
        <h1>No such component</h1>
        <p class="lead">
          There is no component called <code>{slug}</code>. <a href={pageHref('/components')}>See them all</a>.
        </p>
      </article>
    );
  }
}

ComponentPage.register();
