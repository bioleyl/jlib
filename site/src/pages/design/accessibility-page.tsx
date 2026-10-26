import { css } from '@jadis/core';
import { JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { KEY_PATTERNS } from '../../docs/design';
import { codeSample } from '../../lib/blocks';
import { contrastLevel, contrastRatio, parseColour } from '../../lib/contrast';
import { designIntro } from '../../lib/design-blocks';
import { pageHref } from '../../services/navigation';
import { themeBus } from '../../services/theme';
import { DESIGN_STYLES, PROSE_STYLES } from '../../styles/site-styles';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const PAIRS: readonly { label: string; fg: string; bg: string; note: string }[] = [
  { bg: '--jl-surface', fg: '--jl-text', label: 'Text', note: 'Body text and headings.' },
  { bg: '--jl-surface', fg: '--jl-muted', label: 'Muted text', note: 'The lightest ink allowed for text.' },
  {
    bg: '--jl-surface',
    fg: '--jl-faint',
    label: 'Faint',
    note: 'Icons and decorations only: 3:1 is enough for them.',
  },
  { bg: '--jl-surface', fg: '--jl-accent', label: 'Accent text', note: 'Links, ghost buttons.' },
  { bg: '--jl-accent', fg: '--jl-on-accent', label: 'On accent', note: 'Primary buttons.' },
  { bg: '--jl-danger-soft', fg: '--jl-danger', label: 'Danger on its ground', note: 'Error badges and alerts.' },
  { bg: '--jl-warn-soft', fg: '--jl-warn', label: 'Warn on its ground', note: 'Warning badges and alerts.' },
];

/** Contrast measured live, keyboard patterns, focus, screen readers and motion. */
export class AccessibilityPage extends JlElement {
  static readonly selector = 'site-accessibility-page';

  private readonly _refs = this.useRefs((ref) => ({ pairs: ref('.pairs') }));

  templateHtml(): Node {
    return (
      <article class="page">
        {designIntro(
          'Accessibility',
          'Built in, not added later: readable contrast in both themes, every action reachable with the keyboard, a visible focus, names for screen readers, and motion that respects the system.'
        )}

        <section>
          <h2>Contrast</h2>
          <p>
            Text reaches at least 4.5:1 against its ground (WCAG AA), in light and in dark. The ratios below are
            measured now, in the theme this page shows: switch it in the top bar to see the other.
          </p>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Sample</th>
                  <th>Ratio</th>
                  <th>Use</th>
                </tr>
              </thead>
              <tbody class="pairs">
                {PAIRS.map((pair) => (
                  <tr data-fg={pair.fg} data-bg={pair.bg}>
                    <td>
                      <strong>{pair.label}</strong>
                    </td>
                    <td>
                      <span
                        class="contrast-sample"
                        style={`color: var(${pair.fg}); background: var(${pair.bg}); padding: 4px 10px; border-radius: var(--jl-radius-xs); font-weight: 600`}>
                        Aa
                      </span>
                    </td>
                    <td>
                      <code class="contrast-ratio" />
                    </td>
                    <td>{pair.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Keyboard</h2>
          <p>
            Everything a pointer can do, the keyboard can do. Tab moves between components; inside a composite one
            (tabs, a menu, a tree) the arrows move and only the current item is in the Tab order.
          </p>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Components</th>
                  <th>Keys</th>
                </tr>
              </thead>
              <tbody>
                {KEY_PATTERNS.map((pattern) => (
                  <tr>
                    <td>
                      <strong>{pattern.components}</strong>
                    </td>
                    <td>{pattern.keys}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Focus</h2>
          <p>
            The focused element shows a ring for the keyboard (<code>:focus-visible</code>). Dialogs, drawers and
            popovers move the focus in when they open and give it back to what opened them when they close.
          </p>
        </section>

        <section>
          <h2>Screen readers</h2>
          <ul>
            <li>
              Components carry their roles and states (<code>aria-expanded</code>, <code>aria-selected</code>,{' '}
              <code>aria-checked</code>…) on their inner elements.
            </li>
            <li>
              A button with only an icon needs a <code>hint</code>: it is its tooltip and its name.
            </li>
            <li>
              An icon is decorative unless it has a <code>label</code>; give it one only when no text says the
              same.
            </li>
            <li>Toasts and field errors are announced through live regions.</li>
            <li>
              A field without a visible label takes a <code>label</code>; inside <code>jl-field</code> it gets the
              field's label.
            </li>
          </ul>
          {codeSample(
            'html',
            `
            <jl-button icon="trash" hint="Delete the project" variant="danger"></jl-button>
            <jl-input icon="search" label="Search projects" placeholder="Search"></jl-input>`
          )}
          <div class="note">
            A known limit of shadow DOM: an id cannot point from one shadow root into another, so a field's hint
            and error are not yet linked to its inner input as a description. The input is marked invalid, and the
            error is announced.
          </div>
        </section>

        <section>
          <h2>Motion</h2>
          <p>
            With <code>prefers-reduced-motion: reduce</code>, transitions and animations become instant; only the
            spinner keeps turning, slowly. See <a href={pageHref('/design/motion')}>Motion</a>.
          </p>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${DESIGN_STYLES}`;
  }

  onConnect(): void {
    document.title = 'Accessibility · jlib';
    this.measure();
    this.onBus(themeBus, 'changed', () => requestAnimationFrame(() => this.measure()));
    window.matchMedia(DARK_QUERY).addEventListener('change', () => this.measure(), { signal: this.killSignal });
  }

  /** Writes the contrast of each pair, from the colours its sample shows now. */
  private measure(): void {
    for (const row of this._refs.pairs.querySelectorAll<HTMLElement>('tr')) {
      const sample = row.querySelector<HTMLElement>('.contrast-sample');
      const output = row.querySelector('.contrast-ratio');
      if (sample === null || output === null) {
        continue;
      }
      const style = getComputedStyle(sample);
      const fg = parseColour(style.color);
      const bg = parseColour(style.backgroundColor);
      if (fg === null || bg === null) {
        continue;
      }
      const ratio = contrastRatio(fg, bg);
      output.textContent = `${ratio.toFixed(1)}:1 ${contrastLevel(ratio)}`;
    }
  }
}

AccessibilityPage.register();
