import { css } from '@jadis/core';
import { Check, ChevronDown, X } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlFormControl } from '../base/jl-form-control';
import { jsonOf, oneOf } from '../lib/attributes';
import { setOrRemove, uniqueId } from '../lib/dom';
import { followAnchor } from '../lib/floating';
import { registerIcons } from '../lib/icons';
import { keepInView } from '../lib/keep-in-view';
import { edgeEnabledIndex, filterOptions, foldText, matchParts, nextEnabledIndex } from '../lib/option-filter';
import { CONTROL_SIZES } from '../lib/options';
import { BASE_STYLES, CONTROL_STYLES, FLOATING_STYLES } from '../styles/shared';
import styles from './jl-combobox.css?raw';

import type { Placement } from '../types/floating.types';
import type { ComboboxOption } from '../types/jl-combobox.types';
import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ check: Check, 'chevron-down': ChevronDown, x: X });

const ICON_SIZE = 16;
const ACTION_ICON_SIZE = 14;
const CHECK_SIZE = 14;
const NONE = -1;
const PLACEMENT: Placement = 'bottom-start';
const VALUE_MISSING = 'Choose an option.';
const DEFAULT_EMPTY_TEXT = 'No results';

type Direction = 1 | -1;

/** A JSON attribute that should hold a list of options; anything else gives none. */
const parseOptions = (value: string | null): ComboboxOption[] => {
  const parsed = jsonOf<unknown>([])(value);
  return Array.isArray(parsed) ? (parsed as ComboboxOption[]) : [];
};

/** A label with the searched text in a `<mark>`. */
const highlighted = (label: string, query: string): (Node | string)[] =>
  matchParts(label, query).map((part) => (part.matched ? <mark>{part.text}</mark> : part.text));

/**
 * A text field with a list of options that narrows as people type; they choose with the arrows and Enter, or with
 * the pointer. The field shows the option's label, `value` and the form hold its value. With `allow-custom`, the
 * text people type becomes the value when no option matches it.
 */
export class JlCombobox extends JlFormControl {
  static readonly selector = 'jl-combobox';

  readonly events = this.useEvents<{ change: string; input: string }>();

