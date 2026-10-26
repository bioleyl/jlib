import { css } from '@jadis/core';
import { Check } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { starredParts } from '../lib/text';
import { BASE_STYLES, TOKEN_STYLES } from '../styles/shared';
import styles from './jl-auth-layout.css?raw';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ check: Check });

const DEFAULT_ORIGIN = 'Made in Switzerland by SyWare';
const POINT_ICON_SIZE = 12;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
// The SyWare mark as the designer drew it (site/public/syware-mark.svg): its ink and its blue parts.
const MARK_VIEW_BOX = '429 1092 2155 2358';
const MARK_TRANSFORM = 'matrix(1.3333333 0 0 -1.3333333 0 4535.4267)';
const MARK_PARTS: readonly { colour: string; transform: string; d: string }[] = [
  {
    colour: 'var(--jl-text)',
    d: 'm 0,0 -786.134,459.252 c -29.13,18.997 -62.026,44.131 -85.701,73.026 V 335.352 c 0,-112.197 60.333,-216.758 157.489,-272.837 l 492.661,-284.389 c 47.878,-27.653 102.358,-42.252 157.563,-42.252 55.12,0 109.562,14.599 157.459,42.252 l 45.359,26.187 C 133.464,-116.391 99.209,-62.514 0,0',
    transform: 'translate(1193.8955 1078.5752)',
  },
  {
    colour: 'var(--jl-brand)',
    d: 'm 0,0 c 0,112.186 -60.359,216.747 -157.526,272.845 l -492.639,284.407 c -47.822,27.634 -102.294,42.222 -157.544,42.222 -55.254,0 -109.715,-14.588 -157.489,-42.222 l -492.107,-284.098 c -12.716,-6.17 -157.459,-80.217 -157.459,-245.04 0,-164.205 138.525,-232.919 152.041,-239.219 l 937.433,-543.23 c -0.007,0 -0.063,-0.074 -0.063,-0.074 116.786,-68.629 155.718,-124.426 161.333,-209.494 153.313,93.103 206.494,122.148 206.494,122.148 65.696,37.908 228.603,135.168 -55.964,299.474 -284.567,164.309 -940.314,542.843 -940.314,542.843 -9.958,6.408 -15.905,17.159 -15.905,28.736 0,9.567 4.112,18.681 11.316,25.219 l 296.55,171.559 c 32.93,19.019 75.427,18.982 108.286,0.018 L -392.633,17.747 c 33.41,-19.303 54.16,-50.963 54.16,-118.386 0,-32.996 -5.679,-70.886 56.626,-107.08 47.577,-27.645 186.668,-107.832 249.792,-144.237 12.34,-9.065 22.934,-18.301 31.999,-27.597 L 0,-247.648 c 0,1.213 -0.093,2.397 -0.111,3.609 z',
    transform: 'translate(1937.4087 1982.8447)',
  },
];

/** The SyWare mark, drawn large and faint in the panel's corner: the company behind the app. JSX makes HTML only. */
function backdrop(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('viewBox', MARK_VIEW_BOX);
  svg.setAttribute('class', 'backdrop');
  svg.setAttribute('aria-hidden', 'true');
  const group = document.createElementNS(SVG_NAMESPACE, 'g');
  group.setAttribute('transform', MARK_TRANSFORM);
  for (const part of MARK_PARTS) {
    const path = document.createElementNS(SVG_NAMESPACE, 'path');
    path.setAttribute('transform', part.transform);
    path.setAttribute('d', part.d);
    // In style, not attributes: only CSS reads custom properties.
    path.style.fill = part.colour;
    group.append(path);
  }
  svg.append(group);
  return svg;
}

/**
 * The screen before an app, as every SyWare app shows it: on a dark panel, the app's brand (slot `brand`), a
 * headline whose words between asterisks take the brand's blue ("Workflows that *ask* before they act."), a
 * sentence, a few points, and where it comes from; beside it, the form (the default slot). On a phone, the panel
 * becomes a band with the brand, above the form.
 */
export class JlAuthLayout extends JlElement {
  static readonly selector = 'jl-auth-layout';

  /** What the app does, in a few words; `*words*` take the brand's blue. */
  readonly pitch = this.useChange('', (value) => this.renderPitch(value), { attribute: 'pitch' });
  /** One or two sentences under the headline. */
  readonly text = this.useChange(
    '',
    (value) => {
      this._refs.text.textContent = value;
      this._refs.text.hidden = value === '';
    },
    { attribute: 'text' }
  );
  /** What the app is good at, three points at most; HTML writes them as JSON. */
  readonly points = this.useChange<string[]>([], (value) => this.renderPoints(value), {
    attribute: 'points',
    parse: jsonOf<string[]>([]),
  });
  /** Where the app comes from, at the foot of the panel. */
  readonly origin = this.useChange(
    DEFAULT_ORIGIN,
    (value) => {
      this._refs.origin.textContent = value;
      this._refs.origin.hidden = value === '';
    },
    { attribute: 'origin' }
  );

  private readonly _refs = this.useRefs((ref) => ({
    headline: ref('.headline'),
    origin: ref('.origin'),
    points: ref('.points'),
    text: ref('.text'),
  }));

  templateHtml(): Node {
    return (
      <div class="screen" attrs={{ part: 'base' }}>
        <section class="story" data-theme="dark" attrs={{ part: 'story' }}>
          <div class="brand">
            <slot name="brand" />
          </div>
          <div class="pitch">
            <p class="headline" hidden />
            <p class="text" hidden />
          </div>
          <ul class="points" hidden />
          <p class="origin">{DEFAULT_ORIGIN}</p>
          {backdrop()}
        </section>
        <main class="side" attrs={{ part: 'side' }}>
          <slot />
        </main>
      </div>
    );
  }

  templateCss(): string {
    // The tokens again in this shadow root: the panel is dark (data-theme) whatever the page's theme.
    return css`${TOKEN_STYLES}${BASE_STYLES}${styles}`;
  }

  private renderPitch(pitch: string): void {
    const parts = starredParts(pitch).map((part) =>
      part.accent ? <span class="accent">{part.text}</span> : part.text
    );
    this._refs.headline.replaceChildren(...parts);
    this._refs.headline.hidden = pitch === '';
  }

  private renderPoints(points: readonly string[]): void {
    this._refs.points.replaceChildren(
      ...points.map((point) => (
        <li>
          <span class="tick">
            <JlIcon name="check" size={POINT_ICON_SIZE} />
          </span>
          <span>{point}</span>
        </li>
      ))
    );
    this._refs.points.hidden = points.length === 0;
  }
}

JlAuthLayout.register();
