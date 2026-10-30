import { css } from '@jadis/core';

import { JlFormControl } from '../base/jl-form-control';
import { jsonOf, oneOf, textOf } from '../lib/attributes';
import { rovingIndex } from '../lib/roving-index';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-radio-group.css?raw';

import type { RadioGroupOrientation, RadioGroupVariant, RadioOption } from '../types/jl-radio-group.types';
import type { RovingMove } from '../types/roving-index.types';

export const RADIO_GROUP_ORIENTATIONS: readonly RadioGroupOrientation[] = ['vertical', 'horizontal'];
export const RADIO_GROUP_VARIANTS: readonly RadioGroupVariant[] = ['plain', 'cards'];

const NO_VALUE = '';
const OPTION_SELECTOR = '[role="radio"]';

/** The keys that move the choice, as with native radios: both arrow pairs whatever the orientation. */
const MOVES = new Map<string, RovingMove>([
  ['ArrowDown', 'next'],
  ['ArrowLeft', 'previous'],
  ['ArrowRight', 'next'],
  ['ArrowUp', 'previous'],
  ['End', 'last'],
  ['Home', 'first'],
]);

const SPACE = ' ';

/**
 * One choice among a few, all in view. It behaves as native radios: Tab reaches the chosen option, the arrow keys
 * move the choice, Space chooses the focused option. `variant="cards"` draws each option as a card. Typed by its
 * values, `JlRadioGroup<'card' | 'invoice'>` takes options of those values and gives `change` one of them.
 */
export class JlRadioGroup<Value extends string = string> extends JlFormControl {
  static readonly selector = 'jl-radio-group';

  readonly events = this.useEvents<{ change: Value }>();

  readonly options = this.useChange<RadioOption<Value>[]>([], () => this.renderOptions(), {
    attribute: 'options',
    parse: jsonOf<RadioOption<Value>[]>([]),
  });
  readonly value = this.useChange<Value | typeof NO_VALUE>(NO_VALUE, () => this.renderValue(), {
    attribute: 'value',
    parse: textOf<Value | typeof NO_VALUE>(NO_VALUE),
  });
  readonly orientation = this.useChange<RadioGroupOrientation>(
    'vertical',
    (value) => {
      this.reflect('orientation', value);
      this._refs.group.setAttribute('aria-orientation', value);
    },
    { attribute: 'orientation', parse: oneOf(RADIO_GROUP_ORIENTATIONS, 'vertical') }
  );
  readonly variant = this.useChange<RadioGroupVariant>('plain', (value) => this.reflect('variant', value), {
    attribute: 'variant',
    parse: oneOf(RADIO_GROUP_VARIANTS, 'plain'),
  });
  /** The group's name for screen readers; shown over the options as a legend with `legend`. */
  readonly label = this.useChange(
    '',
    (value) => {
      this._refs.legend.textContent = value;
    },
    { attribute: 'label' }
  );
  /** Shows the label over the options. */
  readonly legend = this.useChange(
    false,
    (value) => {
      this._refs.legend.classList.toggle('sr-only', !value);
    },
    { attribute: 'legend' }
  );
  readonly required = this.useChange(
    false,
    (value) => {
      this.reflect('required', value);
      this._refs.group.toggleAttribute('aria-required', value);
      this.renderValidity();
    },
    { attribute: 'required' }
  );
  readonly disabled = this.useChange(
    false,
    (value) => {
      this.reflect('disabled', value);
      this.renderValue();
    },
    { attribute: 'disabled' }
  );

  private readonly _state = { disabledByForm: false };

  private readonly _refs = this.useRefs((ref) => ({
    group: ref('.group'),
    legend: ref('.legend'),
    list: ref('.options'),
  }));

  /** Focuses the chosen option, or the first one that can be chosen. */
  override focus(options?: FocusOptions): void {
    this.radios()
      .find((radio) => radio.tabIndex === 0)
      ?.focus(options);
  }

