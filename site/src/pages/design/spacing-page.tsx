import { css } from '@jadis/core';
import { JlButton, JlElement, JlInput, JlSelect } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { SPACE_SCALE } from '../../docs/design';
import { codeSample } from '../../lib/blocks';
import { designIntro } from '../../lib/design-blocks';
import { DESIGN_STYLES, PROSE_STYLES } from '../../styles/site-styles';

import type { ControlSize } from '@syware/jlib';

const CONTROL_HEIGHTS: readonly { size: ControlSize; px: number; token: string }[] = [
  { px: 30, size: 'sm', token: '--jl-control-sm' },
  { px: 36, size: 'md', token: '--jl-control-md' },
  { px: 44, size: 'lg', token: '--jl-control-lg' },
];

const WIDTHS: readonly { what: string; value: string }[] = [
  { value: '820px', what: 'Reading: guides, forms, settings' },
  { value: '980px', what: 'A component page, a design page' },
  { value: '1120px', what: 'Galleries and landing pages' },
  { value: '440px', what: 'A form column inside a wider page' },
];

const CONTAINERS: readonly { what: string; value: string }[] = [
  { value: '960px', what: 'App shell: the navigation becomes a drawer' },
  { value: '720px', what: 'Navbar: the links fold into a menu' },
  { value: '560px', what: 'Steps: only the current step keeps its text' },
  { value: '420px', what: 'Horizontal field: the label goes above' },
];

const pairTable = (title: string, rows: readonly { what: string; value: string }[]): Node => (
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>{title}</th>
          <th>Width</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr>
            <td>{row.what}</td>
            <td>
              <code>{row.value}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** The spacing scale, the heights of controls, and the widths and breakpoints of layouts. */
export class SpacingPage extends JlElement {
  static readonly selector = 'site-spacing-page';

  templateHtml(): Node {
    return (
      <article class="page">
        {designIntro(
          'Spacing and layout',
          'Space comes in steps of a 4px grid, controls in three heights, and components adapt to the room they are given rather than to the window.'
        )}

        <section>
          <h2>Spacing scale</h2>
          <p>
            The components follow these steps inside. For the layouts you build around them, the same steps are
            tokens: <code>gap: var(--jl-space-4)</code>.
          </p>
          <div class="space-rows">
            {SPACE_SCALE.map((step) => (
              <div class="space-row">
                <code>{step.token}</code>
                <span class="space-px">{`${step.px}px`}</span>
                <span class="space-bar" style={`width: ${step.px}px`} />
                <span class="space-use">{step.use}</span>
              </div>
            ))}
          </div>
          <p>
            Related things sit close, groups further apart: a label is 6px above its field, fields 16px apart, the
            sections of a form 32px, the sections of a page 48px.
          </p>
        </section>

        <section>
          <h2>Control heights</h2>
          <p>
            Buttons, fields, selects and segmented controls share three heights, so a row of mixed controls lines
            up.
            <code>md</code> is the default; <code>sm</code> for dense panels and toolbars, <code>lg</code> where a
            thumb presses it.
          </p>
          <div class="heights">
            {CONTROL_HEIGHTS.map((height) => (
              <div class="height-row">
                <span class="scale-meta">
                  <strong>{`${height.size} · ${height.px}px`}</strong>
                  <code>{height.token}</code>
                </span>
                <div class="height-controls">
                  <JlButton size={height.size} variant="primary" label="Save" />
                  <JlInput size={height.size} placeholder="Search" icon="search" />
                  <JlSelect
                    size={height.size}
                    value="week"
                    options={[
                      { label: 'This week', value: 'week' },
                      { label: 'This month', value: 'month' },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Widths</h2>
          {pairTable('Page or column', WIDTHS)}
        </section>

        <section>
          <h2>Responsive components</h2>
          <p>
            Components respond to their own width, with container queries, not to the window: a navbar folds its
            links whether it is in a phone or in a narrow side panel of a large screen.
          </p>
          {pairTable('Component', CONTAINERS)}
          {codeSample(
            'css',
            `
            .toolbar {
              display: flex;
              flex-wrap: wrap;
              gap: var(--jl-space-2);
              padding: var(--jl-space-3) var(--jl-space-4);
            }`
          )}
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${DESIGN_STYLES}`;
  }

  onConnect(): void {
    document.title = 'Spacing and layout · jlib';
  }
}

SpacingPage.register();
