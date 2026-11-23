import { css } from '@jadis/core';
import { Check, ChevronDown, X } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlSpinner } from '../atoms/jl-spinner';
import { jsonOf, oneOf } from '../lib/attributes';
import { heldValues, keptLabels, sameValues } from '../lib/combobox';
import { setAriaFlag, setOrRemove, uniqueId } from '../lib/dom';
import { followAnchor } from '../lib/floating';
import { registerIcons } from '../lib/icons';
import { keepInView } from '../lib/keep-in-view';
import { edgeEnabledIndex, filterOptions, foldText, matchParts, nextEnabledIndex } from '../lib/option-filter';
import { CONTROL_SIZES } from '../lib/options';
import { jlText } from '../lib/texts';
import { BASE_STYLES, CONTROL_STYLES, FLOATING_STYLES } from '../styles/shared';
import styles from './jl-combobox-base.css?inline';
import { JlFormControl } from './jl-form-control';

import type { Placement } from '../types/floating.types';
import type { ComboboxFilter, ComboboxOption } from '../types/jl-combobox.types';
import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ check: Check, 'chevron-down': ChevronDown, x: X });

export const COMBOBOX_FILTERS: readonly ComboboxFilter[] = ['local', 'none'];

const ICON_SIZE = 16;
const ACTION_ICON_SIZE = 14;
const CHECK_SIZE = 14;
const SPINNER_SIZE = 14;
const NONE = -1;
const PLACEMENT: Placement = 'bottom-start';
const LOCAL_FILTER: ComboboxFilter = 'local';
const NO_DEBOUNCE = 0;

type Direction = 1 | -1;

/** What the list shows of the options for a typed text: those that match it, or all of them as the page gave them. */
const FILTERS: Record<ComboboxFilter, (options: readonly ComboboxOption[], query: string) => ComboboxOption[]> = {
  local: filterOptions,
  none: (options) => [...options],
};

/** A JSON attribute that should hold a list of options; anything else gives none. */
const parseOptions = (value: string | null): ComboboxOption[] => {
  const parsed = jsonOf<unknown>([])(value);
  return Array.isArray(parsed) ? (parsed as ComboboxOption[]) : [];
};

/** A label with the searched text in a `<mark>`. */
const highlighted = (label: string, query: string): (Node | string)[] =>
  matchParts(label, query).map((part) => (part.matched ? <mark>{part.text}</mark> : part.text));

/**
 * What `jl-combobox` (one value, a `string`) and `jl-multi-combobox` (several, a `string[]`) share: the text field,
 * the list that narrows as people type or that the page fills (`filter="none"`, `loading`, `debounce`), the keys,
 * and the labels kept with the values. Each says what its value is, what a choice and typed text do to it, and what
 * the field shows.
 */
// style exception: subclasses keep the contract (compose rather than inherit) — Jadis inputs are class fields, so two
// components share theirs through one base; revisit if Jadis lets a component take inputs from something composed.
export abstract class JlComboboxBase<Value extends string | string[]> extends JlFormControl {
  readonly events = this.useEvents<{ change: Value; input: string }>();

