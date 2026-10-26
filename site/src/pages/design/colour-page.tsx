import { css } from '@jadis/core';
import { JlBadge, JlElement } from 'jlib';
import { BASE_STYLES, TOKEN_STYLES } from 'jlib/styles/shared';

import { COLOUR_FAMILIES } from '../../docs/design';
import { contrastLevel, contrastRatio, hexOf, parseColour } from '../../lib/contrast';
import { designIntro, guideline } from '../../lib/design-blocks';
import { DESIGN_STYLES, PROSE_STYLES } from '../../styles/site-styles';

import type { Tone } from 'jlib';
import type { ColourRole } from '../../types/design.types';

const THEMES = ['light', 'dark'] as const;
const TONE_LIST: readonly Tone[] = ['neutral', 'accent', 'ok', 'warn', 'danger', 'info'];

/** One theme's half of a swatch: the colour, then its value and its contrast, measured once drawn. */
const half = (role: ColourRole, theme: (typeof THEMES)[number]): Node => (
  <div class="half" data-theme={theme}>
    <span class="fill" style={`background: var(${role.token})`} />
    {role.against === undefined ? null : <span class="probe" style={`background: var(${role.against})`} />}
    <span class="half-meta">
      <span class="hex" />
      <span class="ratio" />
    </span>
  </div>
);

const swatch = (role: ColourRole): Node => (
  <div class="swatch">
    <div class="halves">{THEMES.map((theme) => half(role, theme))}</div>
    <div class="swatch-info">
      <span class="swatch-name">{role.name}</span>
      <code>{role.token}</code>
      <span class="swatch-use">{role.use}</span>
    </div>
  </div>
);

/** Reads the colours each half shows, and writes their value and contrast under them. */
function measure(halfElement: HTMLElement): void {
  const fill = halfElement.querySelector<HTMLElement>('.fill');
  const probe = halfElement.querySelector<HTMLElement>('.probe');
  const colour = fill === null ? null : parseColour(getComputedStyle(fill).backgroundColor);
  const hex = halfElement.querySelector('.hex');
  const ratio = halfElement.querySelector<HTMLElement>('.ratio');
  if (colour === null || hex === null || ratio === null) {
    return;
  }
  hex.textContent = hexOf(colour);
  // The probe is hidden: its colour still computes, which is all the contrast needs.
  const against = probe === null ? null : parseColour(getComputedStyle(probe).backgroundColor);
  if (against === null) {
    return;
  }
  const value = contrastRatio(colour, against);
  const level = contrastLevel(value);
  ratio.textContent = `${value.toFixed(1)}:1 ${level}`;
  ratio.dataset.level = level;
}

/** The palette, its light and dark values side by side with their contrast, and how to use it. */
export class ColourPage extends JlElement {
  static readonly selector = 'site-colour-page';

  templateHtml(): Node {
    return (
      <article class="page">
        {designIntro(
          'Colour',
          'Ink and white for nearly everything, one blue for what is live or selected, and three colours that each mean one thing. Each swatch shows its light value, then its dark one, with the contrast it is read at.'
        )}

        {COLOUR_FAMILIES.map((family) => (
          <section>
            <h2>{family.label}</h2>
            <p>{family.description}</p>
            <div class="swatches">{family.roles.map(swatch)}</div>
          </section>
        ))}

        <section>
          <h2>Tones</h2>
          <p>
            Components that show a status take a <code>tone</code>: the text colour of the status on its soft
            ground. The contrast above is measured on that pairing.
          </p>
          <div class="tones">
            {TONE_LIST.map((tone) => (
              <JlBadge tone={tone} label={tone} dot />
            ))}
          </div>
        </section>

        <section>
          <h2>Using colour</h2>
          <div class="rules">
            {guideline(
              'do',
              '<jl-button label="Save draft"></jl-button><jl-button variant="primary" label="Publish"></jl-button>',
              'Give a view one primary action, in the accent. The other actions stay ink on white.'
            )}
            {guideline(
              'dont',
              '<jl-button variant="primary" label="Save draft"></jl-button><jl-button variant="primary" label="Publish"></jl-button>',
              'Two blue buttons side by side: nothing says which one the view is about.'
            )}
            {guideline(
              'do',
              '<jl-badge tone="warn" icon="triangle-alert" label="Expires in 3 days"></jl-badge><jl-badge tone="accent" label="New"></jl-badge>',
              'Keep amber for real warnings, and mark what is new with the accent.'
            )}
            {guideline(
              'dont',
              '<jl-badge tone="warn" label="New"></jl-badge><jl-badge tone="danger" label="Beta"></jl-badge>',
              'Amber or red for emphasis: people learn to ignore the colours that should stop them.'
            )}
            {guideline(
              'do',
              '<jl-badge tone="ok" icon="check" label="Paid"></jl-badge><jl-badge tone="danger" icon="circle-x" label="Failed"></jl-badge>',
              'Say a status with a word or an icon as well as a colour.'
            )}
            {guideline(
              'dont',
              '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--jl-ok)"></span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--jl-danger)"></span>',
              'Colour alone: one person in twelve cannot tell these two apart.'
            )}
          </div>
        </section>
      </article>
    );
  }

  templateCss(): string {
    // The tokens again in this shadow root: the light and dark halves set data-theme in here.
    return css`${TOKEN_STYLES}${BASE_STYLES}${PROSE_STYLES}${DESIGN_STYLES}`;
  }

  onConnect(): void {
    document.title = 'Colour · jlib';
    for (const halfElement of this.shadowRoot?.querySelectorAll<HTMLElement>('.half') ?? []) {
      measure(halfElement);
    }
  }
}

ColourPage.register();
