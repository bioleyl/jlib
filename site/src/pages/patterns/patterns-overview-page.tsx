import { css } from '@jadis/core';
import { JlElement, JlIcon } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { PATTERNS, PATTERNS_SECTION, UX_PRINCIPLES } from '../../docs/patterns';
import { sectionIntro } from '../../lib/design-blocks';
import { pageHref } from '../../services/navigation';
import { DESIGN_STYLES, PROSE_STYLES } from '../../styles/site-styles';
import styles from './patterns-overview-page.css?raw';

const CARD_ICON_SIZE = 18;
const NUMBER_DIGITS = 2;

/** The front page of the UX patterns: the principles, a card for each pattern, and how to use them. */
export class PatternsOverviewPage extends JlElement {
  static readonly selector = 'site-patterns-overview-page';

  templateHtml(): Node {
    return (
      <article class="page">
        {sectionIntro(
          PATTERNS_SECTION,
          'How SyWare apps behave',
          'The design system says how the apps look; these patterns say how they behave: where things are, what happens when people act, and what the words mean. Every app follows them, so the next one feels familiar before it is opened.'
        )}

        <section>
          <h2>Principles</h2>
          <div class="cards">
            {UX_PRINCIPLES.map((principle, index) => (
              <div class="principle">
                <span class="principle-number">{String(index + 1).padStart(NUMBER_DIGITS, '0')}</span>
                <h3>{principle.title}</h3>
                <p>{principle.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Patterns</h2>
          <p>
            Each pattern answers a question that every app meets, with the jlib components that do the work. They
            build on the <a href={pageHref('/design')}>design system</a>: its colours, its words and its
            accessibility rules hold here too.
          </p>
          <div class="patterns">
            {PATTERNS.map((pattern) => (
              <a class="pattern" href={pageHref(pattern.path)}>
                <span class="pattern-icon">
                  <JlIcon name={pattern.icon} size={CARD_ICON_SIZE} />
                </span>
                <span class="pattern-name">{pattern.title}</span>
                <span class="pattern-summary">{pattern.summary}</span>
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2>Using them</h2>
          <ul>
            <li>
              <strong>Building a screen:</strong> start from the pattern of its job (a list, a form, a queue), then
              go through the <a href={pageHref('/patterns/checklist')}>checklist</a>.
            </li>
            <li>
              <strong>Reviewing one:</strong> the checklist again, with the app open on a computer and on a phone,
              in both themes.
            </li>
            <li>
              <strong>Meeting a case they do not cover:</strong> solve it in the app, then write it here, so the
              next app solves it the same way.
            </li>
            <li>
              <strong>Something generic missing from jlib:</strong> it belongs in jlib, not in the app.
            </li>
          </ul>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${DESIGN_STYLES}${styles}`;
  }

  onConnect(): void {
    document.title = `${PATTERNS_SECTION} · jlib`;
  }
}

PatternsOverviewPage.register();
