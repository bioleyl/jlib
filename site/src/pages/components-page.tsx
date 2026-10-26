import { css } from '@jadis/core';
import { JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { COMPONENT_DOCS, docRoute, docsOfLevel, LEVEL_DESCRIPTIONS, LEVEL_LABELS, LEVELS } from '../docs/registry';
import { pageHref } from '../services/navigation';
import { PROSE_STYLES } from '../styles/site-styles';
import styles from './components-page.css?raw';

/** Every component, by atomic level, each a card that opens its page. */
export class ComponentsPage extends JlElement {
  static readonly selector = 'site-components-page';

  templateHtml(): Node {
    return (
      <article class="page">
        <header class="intro">
          <p class="label">{`${COMPONENT_DOCS.length} components`}</p>
          <h1>Components</h1>
          <p class="lead">
            Organised in atomic design: atoms are single elements, molecules combine a few atoms for one job,
            organisms are whole sections with behaviour, and templates lay out the rest.
          </p>
        </header>
        {LEVELS.map((level) => (
          <section class="level">
            <div class="level-head">
              <h2>{LEVEL_LABELS[level]}</h2>
              <span class="count">{String(docsOfLevel(level).length)}</span>
            </div>
            <p>{LEVEL_DESCRIPTIONS[level]}</p>
            <div class="grid">
              {docsOfLevel(level).map((doc) => (
                <a class="tile" href={pageHref(docRoute(doc))}>
                  <span class="tile-name">{doc.name}</span>
                  <span class="tile-summary">{doc.summary}</span>
                  <code class="tile-tag">{`<${doc.tag}>`}</code>
                </a>
              ))}
            </div>
          </section>
        ))}
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${styles}`;
  }

  onConnect(): void {
    document.title = 'Components · jlib';
  }
}

ComponentsPage.register();
