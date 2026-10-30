import { css } from '@jadis/core';

import { JlIcon } from '../atoms/jl-icon';
import { JlFormControl } from '../base/jl-form-control';
import { jsonOf, oneOf, textOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { moveIndicator } from '../lib/indicator';
import { CONTROL_SIZES } from '../lib/options';
import { watchSizes } from '../lib/resize';
import { firstIndex, lastIndex, stepIndex } from '../lib/roving';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-segmented.css?raw';

import type { SegmentedOption } from '../types/jl-segmented.types';
import type { ControlSize } from '../types/options.types';

const ICON_SIZES: Record<ControlSize, number> = { lg: 18, md: 16, sm: 14 };

type KeyMove = (enabled: readonly boolean[], from: number) => number;

// Keyboard keys are PascalCase names: a Map keeps them as they are.
const NO_VALUE = '';

const KEY_MOVES = new Map<string, KeyMove>([
  ['ArrowDown', (enabled, from) => stepIndex(enabled, from, 1)],
  ['ArrowLeft', (enabled, from) => stepIndex(enabled, from, -1)],
  ['ArrowRight', (enabled, from) => stepIndex(enabled, from, 1)],
  ['ArrowUp', (enabled, from) => stepIndex(enabled, from, -1)],
  ['End', lastIndex],
  ['Home', firstIndex],
]);

/**
 * A row of a few exclusive choices with a thumb that slides to the chosen one: a view switch, a period, a
 * density. It takes part in forms like a radio group; `change` fires with the value people pick. Typed by its values,
 * `JlSegmented<'list' | 'grid'>` takes options of those values and gives `change` one of them.
 */
export class JlSegmented<Value extends string = string> extends JlFormControl {
  static readonly selector = 'jl-segmented';

  readonly events = this.useEvents<{ change: Value }>();

  readonly options = this.useChange<SegmentedOption<Value>[]>([], () => this.renderOptions(), {
    attribute: 'options',
    parse: jsonOf<SegmentedOption<Value>[]>([]),
  });
  /** The chosen option's value; the first option that can be chosen when it names none. */
  readonly value = this.useChange<Value | typeof NO_VALUE>(NO_VALUE, () => this.renderValue(), {
    attribute: 'value',
    parse: textOf<Value | typeof NO_VALUE>(NO_VALUE),
  });
  readonly size = this.useChange<ControlSize>(
    'md',
    (value) => {
      this.reflect('size', value);
      this.renderOptions();
    },
    {
      attribute: 'size',
      parse: oneOf(CONTROL_SIZES, 'md'),
    }
  );
  /** Takes the whole width, the options sharing it. */
  readonly block = this.useChange(
    false,
    (value) => {
      this.reflect('block', value);
      this.placeThumb();
    },
    { attribute: 'block' }
  );
  readonly disabled = this.useChange(
    false,
    (value) => {
      this.reflect('disabled', value);
      this.renderDisabled();
    },
    { attribute: 'disabled' }
  );
  /** The group's name for screen readers, when no visible label names it. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.group, 'aria-label', value), {
    attribute: 'label',
  });

  private readonly _state = { disabledByForm: false };

  private readonly _resize = watchSizes(() => this.placeThumb());

  private readonly _refs = this.useRefs((ref) => ({
    group: ref('.group'),
    thumb: ref('.thumb'),
  }));

  override focus(options?: FocusOptions): void {
    this.selectedSegment()?.focus(options);
  }

  templateHtml(): Node {
    return (
      <div class="group" role="radiogroup" attrs={{ part: 'base' }}>
        <span class="thumb" aria-hidden="true" hidden />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._resize.observe(this._refs.group);
    this.on(this._refs.group, 'click', (event) => {
      const segment = (event.target as Element).closest<HTMLButtonElement>('.segment');
      if (segment !== null) {
        this.choose(this.segments().indexOf(segment), false);
      }
    });
    this.on(this._refs.group, 'keydown', (event) => this.onKeydown(event));
  }

  onDisconnect(): void {
    this._resize.disconnect();
  }

  protected resetValue(): void {
    this.value.set(textOf<Value | typeof NO_VALUE>(NO_VALUE)(this.getAttribute('value')));
  }

  /** The browser calls it for a disabled fieldset and for the element's own `disabled`, even before it renders. */
  protected setDisabledByForm(disabled: boolean): void {
    this._state.disabledByForm = disabled;
    this.whenRendered(() => this.renderDisabled());
  }

  private segments(): HTMLButtonElement[] {
    return [...this._refs.group.querySelectorAll<HTMLButtonElement>('.segment')];
  }

  private selectedSegment(): HTMLButtonElement | null {
    return this.segments().find((segment) => segment.getAttribute('aria-checked') === 'true') ?? null;
  }

  private isDisabled(): boolean {
    return this.disabled.get() || this._state.disabledByForm;
  }

  // No reflect() here: it runs for `options` before the attributes declared after it are read.
  private renderOptions(): void {
    const iconSize = ICON_SIZES[this.size.get()];
    const segments = this.options.get().map((option) => this.segment(option, iconSize));
    this._refs.group.replaceChildren(this._refs.thumb, ...segments);
    this.renderValue();
    this.renderDisabled();
  }

  /** A segment; with only an icon, its value names it. */
  private segment(option: SegmentedOption<Value>, iconSize: number): HTMLButtonElement {
    const label = option.label ?? '';
    const name = label === '' ? option.value : undefined;
    return (
      // biome-ignore lint/a11y/useSemanticElements: a button in the radio role keeps the segment's look and focus
      <button
        type="button"
        role="radio"
        aria-checked="false"
        aria-label={name}
        title={name}
        class="segment"
        data-value={option.value}
        data-disabled={option.disabled === true ? '' : undefined}>
        {option.icon === undefined ? '' : <JlIcon name={option.icon} size={iconSize} />}
        {label === '' ? '' : <span class="label">{label}</span>}
        {option.badge === undefined ? '' : <span class="badge">{String(option.badge)}</span>}
      </button>
    );
  }

  /** The chosen option's index: the one `value` names, or else the first that can be chosen. */
  private selectedIndex(): number {
    const options = this.options.get();
    const named = options.findIndex((option) => option.value === this.value.get() && option.disabled !== true);
    return named === -1 ? options.findIndex((option) => option.disabled !== true) : named;
  }

  private renderValue(): void {
    const option = this.options.get()[this.selectedIndex()];
    if (option !== undefined && option.value !== this.value.get()) {
      this.value.set(option.value);
      return;
    }
    const value = option?.value ?? NO_VALUE;
    this.segments().forEach((segment) => {
      const checked = segment.dataset.value === value;
      segment.setAttribute('aria-checked', String(checked));
      segment.tabIndex = checked ? 0 : -1;
    });
    this.internals.setFormValue(value);
    this.placeThumb();
  }

  private renderDisabled(): void {
    const disabled = this.isDisabled();
    this._refs.group.toggleAttribute('aria-disabled', disabled);
    for (const segment of this.segments()) {
      segment.disabled = disabled || segment.hasAttribute('data-disabled');
    }
  }

  private placeThumb(): void {
    moveIndicator(this._refs.thumb, this.selectedSegment());
  }

  private onKeydown(event: KeyboardEvent): void {
    const move = KEY_MOVES.get(event.key);
    const segments = this.segments();
    const from = segments.indexOf(event.target as HTMLButtonElement);
    if (move === undefined || from === -1) {
      return;
    }
    event.preventDefault();
    this.choose(
      move(
        segments.map((segment) => !segment.disabled),
        from
      ),
      true
    );
  }

  /** Chooses an option people picked, and says so. */
  private choose(index: number, focus: boolean): void {
    const option = this.options.get()[index];
    const segment = this.segments()[index];
    if (option === undefined || segment === undefined || segment.disabled) {
      return;
    }
    if (focus) {
      segment.focus();
    }
    if (option.value === this.value.get()) {
      return;
    }
    this.value.set(option.value);
    this.events.emit('change', option.value);
  }
}

JlSegmented.register();
