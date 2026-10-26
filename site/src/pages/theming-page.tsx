import { css } from '@jadis/core';
import { JlBadge, JlButton, JlCodeBlock, JlElement, JlInput } from 'jlib';
import { BASE_STYLES, TOKEN_STYLES } from 'jlib/styles/shared';

import { ACCENT_PRESETS, TOKEN_GROUPS } from '../docs/tokens';
import { accentCss, accentTokens } from '../lib/accent';
import { codeSample } from '../lib/blocks';
import { themeBus } from '../services/theme';
import { PROSE_STYLES } from '../styles/site-styles';
import guideStyles from './guide-page.css?raw';
import styles from './theming-page.css?raw';

import type { TokenDoc, TokenKind } from '../types/site.types';

const DARK_QUERY = '(prefers-color-scheme: dark)';
// Shown as code: the template literal a component writes to put the tokens before its own styles.
const TOKENS_FIRST = ['css`$', '{TOKEN_STYLES}$', '{styles}`'].join('');
const DEFAULT_ACCENT = ACCENT_PRESETS[0]?.colour ?? '#0c72b0';

const SWATCHES: Record<TokenKind, (name: string) => Node | null> = {
  colour: (name) => <span class="swatch colour" style={`background: var(${name})`} />,
  length: (name) => <span class="swatch length" style={`width: var(${name})`} />,
  radius: (name) => <span class="swatch radius" style={`border-radius: var(${name})`} />,
  shadow: (name) => <span class="swatch shadow" style={`box-shadow: var(${name})`} />,
  text: () => null,
};

/** A few components that show what a theme does: they read the tokens of the box they are in. */
const sample = (): Node => (
  <div class="sample">
    <div class="sample-row">
      <JlButton variant="primary" icon="plus" label="New project" />
      <JlButton label="Share" />
      <JlButton variant="ghost" label="Details" />
    </div>
    <JlInput icon="search" placeholder="Search projects" />
    <div class="sample-row">
      <JlBadge tone="accent" dot label="Running" />
      <JlBadge tone="ok" label="Published" />
      <JlBadge tone="warn" label="Expiring" />
      <JlBadge tone="danger" label="Failed" />
    </div>
  </div>
);

/** The design tokens with their live values, dark mode, and a live accent of your own. */
export class ThemingPage extends JlElement {
  static readonly selector = 'site-theming-page';

  private readonly _refs = this.useRefs((ref) => ({
    accentCode: ref<JlCodeBlock>('.accent-code'),
    picker: ref<HTMLInputElement>('.picker'),
    presets: ref('.presets'),
    preview: ref('.accent-preview'),
    tokens: ref('.tokens'),
  }));

