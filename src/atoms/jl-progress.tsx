import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { optionalNumber, percentLabel, percentOf, progressRatio } from '../lib/progress';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-progress.css?raw';

import type { ProgressSize, ProgressTone } from '../types/jl-progress.types';

export const PROGRESS_TONES: readonly ProgressTone[] = ['accent', 'ok', 'warn', 'danger'];
export const PROGRESS_SIZES: readonly ProgressSize[] = ['md', 'sm'];

const DEFAULT_MAX = 100;
// What screen readers call a bar that has no visible label.
const DEFAULT_NAME = 'Progress';

/**
 * How far a task has gone, as a bar: `value` out of `max`. Without a value, the work has no known end and the bar
 * runs back and forth. A `label` above names it; `show-value` prints the percentage.
 */
export class JlProgress extends JlElement {
  static readonly selector = 'jl-progress';

  /** How much is done, out of `max`; `null` (no attribute) for work of unknown length. */
  readonly value = this.useChange<number | null>(null, () => this.render(), {
    attribute: 'value',
    parse: optionalNumber,
  });
  readonly max = this.useChange(DEFAULT_MAX, () => this.render(), { attribute: 'max' });
  readonly tone = this.useChange<ProgressTone>('accent', (value) => this.reflect('tone', value), {
    attribute: 'tone',
    parse: oneOf(PROGRESS_TONES, 'accent'),
  });
  readonly size = this.useChange<ProgressSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(PROGRESS_SIZES, 'md'),
  });
  /** Shown above the bar, and the bar's name for screen readers. */
  readonly label = this.useChange('', () => this.renderHeader(), { attribute: 'label' });
  /** Prints the percentage above the bar, at the end. */
  readonly showValue = this.useChange(false, () => this.renderHeader(), { attribute: 'show-value' });

  private readonly _refs = this.useRefs((ref) => ({
    bar: ref('.bar'),
    header: ref('.header'),
    label: ref('.label'),
    percent: ref('.percent'),
    track: ref('.track'),
  }));

  templateHtml(): Node {
    return (
      <div class="progress" attrs={{ part: 'base' }}>
        <div class="header" hidden>
          <span class="label" id="label" />
          <span class="percent" aria-hidden="true" />
        </div>
        <div class="track" role="progressbar" aria-valuemin="0">
          <div class="bar" />
        </div>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private render(): void {
    const value = this.value.get();
    const track = this._refs.track;
    const max = this.max.get();
    track.setAttribute('aria-valuemax', String(max));
    this.reflect('indeterminate', value === null);
    if (value === null) {
      track.removeAttribute('aria-valuenow');
      track.removeAttribute('aria-valuetext');
      this._refs.bar.style.removeProperty('width');
      this._refs.percent.textContent = '';
      return;
    }
    const ratio = progressRatio(value, max);
    track.setAttribute('aria-valuenow', String(value));
    track.setAttribute('aria-valuetext', percentLabel(ratio));
    this._refs.bar.style.width = `${percentOf(ratio)}%`;
    this._refs.percent.textContent = percentLabel(ratio);
  }

  private renderHeader(): void {
    const label = this.label.get();
    const track = this._refs.track;
    this._refs.label.textContent = label;
    this._refs.percent.hidden = !this.showValue.get();
    this._refs.header.hidden = label === '' && !this.showValue.get();
    if (label === '') {
      track.removeAttribute('aria-labelledby');
      track.setAttribute('aria-label', DEFAULT_NAME);
      return;
    }
    track.removeAttribute('aria-label');
    track.setAttribute('aria-labelledby', 'label');
  }
}

JlProgress.register();
