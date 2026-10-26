import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { svgElement } from '../lib/dom';
import { optionalNumber, percentLabel, percentOf, progressRatio, ringGeometry } from '../lib/progress';
import { BASE_STYLES } from '../styles/shared';
import { PROGRESS_TONES } from './jl-progress';
import styles from './jl-progress-ring.css?raw';

import type { ProgressTone } from '../types/jl-progress.types';

const DEFAULT_MAX = 100;
const DEFAULT_SIZE = 40;
const DEFAULT_THICKNESS = 4;
// The arc is drawn on a path of length 100, so its dash offset is the part left to do, in percent.
const PATH_LENGTH = 100;
const DEFAULT_NAME = 'Progress';

/**
 * How far a task has gone, as a ring: `value` out of `max`, the percentage in its centre with `show-value`.
 * Without a value, the ring turns: the work has no known end. Fits in buttons, cards and table cells.
 */
export class JlProgressRing extends JlElement {
  static readonly selector = 'jl-progress-ring';

  /** How much is done, out of `max`; `null` (no attribute) for work of unknown length. */
  readonly value = this.useChange<number | null>(null, () => this.renderValue(), {
    attribute: 'value',
    parse: optionalNumber,
  });
  readonly max = this.useChange(DEFAULT_MAX, () => this.renderValue(), { attribute: 'max' });
  /** The ring's width and height, in pixels. */
  readonly size = this.useChange(DEFAULT_SIZE, () => this.renderGeometry(), { attribute: 'size' });
  /** The width of the ring's stroke, in pixels. */
  readonly thickness = this.useChange(DEFAULT_THICKNESS, () => this.renderGeometry(), { attribute: 'thickness' });
  readonly tone = this.useChange<ProgressTone>('accent', (value) => this.reflect('tone', value), {
    attribute: 'tone',
    parse: oneOf(PROGRESS_TONES, 'accent'),
  });
  /** Prints the percentage in the centre: for rings of 40 pixels and more. */
  readonly showValue = this.useChange(
    false,
    (value) => {
      this._refs.percent.hidden = !value;
    },
    { attribute: 'show-value' }
  );
  /** The ring's name for screen readers: what is in progress. */
  readonly label = this.useChange(
    '',
    (value) => this._refs.ring.setAttribute('aria-label', value === '' ? DEFAULT_NAME : value),
    { attribute: 'label' }
  );

  private readonly _refs = this.useRefs((ref) => ({
    percent: ref('.percent'),
    ring: ref('.ring'),
  }));

  private readonly _svg = {
    arc: null as SVGCircleElement | null,
    root: null as SVGSVGElement | null,
    track: null as SVGCircleElement | null,
  };

  templateHtml(): Node {
    const ring = (
      <span class="ring" role="progressbar" aria-valuemin="0" attrs={{ part: 'base' }}>
        <span class="percent" aria-hidden="true" hidden />
      </span>
    );
    ring.prepend(this.buildSvg());
    return ring;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private buildSvg(): SVGSVGElement {
    const root = svgElement('svg', { 'aria-hidden': 'true', class: 'svg' });
    const track = svgElement('circle', { class: 'track', fill: 'none' });
    const arc = svgElement('circle', { class: 'arc', fill: 'none', pathLength: String(PATH_LENGTH) });
    root.append(track, arc);
    Object.assign(this._svg, { arc, root, track });
    return root;
  }

  private renderGeometry(): void {
    const { root, track, arc } = this._svg;
    if (root === null || track === null || arc === null) {
      return;
    }
    const size = this.size.get();
    const { center, radius, stroke } = ringGeometry(size, this.thickness.get());
    root.setAttribute('viewBox', `0 0 ${size} ${size}`);
    for (const circle of [track, arc]) {
      circle.setAttribute('cx', String(center));
      circle.setAttribute('cy', String(center));
      circle.setAttribute('r', String(radius));
      circle.setAttribute('stroke-width', String(stroke));
    }
    this.style.setProperty('--size', `${size}px`);
  }

  private renderValue(): void {
    const value = this.value.get();
    const ring = this._refs.ring;
    const max = this.max.get();
    ring.setAttribute('aria-valuemax', String(max));
    this.reflect('indeterminate', value === null);
    this.reflect('empty', value !== null && progressRatio(value, max) === 0);
    if (value === null) {
      ring.removeAttribute('aria-valuenow');
      ring.removeAttribute('aria-valuetext');
      this.style.removeProperty('--done');
      this._refs.percent.textContent = '';
      return;
    }
    const ratio = progressRatio(value, max);
    ring.setAttribute('aria-valuenow', String(value));
    ring.setAttribute('aria-valuetext', percentLabel(ratio));
    this.style.setProperty('--done', String(percentOf(ratio)));
    this._refs.percent.textContent = percentLabel(ratio);
  }
}

JlProgressRing.register();
