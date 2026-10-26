import { css } from '@jadis/core';
import { JlButton, JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { MOTION_USES } from '../../docs/design';
import { designIntro } from '../../lib/design-blocks';
import { DESIGN_STYLES, PROSE_STYLES } from '../../styles/site-styles';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const CURVE_SIZE = 160;
// The --jl-ease curve: cubic-bezier(0.2, 0.7, 0.2, 1), drawn in a unit square flipped to screen coordinates.
const CURVE_PATH = 'M0,1 C0.2,0.3 0.2,0 1,0';
// How long the dots wait at the end of their lane before coming back.
const PAUSE_MS = 500;
const LINEAR = 'linear';

const TRACKS: readonly { name: string; token: string; duration: string; easing: string }[] = [
  { duration: '--jl-fast', easing: '--jl-ease', name: 'Fast', token: '--jl-fast · --jl-ease' },
  { duration: '--jl-slow', easing: '--jl-ease', name: 'Slow', token: '--jl-slow · --jl-ease' },
  { duration: '--jl-slow', easing: LINEAR, name: 'Linear, for contrast', token: '--jl-slow · linear' },
];

/** The easing curve as an SVG, with its frame. Jadis JSX makes HTML elements only, so it is built by hand. */
function curveElement(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('viewBox', '-0.05 -0.05 1.1 1.1');
  svg.setAttribute('width', String(CURVE_SIZE));
  svg.setAttribute('height', String(CURVE_SIZE));
  svg.setAttribute('aria-hidden', 'true');
  const frame = document.createElementNS(SVG_NAMESPACE, 'rect');
  frame.setAttribute('width', '1');
  frame.setAttribute('height', '1');
  frame.setAttribute('fill', 'none');
  frame.style.stroke = 'var(--jl-line-strong)';
  frame.setAttribute('stroke-width', '0.01');
  const curve = document.createElementNS(SVG_NAMESPACE, 'path');
  curve.setAttribute('d', CURVE_PATH);
  curve.setAttribute('fill', 'none');
  curve.style.stroke = 'var(--jl-accent)';
  curve.setAttribute('stroke-width', '0.03');
  curve.setAttribute('stroke-linecap', 'round');
  svg.append(frame, curve);
  return svg;
}

/** Reads a duration token (`120ms`) in milliseconds. */
const durationOf = (element: Element, token: string): number =>
  Number.parseFloat(getComputedStyle(element).getPropertyValue(token)) || 0;

/** A track's easing: linear as it is, or the curve a token holds. */
const easingOf = (element: Element, easing: string): string =>
  easing === LINEAR ? LINEAR : getComputedStyle(element).getPropertyValue(easing).trim() || LINEAR;

/** The durations and the curve, played side by side, and what moves in the components. */
export class MotionPage extends JlElement {
  static readonly selector = 'site-motion-page';

  private readonly _refs = this.useRefs((ref) => ({
    play: ref<JlButton>('.play'),
    tracks: ref('.tracks'),
  }));

  templateHtml(): Node {
    return (
      <article class="page">
        {designIntro(
          'Motion',
          'Two durations and one curve. Things move to show where they come from and where they went: never to decorate, and never when the system asks for less motion.'
        )}

        <section>
          <h2>Durations and curve</h2>
          <div class="motion-tools">
            <div class="tracks">
              {TRACKS.map((track) => (
                <div class="track" data-duration={track.duration} data-easing={track.easing}>
                  <span class="track-name">
                    {track.name}
                    <code>{track.token}</code>
                  </span>
                  <span class="lane">
                    <span class="dot" />
                  </span>
                </div>
              ))}
              <JlButton class="play" icon="zap" label="Play" size="sm" />
            </div>
            <div class="curve">
              {curveElement()}
              <code>cubic-bezier(0.2, 0.7, 0.2, 1)</code>
            </div>
          </div>
          <p>
            <code>--jl-fast</code> (120ms) is for what follows the pointer: hovers and presses.{' '}
            <code>--jl-slow</code> (240ms) is for what opens, slides or closes. The curve starts fast and settles
            gently, so a panel is there at once and lands softly.
          </p>
        </section>

        <section>
          <h2>What moves</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>What</th>
                  <th>Duration</th>
                  <th>How</th>
                </tr>
              </thead>
              <tbody>
                {MOTION_USES.map((use) => (
                  <tr>
                    <td>
                      <strong>{use.what}</strong>
                    </td>
                    <td>
                      <code>{use.duration}</code>
                    </td>
                    <td>{use.how}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Content itself does not animate: text, tables and layouts change at once. Only what appears over them,
            or shows a change of state, moves.
          </p>
        </section>

        <section>
          <h2>Reduced motion</h2>
          <p>
            When the system asks for less motion (<code>prefers-reduced-motion: reduce</code>), every transition
            and animation of the components is cut to a single, instant step. The one exception is the spinner,
            which keeps turning, slower: a still ring would read as stuck.
          </p>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${DESIGN_STYLES}`;
  }

  onConnect(): void {
    document.title = 'Motion · jlib';
    this._refs.play.events.register('press', () => this.play());
  }

  /** Sends each dot across its lane and back, with its track's duration and curve. */
  private play(): void {
    for (const track of this._refs.tracks.querySelectorAll<HTMLElement>('.track')) {
      const dot = track.querySelector<HTMLElement>('.dot');
      const lane = track.querySelector<HTMLElement>('.lane');
      if (dot === null || lane === null) {
        continue;
      }
      const there = { transform: `translateX(${lane.clientWidth - dot.offsetWidth - dot.offsetLeft * 2}px)` };
      const back = { transform: 'translateX(0)' };
      const timing = {
        duration: durationOf(this, track.dataset.duration ?? ''),
        easing: easingOf(this, track.dataset.easing ?? LINEAR),
        fill: 'forwards' as const,
      };
      dot.animate([back, there], timing);
      window.setTimeout(() => dot.animate([there, back], timing), timing.duration + PAUSE_MS);
    }
  }
}

MotionPage.register();