  templateHtml(): Node {
    return (
      <article class="page">
        <header class="intro">
          <p class="label">Guide</p>
          <h1>Theming</h1>
          <p class="lead">
            Every colour, radius and size comes from a CSS custom property. Custom properties cross shadow roots,
            so one rule on the page restyles every component.
          </p>
        </header>

        <section>
          <h2>Overriding a token</h2>
          <p>
            The tokens are defined in the <code>jlib</code> cascade layer, adopted by the document when the first
            component registers. Any plain rule of yours wins over a layer, whatever the order of the stylesheets:
          </p>
          {codeSample(
            'css',
            `
            :root {
              --jl-radius-sm: 4px;
              --jl-font-sans: 'Inter', system-ui, sans-serif;
            }`
          )}
          <p>
            The same tokens exist as a plain stylesheet, for pages that want them before any script runs:{' '}
            <code>import 'jlib/tokens.css'</code>.
          </p>
        </section>

        <section>
          <h2>Your own accent</h2>
          <p>
            Pick a colour: the box below takes it, and the rule under it gives your whole app the same accent. The
            shades are mixed from the text and surface colours, so they also work in dark mode.
          </p>
          <div class="accent-tools">
            <fieldset class="presets" aria-label="Accent presets">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  type="button"
                  class="preset"
                  data-colour={preset.colour}
                  title={preset.label}
                  aria-label={preset.label}
                  style={`background: ${preset.colour}`}
                />
              ))}
            </fieldset>
            <label class="picker-label">
              <input class="picker" type="color" value={DEFAULT_ACCENT} />
              <span>Any colour</span>
            </label>
          </div>
          <div class="demo accent-preview">{sample()}</div>
          <JlCodeBlock class="accent-code" language="css" />
        </section>

        <section>
          <h2>Dark mode</h2>
          <p>
            The tokens follow the system's light or dark preference. To choose instead, set{' '}
            <code>data-theme="light"</code> or <code>data-theme="dark"</code> on the root element, or on any
            element: the theme then applies to that part of the page only, like the two boxes below.
          </p>
          <div class="pair">
            <div class="demo themed" data-theme="light">
              <p class="label">data-theme="light"</p>
              {sample()}
            </div>
            <div class="demo themed" data-theme="dark">
              <p class="label">data-theme="dark"</p>
              {sample()}
            </div>
          </div>
          {codeSample(
            'html',
            `
            <html data-theme="dark">
              …
              <aside data-theme="light">A light panel in a dark page</aside>
            </html>`
          )}
          <p>
            The document's rules do not reach inside shadow roots. To theme a part of your own component's shadow
            DOM, put the tokens in its styles first: <code>{TOKENS_FIRST}</code>, with <code>TOKEN_STYLES</code>{' '}
            imported from jlib.
          </p>
        </section>

        <section>
          <h2>One component</h2>
          <p>
            Tokens set on an element apply to it and to what it holds. For finer changes, components expose their
            main inner element as the <code>base</code> part:
          </p>
          {codeSample(
            'css',
            `
            .checkout jl-button {
              --jl-accent: #17784a;
            }

            jl-button.pill::part(base) {
              border-radius: 999px;
            }`
          )}
        </section>

        <section>
          <h2>Tokens</h2>
          <p>
            The values shown are the ones in effect on this page now; switch the theme in the top bar to see them
            change.
          </p>
          <div class="tokens" />
        </section>
      </article>
    );
  }

  templateCss(): string {
    // The tokens again, inside this shadow root: the document's rules cannot reach the data-theme boxes in here.
    return css`${TOKEN_STYLES}${BASE_STYLES}${PROSE_STYLES}${guideStyles}${styles}`;
  }

  onConnect(): void {
    document.title = 'Theming · jlib';
    this.applyAccent(DEFAULT_ACCENT);
    this.renderTokens();
    this.onBus(themeBus, 'changed', () => requestAnimationFrame(() => this.renderTokens()));
    window
      .matchMedia(DARK_QUERY)
      .addEventListener('change', () => this.renderTokens(), { signal: this.killSignal });
    this.on(this._refs.picker, 'input', () => this.applyAccent(this._refs.picker.value));
    this.on(this._refs.presets, 'click', (event) => {
      const colour = (event.target as HTMLElement).closest<HTMLElement>('[data-colour]')?.dataset.colour;
      if (colour !== undefined) {
        this._refs.picker.value = colour;
        this.applyAccent(colour);
      }
    });
  }

  private applyAccent(colour: string): void {
    const preview = this._refs.preview;
    for (const [name, value] of Object.entries(accentTokens(colour))) {
      preview.style.setProperty(name, value);
    }
    this._refs.accentCode.code.set(accentCss(colour));
    for (const preset of this._refs.presets.querySelectorAll<HTMLElement>('[data-colour]')) {
      preset.setAttribute('aria-pressed', String(preset.dataset.colour === colour));
    }
  }

  private renderTokens(): void {
    const computed = getComputedStyle(this);
    this._refs.tokens.replaceChildren(
      ...TOKEN_GROUPS.map((group) => (
        <div class="token-group">
          <h3>{group.label}</h3>
          <div class="table-wrap">
            <table>
              <tbody>{group.tokens.map((token) => this.tokenRow(token, computed))}</tbody>
            </table>
          </div>
        </div>
      ))
    );
  }

  private tokenRow(token: TokenDoc, computed: CSSStyleDeclaration): Node {
    return (
      <tr>
        <td class="swatch-cell">{SWATCHES[token.kind](token.name)}</td>
        <td>
          <code>{token.name}</code>
        </td>
        <td class="value">{computed.getPropertyValue(token.name).trim()}</td>
        <td>{token.description}</td>
      </tr>
    );
  }
}

ThemingPage.register();
