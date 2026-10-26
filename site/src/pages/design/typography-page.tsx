import { css } from '@jadis/core';
import { JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { FONT_WEIGHTS, TYPE_SCALE } from '../../docs/design';
import { codeSample } from '../../lib/blocks';
import { designIntro, guideline } from '../../lib/design-blocks';
import { DESIGN_STYLES, PROSE_STYLES } from '../../styles/site-styles';

import type { TypeStep } from '../../types/design.types';

const PANGRAM = 'The quick brown fox jumps over the lazy dog. 0123456789';
const CODE_SAMPLE = 'const total = items.reduce((sum, item) => sum + item.price, 0);';

/** How a step of the scale is drawn: its own size, weight and line height. */
const stepStyle = (step: TypeStep): string =>
  [
    `font-size: ${step.size}px`,
    `font-weight: ${step.weight}`,
    `line-height: ${step.lineHeight}`,
    step.mono ? 'font-family: var(--jl-font-mono)' : '',
    step.caps ? 'text-transform: uppercase; letter-spacing: 0.08em' : '',
    step.muted ? 'color: var(--jl-muted)' : '',
    step.size >= 22 ? 'letter-spacing: -0.02em' : '',
  ]
    .filter((rule) => rule !== '')
    .join('; ');

/** The two families, the weights, and the type scale at its real sizes. */
export class TypographyPage extends JlElement {
  static readonly selector = 'site-typography-page';

  templateHtml(): Node {
    return (
      <article class="page">
        {designIntro(
          'Typography',
          'Two families: Manrope for the interface and its text, JetBrains Mono for code and data. A short scale, used the same way everywhere.'
        )}

        <section>
          <h2>Families</h2>
          <div class="specimens">
            <div class="specimen">
              <span class="specimen-glyph">Aa</span>
              <span class="specimen-name">Manrope</span>
              <p class="specimen-text">{PANGRAM}</p>
              <code>--jl-font-sans</code>
            </div>
            <div class="specimen mono">
              <span class="specimen-glyph">Aa</span>
              <span class="specimen-name">JetBrains Mono</span>
              <p class="specimen-text">{CODE_SAMPLE}</p>
              <code>--jl-font-mono</code>
            </div>
          </div>
          <p>
            Both are variable fonts, loaded by the page (the components only name them, and fall back to the system
            fonts). Code turns off JetBrains Mono's ligatures, so <code>{'=>'}</code> reads as typed.
          </p>
          {codeSample(
            'ts',
            `
            import '@fontsource-variable/manrope';
            import '@fontsource-variable/jetbrains-mono';`
          )}
        </section>

        <section>
          <h2>Weights</h2>
          <div class="weights">
            {FONT_WEIGHTS.map((entry) => (
              <div class="weight">
                <span class="weight-glyph" style={`font-weight: ${entry.weight}`}>
                  Ag
                </span>
                <span class="weight-label">{`${entry.weight} · ${entry.use}`}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Scale</h2>
          <div class="scale">
            {TYPE_SCALE.map((step) => (
              <div class="scale-row">
                <span class="scale-sample" style={stepStyle(step)}>
                  {step.sample}
                </span>
                <span class="scale-meta">
                  <strong>{step.name}</strong>
                  <span>{`${step.size}px · ${step.weight} · ${step.lineHeight}`}</span>
                  <span>{step.use}</span>
                  {step.token === undefined ? null : <code>{step.token}</code>}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Using type</h2>
          <div class="rules">
            {guideline(
              'do',
              '<span style="font-weight:650;font-size:17px">Invite people</span>',
              'Write titles, buttons and labels in sentence case.'
            )}
            {guideline(
              'dont',
              '<span style="font-weight:650;font-size:17px">Invite People To Your Team</span>',
              'Title Case or ALL CAPS: harder to read, and louder than it needs to be. Capitals are for the small group labels only.'
            )}
            {guideline(
              'do',
              '<span>Deployed <code style="font-family:var(--jl-font-mono);font-size:12.5px">a3f9c2e</code> at <span style="font-family:var(--jl-font-mono);font-size:12.5px">14:02</span></span>',
              'Set ids, hashes, times and keys in the mono family: they line up and read character by character.'
            )}
            {guideline(
              'dont',
              '<span style="font-weight:700">Deployed</span>&nbsp;<span style="font-weight:800">a3f9c2e</span>&nbsp;<span style="font-weight:600">at 14:02</span>',
              'Several weights in one line: one step of weight between levels is enough.'
            )}
          </div>
          <ul>
            <li>
              Body text is 14px with a line height of 1.55; long text stays under about 70 characters a line.
            </li>
            <li>Headings step down by size and one weight step, never by colour alone.</li>
            <li>Secondary text uses the muted ink, never a smaller size than 12px.</li>
          </ul>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${DESIGN_STYLES}`;
  }

  onConnect(): void {
    document.title = 'Typography · jlib';
  }
}

TypographyPage.register();
