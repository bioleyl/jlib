import { css } from '@jadis/core';

import { JlFormControl } from '../base/jl-form-control';
import { setOrRemove } from '../lib/dom';
import { BASE_STYLES, CONTROL_STYLES } from '../styles/shared';
import styles from './jl-textarea.css?raw';

const DEFAULT_ROWS = 3;
// Without a max-rows, an autosized area grows as far as its text goes.
const UNLIMITED_ROWS = 0;
// The line height of the frame, for a browser that reports "normal".
const FALLBACK_LINE_HEIGHT = 20;

/**
 * A text field of several lines that takes part in forms. `rows` sets its height; with `autosize` it grows with
 * its text up to `max-rows`. A `maxlength` shows a counter under the field.
 */
export class JlTextarea extends JlFormControl {
  static readonly selector = 'jl-textarea';

  readonly events = this.useEvents<{ input: string; change: string }>();

  readonly value = this.useChange('', (value) => this.renderValue(value), { attribute: 'value' });
  readonly placeholder = this.useChange('', (value) => setOrRemove(this._refs.native, 'placeholder', value), {
    attribute: 'placeholder',
  });
  readonly rows = this.useChange(
    DEFAULT_ROWS,
    (value) => {
      this._refs.native.rows = Math.max(1, value);
      this.fit();
    },
    { attribute: 'rows' }
  );
  /** Grows with the text, from `rows` up to `max-rows`. */
  readonly autosize = this.useChange(
    false,
    (value) => {
      this.reflect('autosize', value);
      this.fit();
    },
    { attribute: 'autosize' }
  );
  /** The most lines an autosized area grows to before it scrolls; 0 for no limit. */
  readonly maxRows = this.useChange(UNLIMITED_ROWS, () => this.fit(), { attribute: 'max-rows' });
  /** The most characters it takes; shows a counter under the field. */
  readonly maxlength = this.useChange('', (value) => this.renderMaxlength(value), { attribute: 'maxlength' });
  /** The field's name for screen readers, when no visible label names it. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.native, 'aria-label', value), {
    attribute: 'label',
  });
  readonly required = this.useChange(false, (value) => this.setFlag('required', value), { attribute: 'required' });
  readonly readonly = this.useChange(false, (value) => this.setFlag('readonly', value), { attribute: 'readonly' });
  readonly disabled = this.useChange(
    false,
    (value) => {
      this.reflect('disabled', value);
      this.renderDisabled();
    },
    { attribute: 'disabled' }
  );
  /** Draws the field in the danger colour, for an error the page found itself. */
  readonly invalid = this.useChange(
    false,
    (value) => {
      this.reflect('invalid', value);
      this._refs.native.toggleAttribute('aria-invalid', value);
    },
    { attribute: 'invalid' }
  );

  private readonly _form = { disabled: false };

  private readonly _refs = this.useRefs((ref) => ({
    counter: ref('.counter'),
    native: ref<HTMLTextAreaElement>('textarea'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  /** Selects the whole text, ready to be replaced. */
  select(): void {
    this._refs.native.select();
  }

  templateHtml(): Node {
    return (
      <div class="field">
        <div class="control" attrs={{ part: 'base' }}>
          <textarea class="native" aria-describedby="counter" />
        </div>
        <div id="counter" class="counter" hidden />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${CONTROL_STYLES}${styles}`;
  }

  onConnect(): void {
    const native = this._refs.native;
    // The native event crosses the shadow root: stop it, or listeners of ours would also hear it, without a value.
    this.on(native, 'input', (event) => {
      event.stopPropagation();
      this.value.set(native.value);
      this.events.emit('input', native.value);
    });
    this.on(native, 'change', () => this.events.emit('change', native.value));
    // Laid out only now: the heights measured while the template was detached were empty.
    this.fit();
  }

  protected resetValue(): void {
    this.value.set(this.getAttribute('value') ?? '');
  }

  /** The browser calls it for a disabled fieldset and for the element's own disabled attribute, even before render. */
  protected setDisabledByForm(disabled: boolean): void {
    this._form.disabled = disabled;
    this.whenRendered(() => this.renderDisabled());
  }

  private renderDisabled(): void {
    this._refs.native.disabled = this.disabled.get() || this._form.disabled;
  }

  private renderValue(value: string): void {
    const native = this._refs.native;
    if (native.value !== value) {
      native.value = value;
    }
    this.internals.setFormValue(value);
    this.mirrorValidity(native);
    this.renderCounter();
    this.fit();
  }

  private renderMaxlength(maxlength: string): void {
    setOrRemove(this._refs.native, 'maxlength', maxlength);
    this.mirrorValidity(this._refs.native);
    this.renderCounter();
  }

  private renderCounter(): void {
    const counter = this._refs.counter;
    const max = this._refs.native.maxLength;
    counter.hidden = max < 0;
    if (max < 0) {
      return;
    }
    const length = this._refs.native.value.length;
    counter.textContent = `${length} / ${max}`;
    counter.toggleAttribute('data-full', length >= max);
  }

  private setFlag(name: string, value: boolean): void {
    this._refs.native.toggleAttribute(name, value);
    this.reflect(name, value);
    this.mirrorValidity(this._refs.native);
  }

  /** Fits the height to the text when autosized, between `rows` and `max-rows` lines. */
  private fit(): void {
    const native = this._refs.native;
    native.style.removeProperty('height');
    native.style.removeProperty('overflow-y');
    if (!this.autosize.get() || native.scrollHeight === 0) {
      return;
    }
    const limit = this.heightLimit(native);
    const height = Math.min(native.scrollHeight, limit);
    native.style.height = `${height}px`;
    native.style.overflowY = native.scrollHeight > limit ? 'auto' : 'hidden';
  }

  /** The height of `max-rows` lines (never fewer than `rows`), or no limit without it. */
  private heightLimit(native: HTMLTextAreaElement): number {
    const maxRows = this.maxRows.get();
    if (maxRows <= UNLIMITED_ROWS) {
      return Number.POSITIVE_INFINITY;
    }
    const style = getComputedStyle(native);
    const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
    const lineHeight = Number.parseFloat(style.lineHeight) || FALLBACK_LINE_HEIGHT;
    return Math.max(maxRows, this.rows.get()) * lineHeight + padding;
  }
}

JlTextarea.register();