  readonly options = this.useChange<ComboboxOption[]>([], () => this.renderOptionsChange(), {
    attribute: 'options',
    parse: parseOptions,
  });
  readonly value = this.useChange<Value>(this.shaped([]), () => this.renderValue(), {
    attribute: 'value',
    parse: (text) => this.parseValue(text),
  });
  readonly placeholder = this.useChange('', () => this.renderPlaceholder(), { attribute: 'placeholder' });
  /** The field's name for screen readers, when no visible label names it. */
  readonly label = this.useChange(
    '',
    (value) => {
      setOrRemove(this._refs.native, 'aria-label', value);
      setOrRemove(this._refs.listbox, 'aria-label', value);
    },
    { attribute: 'label' }
  );
  /**
   * Who narrows the options to what was typed: the combobox (`local`), or the page (`none`), which hears `input`
   * and gives the options it found, shown as they are.
   */
  readonly filter = this.useChange<ComboboxFilter>(LOCAL_FILTER, () => this.renderOptionsChange(), {
    attribute: 'filter',
    parse: oneOf(COMBOBOX_FILTERS, LOCAL_FILTER),
  });
  /** The page is finding options: the open list says so, above the options it holds, until the page sets new ones. */
  readonly loading = this.useChange(false, (value) => this.renderLoading(value), { attribute: 'loading' });
  /** What the list says while loading; jlib's own when empty. */
  readonly loadingText = this.useChange('', () => this.renderLoadingText(), { attribute: 'loading-text' });
  /** How long people stop typing, in milliseconds, before `input` fires; 0 fires it at every keystroke. */
  readonly debounce = this.useChange(NO_DEBOUNCE, () => undefined, { attribute: 'debounce' });
  /** Takes the typed text as a value when no option has it as its label. */
  readonly allowCustom = this.useChange(false, () => this.renderValue(), { attribute: 'allow-custom' });
  /** Shows a button that empties the field while it holds something. */
  readonly clearable = this.useChange(false, () => this.renderClear(), { attribute: 'clearable' });
  /** What the list says when no option matches; jlib's own when empty. */
  readonly emptyText = this.useChange('', () => this.renderEmptyText(), { attribute: 'empty-text' });
  readonly required = this.useChange(
    false,
    (value) => {
      setAriaFlag(this._refs.native, 'aria-required', value);
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
      setAriaFlag(this._refs.native, 'aria-invalid', value);
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
    /** The option element the arrows reached: it alone is marked, wherever the filter put it. */
    activeItem: null as HTMLElement | null,
    disabledByForm: false,
    /** The label of each value held, kept when the page gives other options. */
    labels: new Map<string, string>(),
    matches: [] as ComboboxOption[],
    opening: new AbortController(),
    /** What people typed since the last choice; empty shows every option. */
    query: '',
    /** The `input` waiting for the typing to pause. */
    typing: 0,
  };

  // Each option's element, made the first time it shows: typing only filters, orders and highlights them.
  private readonly _items = new WeakMap<ComboboxOption, HTMLElement>();

  private readonly _refs = this.useRefs((ref) => ({
    clear: ref<HTMLButtonElement>('.clear'),
    control: ref('.control'),
    empty: ref('.empty'),
    entry: ref('.entry'),
    listbox: ref('.listbox'),
    loading: ref('.loading'),
    loadingText: ref('.loading-text'),
    native: ref<HTMLInputElement>('input'),
    popup: ref('.popup'),
    status: ref('.status'),
    toggle: ref<HTMLButtonElement>('.toggle'),
  }));

  /** The value of a list of values held. */
  protected abstract shaped(values: string[]): Value;

  /** The value of its `value` attribute. */
  protected abstract parseValue(text: string | null): Value;

  /** What choosing an option does to the value; its label is already kept. */
  protected abstract chooseOption(option: ComboboxOption): void;

  /** What text typed and left, or confirmed with Enter, does to the value; the list is closed already. */
  protected abstract commitTyped(text: string): void;

  /** What the field shows while nobody types. */
  protected abstract fieldText(): string;

  /** What the form gets. */
  protected abstract renderFormValue(): void;

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  templateHtml(): Node {
    return (
      <>
        <div class="control" attrs={{ part: 'base' }}>
          <div class="entry">
            {this.entryStart()}
            <input
              class="native"
              id="field"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="false"
              aria-controls={this._listId}
              autocomplete="off"
              spellcheck={false}
            />
          </div>
          <button class="action clear" type="button" tabIndex={-1} hidden>
            <JlIcon name="x" size={ACTION_ICON_SIZE} />
          </button>
          <button class="action toggle" type="button" tabIndex={-1}>
            <JlIcon name="chevron-down" size={ICON_SIZE} />
          </button>
        </div>
        <div class="floating panel popup" popover="manual" attrs={{ part: 'list' }}>
          <p class="loading" hidden>
            {/* The status below says it: the spinner's own would say it twice. */}
            <span class="spinner" aria-hidden="true">
              <JlSpinner size={SPINNER_SIZE} />
            </span>
            <span class="loading-text" />
          </p>
          <div class="listbox" role="listbox" id={this._listId} />
          <p class="empty" hidden />
        </div>
        <span class="status sr-only" role="status" />
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
    // Around what the field holds, the frame is the field's.
    this.on(this._refs.entry, 'click', (event) => {
      if (event.target === this._refs.entry) {
        this.focus();
      }
    });
    // A press on the list or on the buttons must not take the focus from the field, or it would commit and close.
    for (const element of [this._refs.popup, this._refs.toggle, this._refs.clear]) {
      this.on(element, 'mousedown', (event) => event.preventDefault());
    }
    this.on(this._refs.listbox, 'click', (event) => this.choose(this.optionAt(event)));
    this.on(this._refs.listbox, 'pointermove', (event) => this.hover(event));
  }

  onDisconnect(): void {
    this._state.opening.abort();
    this.cancelInput();
  }

  protected resetValue(): void {
    this._state.query = '';
    this.value.set(this.parseValue(this.getAttribute('value')));
  }

  protected setDisabledByForm(disabled: boolean): void {
    this._state.disabledByForm = disabled;
    // A disabled field gets this call as it upgrades, before its template exists: wait for it.
    this.whenRendered(() => this.drawDisabled());
  }

  /** Disabled by its own input, or by a `<fieldset disabled>` around it. */
  protected isOff(): boolean {
    return this.disabled.get() || this._state.disabledByForm;
  }

  /** What stands in the field before its text: nothing, or the values held as chips. */
  protected entryStart(): Node | null {
    return null;
  }

  /** Backspace in the field: whether the combobox used it. */
  protected onBackspace(): boolean {
    return false;
  }

  /** Tab takes the option the arrows reached, and lets the focus move on. */
  protected onTab(): boolean {
    const active = this._state.matches[this._state.active];
    if (this.isOpen() && active !== undefined) {
      this.choose(active);
    }
    return false;
  }

  /** The active option is the one the arrows reached: it is marked, and alone `aria-selected`. */
  protected markActive(previous: HTMLElement | null, item: HTMLElement | null): void {
    previous?.classList.remove('active');
    item?.classList.add('active');
    previous?.setAttribute('aria-selected', 'false');
    item?.setAttribute('aria-selected', 'true');
  }

  /** Whether an option's value is held, which its check shows. */
  protected drawHeld(item: HTMLElement, held: boolean): void {
    item.classList.toggle('chosen', held);
  }

  /** Whether the placeholder shows while the field's text is empty. */
  protected placeholderShown(): boolean {
    return true;
  }

  /** Whether the clear button has something to clear. */
  protected isFilled(): boolean {
    return this._refs.native.value !== '';
  }

  protected drawTexts(): void {
    this._refs.clear.setAttribute('aria-label', jlText('clear'));
    this._refs.toggle.setAttribute('aria-label', jlText('showOptions'));
    this.renderEmptyText();
    this.renderLoadingText();
    this.renderValidity();
  }

  /** The values held, as a list. */
  protected held(): string[] {
    return heldValues(this.value.get());
  }

  /** A value's label: its option's, the one kept from when it was chosen, or the value itself as free text. */
  protected displayOf(value: string): string {
    const option = this.options.get().find((candidate) => candidate.value === value);
    if (option !== undefined) {
      return option.label;
    }
    return this._state.labels.get(value) ?? (this.allowCustom.get() ? value : '');
  }

  protected rememberLabel(option: ComboboxOption): void {
    this._state.labels.set(option.value, option.label);
  }

  protected optionWithLabel(text: string): ComboboxOption | undefined {
    const folded = foldText(text);
    return this.options.get().find((option) => option.disabled !== true && foldText(option.label) === folded);
  }

  /** Holds the values as people chose them, and says so when they changed. */
  protected commitValues(values: string[]): void {
    const changed = !sameValues(values, this.held());
    this.value.set(this.shaped(values));
    if (changed) {
      this.events.emit('change', this.value.get());
    }
  }

  /** Empties the field's text, as after a choice. */
  protected clearTyped(): void {
    this._state.query = '';
    this._refs.native.value = '';
  }

  /** Makes an option the active one, as after a choice that keeps the list open. */
  protected activate(option: ComboboxOption): void {
    this._state.active = this._state.matches.indexOf(option);
    this.renderActive();
  }

  protected announce(message: string): void {
    const status = this._refs.status;
    if (status.textContent !== message) {
      status.textContent = message;
    }
  }

  /** The field's text (unless people are typing), the placeholder, the form's value, the validity, the clear button. */
  protected renderValue(): void {
    this._state.labels = keptLabels(this._state.labels, this.held(), this.options.get());
    if (this._state.query === '') {
      this._refs.native.value = this.fieldText();
    }
    this.renderPlaceholder();
    this.renderFormValue();
    this.renderValidity();
    this.renderClear();
  }

  /** Without the attribute: the form says its state before the `disabled` input has taken the attribute's change. */
  protected drawDisabled(): void {
    this._refs.native.disabled = this.isOff();
    this._refs.toggle.disabled = this.isOff();
    this.closeList();
    this.renderClear();
  }

  private renderEmptyText(): void {
    this._refs.empty.textContent = this.emptyText.get() || jlText('noResults');
  }

  private renderLoadingText(): void {
    this._refs.loadingText.textContent = this.loadingLabel();
  }

  private loadingLabel(): string {
    return this.loadingText.get() || jlText('loading');
  }

  private isOpen(): boolean {
    return this._refs.popup.matches(':popover-open');
  }

  private onType(): void {
    const text = this._refs.native.value;
    this._state.query = text;
    this.tellInput(text);
    this.renderClear();
    this.openList(true);
  }

  /** Says what was typed: at once, or once the typing pauses for `debounce` milliseconds. */
  private tellInput(text: string): void {
    this.cancelInput();
    const delay = this.debounce.get();
    if (delay <= NO_DEBOUNCE) {
      this.events.emit('input', text);
      return;
    }
    this._state.typing = window.setTimeout(() => this.events.emit('input', text), delay);
  }

  /** A choice made before the typing paused: the text it would have told is gone. */
  private cancelInput(): void {
    window.clearTimeout(this._state.typing);
  }

  private onKey(event: KeyboardEvent): void {
    const handlers = new Map<string, () => boolean>([
      ['ArrowDown', () => this.onArrow(1, event.altKey)],
      ['ArrowUp', () => this.onArrow(-1, event.altKey)],
      ['Backspace', () => this.onBackspace()],
      ['Enter', () => this.onEnter()],
      ['Escape', () => this.onEscape()],
      ['Tab', () => this.onTab()],
    ]);
    const handler = handlers.get(event.key);
    if (handler === undefined) {
      return;
    }
    if (handler()) {
      event.preventDefault();
      return;
    }
    // An Enter the list did not use submits the form, as from a native field.
    if (event.key === 'Enter') {
      this.submitImplicitly(event);
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

  /** Escape closes the list, then a second one puts away unfinished typing. */
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
   * it; otherwise the first option held is. With free text allowed and nothing matching, the list stays closed,
   * unless the page is still finding options.
   */
  protected openList(typing: boolean): void {
    const loading = this.loading.get();
    if (this.isOff() || (this.options.get().length === 0 && this._state.query === '' && !loading)) {
      return;
    }
    this.renderOptions();
    const matches = this._state.matches;
    const autoActive = typing && this._state.query.trim() !== '' && !this.allowCustom.get();
    this._state.active = autoActive ? edgeEnabledIndex(matches, 1) : this.chosenIndex();
    this.renderActive();
    if (matches.length === 0 && this.allowCustom.get() && !loading) {
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

  protected closeList(): void {
    this._state.active = NONE;
    this.renderActive();
    if (!this.isOpen()) {
      return;
    }
    this._refs.popup.hidePopover();
    this._state.opening.abort();
    this._refs.native.setAttribute('aria-expanded', 'false');
    this.reflect('open', false);
    this.announce('');
  }

  /** The first option held among those shown. */
  private chosenIndex(): number {
    const held = new Set(this.held());
    return this._state.matches.findIndex((option) => held.has(option.value) && option.disabled !== true);
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
    this.cancelInput();
    this.rememberLabel(option);
    this.chooseOption(option);
  }

  /** Leaving the field, or Enter on typed text. */
  private commitText(): void {
    this.closeList();
    this.cancelInput();
    const text = this._refs.native.value.trim();
    this._state.query = '';
    this.commitTyped(text);
  }

  private clearValue(): void {
    this.cancelInput();
    this.closeList();
    this.clearTyped();
    this.commitValues([]);
    this.focus();
  }

  /** What screen readers hear as the list shows: how many options match, or that none does. */
  private countText(count: number): string {
    if (count === 0) {
      return this.emptyText.get() || jlText('noResults');
    }
    return count === 1 ? jlText('oneResult') : jlText('resultCount', { count });
  }

  /** New options: the field may now show the value's label, and an open list (or one being typed in) refreshes. */
  private renderOptionsChange(): void {
    this.renderValue();
    this.refreshList();
  }

  private refreshList(): void {
    const typing = this._state.query !== '';
    if (this.isOpen() || (typing && this.matches(':focus-within'))) {
      this.openList(typing);
    }
  }

  private renderLoading(loading: boolean): void {
    this.reflect('loading', loading);
    setAriaFlag(this._refs.listbox, 'aria-busy', loading);
    this.refreshList();
  }

  /**
   * The options to show for what was typed, in their order: elements already made are moved, not made again. While
   * the page finds options, the list says so above them, and says nothing of an empty answer yet.
   */
  private renderOptions(): void {
    const matches = FILTERS[this.filter.get()](this.options.get(), this._state.query);
    const held = new Set(this.held());
    const listbox = this._refs.listbox;
    const loading = this.loading.get();
    this._state.matches = matches;
    matches.forEach((option, index) => {
      const item = this.drawOption(option, index, held);
      const current = listbox.children.item(index);
      // An option already in its place stays: moving it would make the browser lay it out again.
      if (current !== item) {
        listbox.insertBefore(item, current);
      }
    });
    while (listbox.children.length > matches.length) {
      listbox.lastElementChild?.remove();
    }
    listbox.hidden = matches.length === 0;
    this._refs.loading.hidden = !loading;
    this._refs.empty.hidden = loading || matches.length > 0;
    this.announce(loading ? this.loadingLabel() : this.countText(matches.length));
  }

  /** The option's element, made once, with where it now sits, whether it is held, and the typed text marked. */
  private drawOption(option: ComboboxOption, index: number, held: ReadonlySet<string>): HTMLElement {
    const item = this._items.get(option) ?? this.optionNode(option);
    this._items.set(option, item);
    item.id = `${this._listId}-${index}`;
    item.dataset.index = String(index);
    this.drawHeld(item, held.has(option.value));
    item.querySelector('.option-label')?.replaceChildren(...highlighted(option.label, this._state.query));
    return item;
  }

  private optionNode(option: ComboboxOption): HTMLElement {
    const item: HTMLElement = (
      // biome-ignore lint/a11y/useFocusableInteractive: the focus stays in the field, which points here with aria-activedescendant
      <div
        class="option"
        role="option"
        aria-selected="false"
        aria-disabled={option.disabled === true ? 'true' : undefined}>
        <span class="text">
          <span class="option-label" />
          {option.description === undefined ? null : <span class="description">{option.description}</span>}
        </span>
        <JlIcon class="check" name="check" size={CHECK_SIZE} />
      </div>
    );
    return item;
  }

  /** aria-activedescendant follows the option the arrows reached. */
  private renderActive(): void {
    const option = this._state.matches[this._state.active];
    const item = option === undefined ? null : (this._items.get(option) ?? null);
    this.markActive(this._state.activeItem, item);
    this._state.activeItem = item;
    setOrRemove(this._refs.native, 'aria-activedescendant', item?.id ?? '');
  }

  private revealActive(): void {
    const item = this._state.activeItem;
    if (item !== null) {
      keepInView(this._refs.listbox, item);
    }
  }

  private renderPlaceholder(): void {
    setOrRemove(this._refs.native, 'placeholder', this.placeholderShown() ? this.placeholder.get() : '');
  }

  private renderValidity(): void {
    if (this.required.get() && this.held().length === 0) {
      this.internals.setValidity({ valueMissing: true }, jlText('chooseOption'), this._refs.native);
      return;
    }
    this.internals.setValidity({});
  }

  private renderClear(): void {
    this._refs.clear.hidden = !(this.clearable.get() && !this.isOff() && this.isFilled());
  }

  private renderDisabled(disabled: boolean): void {
    this.reflect('disabled', disabled);
    this.drawDisabled();
  }
}