  templateHtml(): Node {
    return (
      <div class="group" role="radiogroup" aria-labelledby="legend" attrs={{ part: 'base' }}>
        <span id="legend" class="legend sr-only" />
        <div class="options" />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const list = this._refs.list;
    this.on(list, 'click', (event) => {
      const radio = (event.target as Element).closest<HTMLElement>(OPTION_SELECTOR);
      if (radio !== null && this.isEnabled(radio)) {
        this.choose(radio);
      }
    });
    this.on(list, 'keydown', (event) => this.onKey(event));
  }

  protected resetValue(): void {
    this.value.set(textOf<Value | typeof NO_VALUE>(NO_VALUE)(this.getAttribute('value')));
  }

  /** The browser calls it for a disabled fieldset and for the element's own disabled attribute, even before render. */
  protected setDisabledByForm(disabled: boolean): void {
    this._state.disabledByForm = disabled;
    this.whenRendered(() => this.renderValue());
  }

  private onKey(event: KeyboardEvent): void {
    const radio = (event.target as Element).closest<HTMLElement>(OPTION_SELECTOR);
    if (radio === null) {
      return;
    }
    if (event.key === SPACE) {
      event.preventDefault();
      this.choose(radio);
      return;
    }
    const move = MOVES.get(event.key);
    if (move === undefined) {
      return;
    }
    event.preventDefault();
    this.moveFrom(radio, move);
  }

  /** Moves the focus and the choice together, as native radios do. */
  private moveFrom(radio: HTMLElement, move: RovingMove): void {
    const radios = this.radios();
    const disabled = radios.map((candidate) => !this.isEnabled(candidate));
    const target = radios[rovingIndex(disabled, radios.indexOf(radio), move)];
    if (target !== undefined) {
      this.choose(target);
    }
  }

  private choose(radio: HTMLElement): void {
    radio.focus();
    const value = this.options.get().find((option) => option.value === radio.dataset.value)?.value;
    if (value === undefined || value === this.value.get()) {
      return;
    }
    this.value.set(value);
    this.events.emit('change', value);
  }

  private radios(): HTMLElement[] {
    return [...this._refs.list.querySelectorAll<HTMLElement>(OPTION_SELECTOR)];
  }

  private isGroupDisabled(): boolean {
    return this.disabled.get() || this._state.disabledByForm;
  }

  private isEnabled(radio: HTMLElement): boolean {
    return radio.getAttribute('aria-disabled') !== 'true';
  }

  private renderOptions(): void {
    this._refs.list.replaceChildren(
      ...this.options.get().map((option, index) => this.optionElement(option, index))
    );
    this.renderValue();
  }

  private optionElement(option: RadioOption<Value>, index: number): HTMLElement {
    const labelId = `option-${index}-label`;
    const descriptionId = `option-${index}-description`;
    const hasDescription = option.description !== undefined && option.description !== '';
    return (
      // biome-ignore lint/a11y/useSemanticElements: drawn radios, so the roving focus and the cards are ours to style
      <div
        class="option"
        role="radio"
        aria-checked="false"
        aria-labelledby={labelId}
        aria-describedby={hasDescription ? descriptionId : undefined}
        data-value={option.value}
        data-disabled={option.disabled === true ? 'true' : undefined}
        tabIndex={-1}>
        <span class="dot" />
        <span class="text">
          <span id={labelId} class="label">
            {option.label}
          </span>
          {hasDescription ? (
            <span id={descriptionId} class="description">
              {option.description}
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  /** Checks the option with the value, and gives the Tab stop to it, or else to the first option enabled. */
  private renderValue(): void {
    const value = this.value.get();
    const radios = this.radios();
    const groupDisabled = this.isGroupDisabled();
    for (const radio of radios) {
      const disabled = groupDisabled || radio.dataset.disabled === 'true';
      radio.setAttribute('aria-checked', String(radio.dataset.value === value));
      radio.setAttribute('aria-disabled', String(disabled));
      radio.tabIndex = -1;
    }
    this._refs.group.toggleAttribute('aria-disabled', groupDisabled);
    const stop = this.tabStop(radios, value);
    if (stop !== undefined) {
      stop.tabIndex = 0;
    }
    this.internals.setFormValue(value === NO_VALUE ? null : value);
    this.renderValidity();
  }

  private tabStop(radios: HTMLElement[], value: string): HTMLElement | undefined {
    const enabled = radios.filter((radio) => this.isEnabled(radio));
    return enabled.find((radio) => radio.dataset.value === value) ?? enabled[0];
  }

  private renderValidity(): void {
    const missing = this.required.get() && this.value.get() === NO_VALUE;
    if (!missing) {
      this.internals.setValidity({});
      return;
    }
    this.internals.setValidity(
      { valueMissing: true },
      jlText('selectOption'),
      this.radios()[0] ?? this._refs.group
    );
  }
}

JlRadioGroup.register();