  readonly options = this.useChange<ComboboxOption[]>([], () => this.renderOptionsChange(), {
    attribute: 'options',
    parse: parseOptions,
  });
  /** The chosen option's value (with `allow-custom`, any text). */
  readonly value = this.useChange('', () => this.renderValue(), { attribute: 'value' });
  readonly placeholder = this.useChange('', (value) => setOrRemove(this._refs.native, 'placeholder', value), {
    attribute: 'placeholder',
  });
  /** The field's name for screen readers, when no visible label names it. */
  readonly label = this.useChange(
    '',
    (value) => {
      setOrRemove(this._refs.native, 'aria-label', value);
      setOrRemove(this._refs.listbox, 'aria-label', value);
    },
    { attribute: 'label' }
  );
  /** Takes the typed text as the value when no option has it as its label. */
  readonly allowCustom = this.useChange(false, () => this.renderValue(), { attribute: 'allow-custom' });
  /** Shows a button that empties the field while it holds text. */
  readonly clearable = this.useChange(false, () => this.renderClear(), { attribute: 'clearable' });
  /** What the list says when no option matches. */
  readonly emptyText = this.useChange(
    DEFAULT_EMPTY_TEXT,
    (value) => {
      this._refs.empty.textContent = value;
    },
    { attribute: 'empty-text' }
  );
  readonly required = this.useChange(
    false,
    (value) => {
      this._refs.native.toggleAttribute('aria-required', value);
      this.reflect('required', value);
      this.renderValidity();
    },
    { attribute: 'required' }
  );
  readonly disabled = this.useChange(false, (value) => this.renderDisabled(value), { attribute: 'disabled' });
  /** Draws the field in the danger colour, for an error the page found itself. */
  readonly invalid = this.useChange(
    false,
    (value) => {
      this.reflect('invalid', value);
      this._refs.native.toggleAttribute('aria-invalid', value);
    },
    { attribute: 'invalid' }
  );
  readonly size = this.useChange<ControlSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(CONTROL_SIZES, 'md'),
  });

  private readonly _listId = uniqueId('jl-combobox-list');

  private readonly _state = {
    active: NONE,
    matches: [] as ComboboxOption[],
    opening: new AbortController(),
    /** What people typed since the last choice; empty shows every option. */
    query: '',
  };

  private readonly _refs = this.useRefs((ref) => ({
    clear: ref<HTMLButtonElement>('.clear'),
    control: ref('.control'),
    empty: ref('.empty'),
    listbox: ref('.listbox'),
    native: ref<HTMLInputElement>('input'),
    popup: ref('.popup'),
    toggle: ref<HTMLButtonElement>('.toggle'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  templateHtml(): Node {
    return (
      <>
        <div class="control" attrs={{ part: 'base' }}>
          <input
            class="native"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            aria-controls={this._listId}
            autocomplete="off"
            spellcheck={false}
          />
          <button class="action clear" type="button" aria-label="Clear" tabIndex={-1} hidden>
            <JlIcon name="x" size={ACTION_ICON_SIZE} />
          </button>
          <button class="action toggle" type="button" aria-label="Show the options" tabIndex={-1}>
            <JlIcon name="chevron-down" size={ICON_SIZE} />
          </button>
        </div>
        <div class="floating panel popup" popover="manual" attrs={{ part: 'list' }}>
          <div class="listbox" role="listbox" id={this._listId} />
          <p class="empty" hidden />
        </div>
      </>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${CONTROL_STYLES}${FLOATING_STYLES}${styles}`;
  }

  onConnect(): void {
    const native = this._refs.native;
    // The native event crosses the shadow root: stop it, ours carries the text.
    this.on(native, 'input', (event) => {
      event.stopPropagation();
      this.onType();
    });
    this.on(native, 'keydown', (event) => this.onKey(event));
    this.on(native, 'blur', () => this.commitText());
    this.on(native, 'click', () => this.openList(false));
    this.on(this._refs.toggle, 'click', () => this.toggleList());
    this.on(this._refs.clear, 'click', () => this.clearValue());
    // A press on the list or on the buttons must not take the focus from the field, or it would commit and close.
    for (const element of [this._refs.popup, this._refs.toggle, this._refs.clear]) {
      this.on(element, 'mousedown', (event) => event.preventDefault());
    }
    this.on(this._refs.listbox, 'click', (event) => this.choose(this.optionAt(event)));
    this.on(this._refs.listbox, 'pointermove', (event) => this.hover(event));
  }

  onDisconnect(): void {
    this._state.opening.abort();
  }

  protected resetValue(): void {
    this._state.query = '';
    this.value.set(this.getAttribute('value') ?? '');
  }

  protected setDisabledByForm(disabled: boolean): void {
    // A disabled field gets this call as it upgrades, before its template exists: wait for it.
    this.whenRendered(() => {
      this._refs.native.disabled = disabled || this.disabled.get();
    });
  }

  private isOpen(): boolean {
    return this._refs.popup.matches(':popover-open');
  }

  private onType(): void {
    const text = this._refs.native.value;
    this._state.query = text;
    this.events.emit('input', text);
    this.renderClear();
    this.openList(true);
  }

  private onKey(event: KeyboardEvent): void {
    const handlers = new Map<string, () => boolean>([
      ['ArrowDown', () => this.onArrow(1, event.altKey)],
      ['ArrowUp', () => this.onArrow(-1, event.altKey)],
      ['Enter', () => this.onEnter()],
      ['Escape', () => this.onEscape()],
      ['Tab', () => this.onTab()],
    ]);
    if (handlers.get(event.key)?.() === true) {
      event.preventDefault();
    }
  }

  /** Down opens the list or moves down it; Alt + Down opens it as it is, Alt + Up closes it. */
  private onArrow(direction: Direction, alt: boolean): boolean {
    if (alt) {
      this.toggleWithAlt(direction);
      return true;
    }
    if (!this.isOpen()) {
      this.openList(false);
      this.activateEdgeIfNone(direction);
      return true;
    }
    this.moveActive(direction);
    return true;
  }

  private toggleWithAlt(direction: Direction): void {
    if (direction > 0) {
      this.openList(false);
      return;
    }
    this.closeList();
  }

  /** Enter chooses the active option; with free text allowed, it takes the text. It submits the form otherwise. */
  private onEnter(): boolean {
    const active = this._state.matches[this._state.active];
    if (this.isOpen() && active !== undefined) {
      this.choose(active);
      return true;
    }
    if (this._state.query !== '') {
      this.commitText();
      return true;
    }
    if (this.isOpen()) {
      this.closeList();
      return true;
    }
    return false;
  }

  /** Escape closes the list, then a second one brings back the chosen option's label over unfinished typing. */
  private onEscape(): boolean {
    if (this.isOpen()) {
      this.closeList();
      return true;
    }
    if (this._state.query === '') {
      return false;
    }
    this._state.query = '';
    this.renderValue();
    return true;
  }

  /** Tab takes the option the arrows reached, and lets the focus move on. */
  private onTab(): boolean {
    const active = this._state.matches[this._state.active];
    if (this.isOpen() && active !== undefined) {
      this.choose(active);
    }
    return false;
  }

  private toggleList(): void {
    if (this.isOpen()) {
      this.closeList();
      return;
    }
    this.openList(false);
    this.focus();
  }

  /**
   * Opens the list, or refreshes it, for what was typed. While typing, the first match is active, so Enter takes
   * it; otherwise the chosen option is. With free text allowed and nothing matching, the list stays closed.
   */
  private openList(typing: boolean): void {
    if (this.disabled.get() || (this.options.get().length === 0 && this._state.query === '')) {
      return;
    }
    this.renderOptions();
    const matches = this._state.matches;
    const autoActive = typing && this._state.query.trim() !== '' && !this.allowCustom.get();
    this._state.active = autoActive ? edgeEnabledIndex(matches, 1) : this.chosenIndex();
    this.renderActive();
    if (matches.length === 0 && this.allowCustom.get()) {
      this.closeList();
      return;
    }
    if (!this.isOpen()) {
      this.showPopup();
    }
    this.revealActive();
  }

  private showPopup(): void {
    const popup = this._refs.popup;
    popup.style.width = `${this._refs.control.offsetWidth}px`;
    popup.showPopover();
    this._state.opening.abort();
    this._state.opening = new AbortController();
    followAnchor(this._refs.control, popup, PLACEMENT, this._state.opening.signal);
    this._refs.native.setAttribute('aria-expanded', 'true');
    this.reflect('open', true);
  }

  private closeList(): void {
    this._state.active = NONE;
    this.renderActive();
    if (!this.isOpen()) {
      return;
    }
    this._refs.popup.hidePopover();
    this._state.opening.abort();
    this._refs.native.setAttribute('aria-expanded', 'false');
    this.reflect('open', false);
  }

  private chosenIndex(): number {
    const value = this.value.get();
    return this._state.matches.findIndex((option) => option.value === value && option.disabled !== true);
  }

  private activateEdgeIfNone(direction: Direction): void {
    if (this._state.active !== NONE) {
      return;
    }
    this._state.active = edgeEnabledIndex(this._state.matches, direction);
    this.renderActive();
    this.revealActive();
  }

  private moveActive(direction: Direction): void {
    this._state.active = nextEnabledIndex(this._state.matches, this._state.active, direction);
    this.renderActive();
    this.revealActive();
  }

  private optionAt(event: Event): ComboboxOption | undefined {
    const item = (event.target as Element).closest<HTMLElement>('[data-index]');
    return item === null ? undefined : this._state.matches[Number(item.dataset.index)];
  }

  private hover(event: PointerEvent): void {
    const option = this.optionAt(event);
    const index = option === undefined ? NONE : this._state.matches.indexOf(option);
    if (index === this._state.active || option?.disabled === true) {
      return;
    }
    this._state.active = index;
    this.renderActive();
  }

  private choose(option: ComboboxOption | undefined): void {
    if (option === undefined || option.disabled === true) {
      return;
    }
    this._state.query = '';
    this.closeList();
    this.commit(option.value);
  }

  /** Leaving the field, or Enter on typed text: an option with that label, free text, nothing, or back as it was. */
  private commitText(): void {
    this.closeList();
    const text = this._refs.native.value.trim();
    const exact = this.optionWithLabel(text);
    this._state.query = '';
    if (exact !== undefined) {
      this.commit(exact.value);
      return;
    }
    if (text === '' || this.allowCustom.get()) {
      this.commit(text);
      return;
    }
    this.renderValue();
  }

  private optionWithLabel(text: string): ComboboxOption | undefined {
    const folded = foldText(text);
    return this.options.get().find((option) => option.disabled !== true && foldText(option.label) === folded);
  }

  /** Sets the value as people chose it, and says so when it changed. */
  private commit(value: string): void {
    const changed = value !== this.value.get();
    this.value.set(value);
    if (changed) {
      this.events.emit('change', value);
    }
  }

  private clearValue(): void {
    this._state.query = '';
    this.closeList();
    this.commit('');
    this.focus();
  }

  /** New options: the field may now show the value's label, and an open list (or one being typed in) refreshes. */
  private renderOptionsChange(): void {
    this.renderValue();
    const typing = this._state.query !== '';
    if (this.isOpen() || (typing && this.matches(':focus-within'))) {
      this.openList(typing);
    }
  }

  private renderOptions(): void {
    const matches = filterOptions(this.options.get(), this._state.query);
    const value = this.value.get();
    this._state.matches = matches;
    this._refs.listbox.replaceChildren(...matches.map((option, index) => this.optionNode(option, index, value)));
    this._refs.listbox.hidden = matches.length === 0;
    this._refs.empty.hidden = matches.length > 0;
  }

  private optionNode(option: ComboboxOption, index: number, value: string): Node {
    return (
      // biome-ignore lint/a11y/useFocusableInteractive: the focus stays in the field, which points here with aria-activedescendant
      <div
        class={option.value === value ? 'option chosen' : 'option'}
        role="option"
        id={`${this._listId}-${index}`}
        data-index={String(index)}
        aria-selected="false"
        aria-disabled={option.disabled === true ? 'true' : undefined}>
        <span class="text">
          <span class="option-label">{highlighted(option.label, this._state.query)}</span>
          {option.description === undefined ? null : <span class="description">{option.description}</span>}
        </span>
        <JlIcon class="check" name="check" size={CHECK_SIZE} />
      </div>
    );
  }

  /** The active option is the one the arrows reached: aria-selected and aria-activedescendant follow it. */
  private renderActive(): void {
    const active = this._state.active;
    for (const item of this._refs.listbox.querySelectorAll<HTMLElement>('[data-index]')) {
      const isActive = Number(item.dataset.index) === active;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', String(isActive));
    }
    setOrRemove(this._refs.native, 'aria-activedescendant', active === NONE ? '' : `${this._listId}-${active}`);
  }

  private revealActive(): void {
    const item = this._refs.listbox.children[this._state.active];
    if (item instanceof HTMLElement) {
      keepInView(this._refs.listbox, item);
    }
  }

  /** The label of the value's option (or the value itself, as free text), unless people are typing. */
  private renderValue(): void {
    const value = this.value.get();
    if (this._state.query === '') {
      this._refs.native.value = this.displayOf(value);
    }
    this.internals.setFormValue(value);
    this.renderValidity();
    this.renderClear();
  }

  private displayOf(value: string): string {
    const option = this.options.get().find((candidate) => candidate.value === value);
    if (option !== undefined) {
      return option.label;
    }
    return this.allowCustom.get() ? value : '';
  }

  private renderValidity(): void {
    if (this.required.get() && this.value.get() === '') {
      this.internals.setValidity({ valueMissing: true }, VALUE_MISSING, this._refs.native);
      return;
    }
    this.internals.setValidity({});
  }

  private renderClear(): void {
    const native = this._refs.native;
    this._refs.clear.hidden = !(this.clearable.get() && !this.disabled.get() && native.value !== '');
  }

  private renderDisabled(disabled: boolean): void {
    this._refs.native.disabled = disabled;
    this._refs.toggle.disabled = disabled;
    this.reflect('disabled', disabled);
    this.closeList();
    this.renderClear();
  }
}

JlCombobox.register();
