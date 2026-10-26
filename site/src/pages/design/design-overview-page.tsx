import { css } from '@jadis/core';
import { JlElement, JlIcon } from 'jlib';
import { BASE_STYLES } from 'jlib/styles/shared';

import { SiteLogo } from '../../components/site-logo';
import { DESIGN_PAGES, PRINCIPLES } from '../../docs/design';
import { designIntro } from '../../lib/design-blocks';
import { pageHref } from '../../services/navigation';
import { DESIGN_STYLES, PROSE_STYLES } from '../../styles/site-styles';
import styles from './design-overview-page.css?raw';

const PREVIEW_SWATCHES = [
  '--jl-text',
  '--jl-muted',
  '--jl-line',
  '--jl-accent',
  '--jl-ok',
  '--jl-warn',
  '--jl-danger',
];
const PREVIEW_ICONS = ['house', 'search', 'bell', 'settings', 'user'];
const PREVIEW_MARK_HEIGHT = 48;

/** A small picture of each foundation, for its card on the overview. */
const PREVIEWS: Record<string, () => Node> = {
  '/design/accessibility': () => <span class="preview-text">5.2 : 1</span>,
  '/design/colour': () => (
    <span class="preview-swatches">
      {PREVIEW_SWATCHES.map((token) => (
        <span style={`background: var(${token})`} />
      ))}
    </span>
  ),
  '/design/icons': () => (
    <span class="preview-icons">
      {PREVIEW_ICONS.map((name) => (
        <JlIcon name={name} size={18} />
      ))}
    </span>
  ),
  '/design/logo': () => <SiteLogo variant="mark" height={PREVIEW_MARK_HEIGHT} />,
  '/design/motion': () => (
    <span class="preview-motion">
      <span />
    </span>
  ),
  '/design/shape': () => (
    <span class="preview-radii">
      <span />
      <span />
      <span />
    </span>
  ),
  '/design/spacing': () => (
    <span class="preview-bars">
      <span style="width: 12px" />
      <span style="width: 24px" />
      <span style="width: 48px" />
    </span>
  ),
  '/design/typography': () => (
    <span class="preview-type">
      Aa <code>Aa</code>
    </span>
  ),
  '/design/writing': () => <span class="preview-text">“Save changes”</span>,
};

/** The design system's front page: the principles, and a card for each foundation. */
export class DesignOverviewPage extends JlElement {
  static readonly selector = 'site-design-overview-page';

  templateHtml(): Node {
    const foundations = DESIGN_PAGES.filter((page) => page.path !== '/design');
    return (
      <article class="page">
        {designIntro(
          'The design system',
          'The look of swai, swcode and jlib, written down: the principles, the foundations every component is built on, and the rules that keep an interface readable for everyone.'
        )}

        <section>
          <h2>Principles</h2>
          <div class="cards">
            {PRINCIPLES.map((principle, index) => (
              <div class="principle">
                <span class="principle-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{principle.title}</h3>
                <p>{principle.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Foundations</h2>
          <p>
            Every value below is a design token, a CSS custom property that the components read. Change one and
            every component follows: see <a href={pageHref('/theming')}>Theming</a>.
          </p>
          <div class="foundations">
            {foundations.map((page) => (
              <a class="foundation" href={pageHref(page.path)}>
                <span class="foundation-preview">{PREVIEWS[page.path]?.() ?? null}</span>
                <span class="foundation-name">{page.label}</span>
                <span class="foundation-summary">{page.summary}</span>
              </a>
            ))}
          </div>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${DESIGN_STYLES}${styles}`;
  }

  onConnect(): void {
    document.title = 'Design system · jlib';
  }
}

DesignOverviewPage.register();
