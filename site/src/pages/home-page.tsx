import { css } from '@jadis/core';
import { JlButton, JlCodeBlock, JlElement, JlIcon } from 'jlib';
import { BASE_STYLES } from 'jlib/styles/shared';

import { SiteLogo } from '../components/site-logo';
import { COMPONENT_DOCS, docsOfLevel, LEVEL_DESCRIPTIONS, LEVEL_LABELS, LEVELS } from '../docs/registry';
import { codeSample } from '../lib/blocks';
import { PROSE_STYLES } from '../styles/site-styles';
import styles from './home-page.css?raw';

const MAKER_LOGO_HEIGHT = 56;

const PRINCIPLES: readonly { icon: string; title: string; text: string }[] = [
  {
    icon: 'code',
    text: 'Custom elements and shadow DOM, through Jadis: no virtual DOM, no runtime to adopt. They work in any page and next to any framework.',
    title: 'Just the platform',
  },
  {
    icon: 'layers',
    text: 'Atoms are single elements, molecules combine a few for one job, organisms are sections with behaviour, templates lay them out.',
    title: 'Atomic design',
  },
  {
    icon: 'package',
    text: 'One ES module per component, declared free of side effects: an app ships the components it uses and nothing else.',
    title: 'Tree-shakeable',
  },
  {
    icon: 'list',
    text: 'Fields are form-associated: names, values, required, reset and disabled fieldsets work as with native inputs.',
    title: 'Forms that work',
  },
  {
    icon: 'palette',
    text: 'Every colour, radius and size is a CSS custom property. Light and dark follow the system, or any part of the page.',
    title: 'Themeable',
  },
  {
    icon: 'shield-check',
    text: 'Keyboard patterns, roles and labels, visible focus rings, and motion that respects reduced-motion settings.',
    title: 'Accessible',
  },
];

// A small screen of an app, written in HTML like a page would: every element is a jlib component.
const SHOWCASE_HTML = `
  <div class="showcase-head">
    <div>
      <p class="showcase-title">Production deploy</p>
      <p class="showcase-sub">main · a3f9c2e · 2 minutes ago</p>
    </div>
    <jl-badge tone="accent" dot label="Building"></jl-badge>
  </div>
  <jl-progress value="64" label="Uploading assets" show-value></jl-progress>
  <jl-field label="Environment">
    <jl-segmented value="production" block
      options='[{"value":"preview","label":"Preview"},{"value":"staging","label":"Staging"},{"value":"production","label":"Production"}]'>
    </jl-segmented>
  </jl-field>
  <jl-field label="Domain">
    <jl-input value="app.example.com" icon="globe"></jl-input>
  </jl-field>
  <jl-switch label="Tell the team when it is live" checked></jl-switch>
  <div class="showcase-actions">
    <jl-button label="Cancel"></jl-button>
    <jl-button variant="primary" icon="rocket" label="Deploy"></jl-button>
  </div>`;

const showcase = (): HTMLElement => {
  const card = <div class="showcase" />;
  card.innerHTML = SHOWCASE_HTML;
  return card;
};

/** The introduction: what jlib is, the ideas behind it, and where to go next. */
export class HomePage extends JlElement {
  static readonly selector = 'site-home-page';

  private readonly _refs = this.useRefs((ref) => ({
    browse: ref<JlButton>('.browse'),
    start: ref<JlButton>('.start'),
  }));

  templateHtml(): Node {
    return (
      <article class="page">
        <section class="hero">
          <div class="hero-text">
            <p class="label">{`Jadis · Web Components · ${COMPONENT_DOCS.length} components`}</p>
            <h1>Components that are just the platform.</h1>
            <p class="lead">
              jlib is a component library on Jadis and native Web Components. Tags that work in any page, typed
              classes for JSX, form fields that submit like native ones, and a bundle that holds only what you use.
            </p>
            <div class="cta">
              <JlButton class="start" variant="primary" size="lg" iconEnd="arrow-right" label="Get started" />
              <JlButton class="browse" size="lg" label="Browse components" />
            </div>
            <JlCodeBlock language="bash" code="npm install jlib @jadis/core" />
          </div>
          <div class="hero-demo">{showcase()}</div>
        </section>

        <section class="principles">
          {PRINCIPLES.map((principle) => (
            <div class="principle">
              <span class="principle-icon">
                <JlIcon name={principle.icon} size={18} />
              </span>
              <h3>{principle.title}</h3>
              <p>{principle.text}</p>
            </div>
          ))}
        </section>

        <section class="usage">
          <div class="usage-text">
            <h2>Write it as HTML, or as typed JSX</h2>
            <p>
              The same element either way. In HTML, attributes set the inputs and JSON carries lists. In JSX, the
              classes give you typed props and keep your bundle to what you reference.
            </p>
            <a href="#/getting-started">Read the guide</a>
          </div>
          <div class="usage-code">
            {codeSample(
              'html',
              `
              <jl-field label="Email" required>
                <jl-input name="email" type="email"></jl-input>
              </jl-field>
              <jl-button variant="primary" label="Subscribe"></jl-button>`,
              'index.html'
            )}
            {codeSample(
              'ts',
              `
              import { JlButton } from 'jlib';

              <JlButton variant="primary" icon="plus" label="New project" />`,
              'app.tsx'
            )}
          </div>
        </section>

        <section class="levels">
          <h2>Four levels</h2>
          <div class="level-grid">
            {LEVELS.map((level) => (
              <a class="level" href="#/components">
                <span class="level-count">{String(docsOfLevel(level).length)}</span>
                <span class="level-name">{LEVEL_LABELS[level]}</span>
                <span class="level-text">{LEVEL_DESCRIPTIONS[level]}</span>
              </a>
            ))}
          </div>
        </section>

        <section class="maker">
          <SiteLogo class="maker-logo" height={MAKER_LOGO_HEIGHT} />
          <div class="maker-text">
            <h2>Made by SyWare, free for everyone</h2>
            <p>
              jlib is the component library behind SyWare's own apps, and it carries their look. SyWare makes it
              for its products and shares it: use it in yours, change it, ship it. It is free, under the MIT
              licence.
            </p>
            <p class="maker-links">
              <a href="./syware-logo.svg" download="syware-logo.svg">
                SyWare logo (SVG)
              </a>
              <a href="./syware-logo-dark.svg" download="syware-logo-dark.svg">
                For dark backgrounds
              </a>
              <a href="./syware-mark.svg" download="syware-mark.svg">
                The mark alone
              </a>
            </p>
          </div>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${styles}`;
  }

  onConnect(): void {
    document.title = 'jlib · Web Components on Jadis';
    this._refs.start.events.register('press', () => {
      window.location.hash = '#/getting-started';
    });
    this._refs.browse.events.register('press', () => {
      window.location.hash = '#/components';
    });
  }
}

HomePage.register();
