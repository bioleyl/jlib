import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { clampedNumber } from '../lib/attributes';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-loading-bar.css?inline';

// A quick load shows nothing: the bar would only flash.
const DEFAULT_DELAY_MS = 150;
const MAX_DELAY_MS = 5000;
// Fast at first, then slower and slower, never at the end while the wait lasts.
const GROW_MS = 20_000;
const GROW_KEYFRAMES: Keyframe[] = [
  { transform: 'scaleX(0)' },
  { offset: 0.02, transform: 'scaleX(0.3)' },
  { offset: 0.1, transform: 'scaleX(0.55)' },
  { offset: 0.35, transform: 'scaleX(0.75)' },
  { transform: 'scaleX(0.9)' },
];
const FINISH_MS = 200;
const FADE_MS = 300;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** How long a step of the bar lasts: none when people asked for less motion, the bar then shown still. */
const lasting = (milliseconds: number): number => (window.matchMedia(REDUCED_MOTION).matches ? 0 : milliseconds);

/**
 * A thin line that says something is on its way, such as the next page: hidden for a moment, so a quick wait shows
 * nothing, then growing from the start, fast then slower, never reaching the end while the wait lasts. When it ends,
 * the line runs to the end and fades. Set `active` while waiting.
 */
export class JlLoadingBar extends JlElement {
  static readonly selector = 'jl-loading-bar';

  /** Whether something is on its way: the line shows after `delay`, and finishes when it turns false. */
  readonly active = this.useChange(false, (value) => (value ? this.start() : this.finish()), {
    attribute: 'active',
  });
  /** Milliseconds before the line shows. */
  readonly delay = this.useChange(DEFAULT_DELAY_MS, () => undefined, {
    attribute: 'delay',
    parse: clampedNumber(DEFAULT_DELAY_MS, 0, MAX_DELAY_MS),
  });
  /** What screen readers hear while the line shows; jlib's own when empty. */
  readonly label = this.useChange('', () => this.drawTexts(), { attribute: 'label' });

  // The timer that shows the line after its delay, and the animations it runs.
  private readonly _run: { animations: Animation[]; timer?: ReturnType<typeof setTimeout> } = { animations: [] };

  private readonly _refs = this.useRefs((ref) => ({
    bar: ref('.bar'),
    track: ref('.track'),
  }));

  templateHtml(): Node {
    return (
      <div class="track" role="progressbar" attrs={{ part: 'base' }} hidden>
        <div class="bar" />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  protected drawTexts(): void {
    this._refs.track.setAttribute('aria-label', this.label.get() || jlText('loading'));
  }

  onDisconnect(): void {
    clearTimeout(this._run.timer);
    this.reset();
  }

  /** Shows the line after its delay, unless the wait ends first. */
  private start(): void {
    clearTimeout(this._run.timer);
    this._run.timer = setTimeout(() => this.grow(), this.delay.get());
  }

  private grow(): void {
    this.reset();
    this._refs.track.hidden = false;
    this.play(this._refs.bar.animate(GROW_KEYFRAMES, { duration: lasting(GROW_MS), fill: 'forwards' }));
  }

  /** Runs the line to the end from where it is, then fades it; a line still waiting for its delay never shows. */
  private finish(): void {
    clearTimeout(this._run.timer);
    const { bar, track } = this._refs;
    if (track.hidden) {
      return;
    }
    for (const animation of this._run.animations) {
      animation.commitStyles();
      animation.cancel();
    }
    this._run.animations = [];
    this.play(bar.animate([{ transform: 'scaleX(1)' }], { duration: lasting(FINISH_MS), fill: 'forwards' }));
    const fade = track.animate([{ opacity: 1 }, { opacity: 0 }], {
      delay: lasting(FINISH_MS),
      duration: lasting(FADE_MS),
      fill: 'forwards',
    });
    fade.onfinish = () => this.reset();
    this.play(fade);
  }

  private play(animation: Animation): void {
    this._run.animations.push(animation);
  }

  /** Hides the line, back at its start. */
  private reset(): void {
    for (const animation of this._run.animations) {
      animation.cancel();
    }
    this._run.animations = [];
    this._refs.bar.style.removeProperty('transform');
    this._refs.track.style.removeProperty('opacity');
    this._refs.track.hidden = true;
  }
}

JlLoadingBar.register();
