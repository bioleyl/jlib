import { css } from '@jadis/core';

import { JlFormControl } from '../base/jl-form-control';
import { jsonOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { fractionOf, marksOf, parseNumber } from '../lib/numeric';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-slider.css?raw';

import type { SliderMark } from '../types/jl-slider.types';

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;
const DEFAULT_STEP = 1;
const DEFAULT_VALUE = 0;
// The labels of the marks at the ends line up with the ends of the track instead of overflowing them.
const EDGES = new Map<number, string>([
  [0, 'start'],
  [1, 'end'],
]);

/**
 * A number picked by dragging along a track, on the browser's own range input: the arrow keys, Page Up/Down,
 * Home and End move it. The track fills in the accent colour up to the thumb.
 */
export class JlSlider extends JlFormControl {
  static readonly selector = 'jl-slider';

  readonly events = this.useEvents<{ input: number; change: number }>();

  // The bounds come before the value: the native input clamps the value to the bounds it has when it gets it.
  readonly min = this.useChange(DEFAULT_MIN, () => this.renderRange(), { attribute: 'min' });
  readonly max = this.useChange(DEFAULT_MAX, () => this.renderRange(), { attribute: 'max' });
  readonly step = this.useChange(DEFAULT_STEP, () => this.render(), { attribute: 'step' });
  /** The number; it is brought between `min` and `max`, on a `step`, as the native input does. */
  readonly value = this.useChange(DEFAULT_VALUE, () => this.render(), { attribute: 'value' });
  /** Shows the number at the end of the track. */
  readonly showValue = this.useChange(
    false,
    (value) => {
      this._refs.output.hidden = !value;
    },
    { attribute: 'show-value' }
  );
  /** Ticks under the track: numbers, or `{ value, label }` for a tick with a label. */
  readonly marks = this.useChange<Array<number | SliderMark>>([], () => this.renderMarks(), {
    attribute: 'marks',
    parse: jsonOf<Array<number | SliderMark>>([]),
  });
  /** The slider's name for screen readers, when no visible label names it. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.native, 'aria-label', value), {
    attribute: 'label',
  });
  readonly disabled = this.useChange(
    false,
    (value) => {
      this.reflect('disabled', value);
      this.renderDisabled();
    },
    { attribute: 'disabled' }
  );

  private readonly _form = { disabled: false };

  private readonly _refs = this.useRefs((ref) => ({
    marks: ref('.marks'),
    native: ref<HTMLInputElement>('input'),
    output: ref('.output'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  templateHtml(): Node {
    return (
      <div class="slider" attrs={{ part: 'base' }}>
        <div class="track-area">
          <input type="range" class="native" />
          <div class="marks" aria-hidden="true" hidden />
        </div>
        <span class="output" aria-hidden="true" hidden />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const native = this._refs.native;
    // The native event crosses the shadow root: stop it, or listeners of ours would also hear it, without a value.
    this.on(native, 'input', (event) => {
      event.stopPropagation();
      this.value.set(native.valueAsNumber);
      this.events.emit('input', native.valueAsNumber);
    });
    this.on(native, 'change', () => this.events.emit('change', native.valueAsNumber));
  }

  protected resetValue(): void {
    this.value.set(parseNumber(this.getAttribute('value')) ?? DEFAULT_VALUE);
  }

  /** The browser calls it for a disabled fieldset and for the element's own disabled attribute, even before render. */
  protected setDisabledByForm(disabled: boolean): void {
    this._form.disabled = disabled;
    this.whenRendered(() => this.renderDisabled());
  }

  private renderDisabled(): void {
    this._refs.native.disabled = this.disabled.get() || this._form.disabled;
  }

  private render(): void {
    const native = this._refs.native;
    native.min = String(this.min.get());
    native.max = String(this.max.get());
    native.step = String(this.step.get());
    native.value = String(this.value.get());
    // The native input kept the value within the bounds and on a step: the value says what is shown.
    if (native.valueAsNumber !== this.value.get()) {
      this.value.set(native.valueAsNumber);
      return;
    }
    this.renderPosition();
  }

  /** New bounds move the thumb and the marks. */
  private renderRange(): void {
    this.render();
    this.renderMarks();
  }

  /** The fill, the shown number and the form's value, from the value the native input kept. */
  private renderPosition(): void {
    const native = this._refs.native;
    const fraction = fractionOf(native.valueAsNumber, this.min.get(), this.max.get());
    native.style.setProperty('--fraction', String(fraction));
    this._refs.output.textContent = native.value;
    this.internals.setFormValue(native.value);
  }

  private renderMarks(): void {
    const min = this.min.get();
    const max = this.max.get();
    const marks = marksOf(this.marks.get(), min, max);
    const container = this._refs.marks;
    container.hidden = marks.length === 0;
    this.reflect(
      'has-labels',
      marks.some((mark) => mark.label !== undefined)
    );
    container.replaceChildren(
      ...marks.map((mark) => {
        const element = (
          <span class="mark">
            <span class="tick" />
            {mark.label === undefined ? null : <span class="mark-label">{mark.label}</span>}
          </span>
        );
        const fraction = fractionOf(mark.value, min, max);
        element.style.setProperty('--at', String(fraction));
        setOrRemove(element, 'data-edge', EDGES.get(fraction) ?? '');
        return element;
      })
    );
  }
}

JlSlider.register();
