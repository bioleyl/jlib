import { css } from '@jadis/core';
import { JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { ELEVATIONS, RADII } from '../../docs/design';
import { designIntro, guideline } from '../../lib/design-blocks';
import { DESIGN_STYLES, PROSE_STYLES } from '../../styles/site-styles';

const LINES: readonly { token: string; use: string }[] = [
  { token: '--jl-line', use: 'Between sections, around cards and panels.' },
  { token: '--jl-line-soft', use: 'Between the rows of a table or a list.' },
  { token: '--jl-line-strong', use: 'Around the controls people type in or press.' },
];

/** How an elevation is drawn: flat ones only by their line, floating ones by their shadow. */
const elevationStyle = (token: string): string => (token.startsWith('--') ? `box-shadow: var(${token})` : '');

/** Radii, lines, elevation and the focus ring. */
export class ShapePage extends JlElement {
  static readonly selector = 'site-shape-page';

  templateHtml(): Node {
    return (
      <article class="page">
        {designIntro(
          'Shape and depth',
          'Soft corners that grow with the size of a surface, lines that separate, and shadows kept for the few things that float over the page.'
        )}

        <section>
          <h2>Radii</h2>
          <div class="radii">
            {RADII.map((radius) => (
              <div class="radius">
                <span class="radius-box" style={`border-radius: var(${radius.token})`} />
                <code>{radius.token}</code>
                <span class="radius-use">{radius.use}</span>
              </div>
            ))}
          </div>
          <p>A surface inside another takes a smaller radius than its frame, so their corners run parallel.</p>
        </section>

        <section>
          <h2>Lines</h2>
          <div class="lines">
            {LINES.map((line) => (
              <div class="line-sample">
                <code>{line.token}</code>
                <span class="line-bar" style={`--line: var(${line.token})`} />
                <span class="swatch-use">{line.use}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Elevation</h2>
          <p>
            Three levels only. Most of an interface is flat; a shadow means the thing floats and will go away
            again.
          </p>
          <div class="elevations">
            {ELEVATIONS.map((elevation) => (
              <div class="elevation" style={elevationStyle(elevation.token)}>
                <span class="elevation-level">{`Level ${elevation.level}`}</span>
                <span class="elevation-name">{elevation.name}</span>
                <p>{elevation.use}</p>
                <code>{elevation.token}</code>
              </div>
            ))}
          </div>
          <div class="rules">
            {guideline(
              'do',
              '<div style="width:100%;padding:16px;border:1px solid var(--jl-line);border-radius:var(--jl-radius-lg);background:var(--jl-surface)"><strong>Billing</strong><p style="color:var(--jl-muted);font-size:13px">Plan, invoices and payment method.</p></div>',
              'Separate a card from the page with a line.'
            )}
            {guideline(
              'dont',
              '<div style="width:100%;padding:16px;border-radius:var(--jl-radius-lg);background:var(--jl-surface);box-shadow:var(--jl-shadow-lg)"><strong>Billing</strong><p style="color:var(--jl-muted);font-size:13px">Plan, invoices and payment method.</p></div>',
              'A shadow on a card that does not float: it looks like it can be moved, or is about to close.'
            )}
          </div>
        </section>

        <section>
          <h2>Focus ring</h2>
          <p>
            Whatever has the keyboard focus shows a ring in the brand blue, three pixels wide, outside its border.
            It shows for the keyboard only (<code>:focus-visible</code>), never for a mouse click.
          </p>
          <div class="focus-demo">
            <span class="fake-focus">Focused button</span>
            <code>--jl-focus-ring</code>
          </div>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${DESIGN_STYLES}`;
  }

  onConnect(): void {
    document.title = 'Shape and depth · jlib';
  }
}

ShapePage.register();
