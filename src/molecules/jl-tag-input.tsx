import { css } from '@jadis/core';
import { X } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlFormControl } from '../base/jl-form-control';
import { clampedNumber, jsonOf, oneOf } from '../lib/attributes';
import { setOrRemove, uniqueId } from '../lib/dom';
import { followAnchor } from '../lib/floating';
import { registerIcons } from '../lib/icons';
import { keepInView } from '../lib/keep-in-view';
import { filterOptions, matchParts, nextEnabledIndex } from '../lib/option-filter';
import { CONTROL_SIZES } from '../lib/options';
import { addTags, hasTag, hasTagSeparator, splitTags } from '../lib/tags';
import { jlText } from '../lib/texts';
import { BASE_STYLES, CONTROL_STYLES, FLOATING_STYLES } from '../styles/shared';
import styles from './jl-tag-input.css?raw';

import type { Placement } from '../types/floating.types';
import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ x: X });

const REMOVE_ICON_SIZE = 12;
const NONE = -1;
const PLACEMENT: Placement = 'bottom-start';
const NO_LIMIT = 0;
const COMMA = ',';
// Suggestions shown at once: a short list helps, a long one is a select.
const MAX_SUGGESTIONS = 8;
// How long a duplicate tag is pointed at, matching the animation in the CSS.
const FLASH_MS = 600;

type Direction = 1 | -1;
type Suggestion = { label: string; disabled?: boolean };

/** A JSON attribute that should hold a list of texts; anything else gives an empty list. */
const parseTextList = (value: string | null): string[] => {
  const parsed = jsonOf<unknown>([])(value);
  return Array.isArray(parsed) ? parsed.map(String) : [];
};

const highlighted = (label: string, query: string): (Node | string)[] =>
  matchParts(label, query).map((part) => (part.matched ? <mark>{part.text}</mark> : part.text));

/**
 * A field that collects short texts as chips: Enter or a comma adds what was typed, Backspace in the empty field
 * removes the last chip, a pasted list adds each of its items. The form gets each tag under the field's name.
 */
export class JlTagInput extends JlFormControl {
  static readonly selector = 'jl-tag-input';

  readonly events = this.useEvents<{ change: string[] }>();

  readonly value = this.useChange<string[]>([], () => this.renderTags(), {
    attribute: 'value',
    parse: parseTextList,
  });
  readonly placeholder = this.useChange('', () => this.renderPlaceholder(), { attribute: 'placeholder' });
  /** The field's name for screen readers, when no visible label names it. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.native, 'aria-label', value), {
    attribute: 'label',
  });
  /** The most tags the field takes; 0 for no limit. */
  readonly max = this.useChange(NO_LIMIT, () => this.renderTags(), {
    attribute: 'max',
    parse: clampedNumber(NO_LIMIT, 0, Number.MAX_SAFE_INTEGER),
  });
  /** Tags offered in a list while people type. */
  readonly suggestions = this.useChange<string[]>([], (value) => this.renderSuggestionRole(value), {
    attribute: 'suggestions',
    parse: parseTextList,
  });
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

  private readonly _listId = uniqueId('jl-tag-input-list');

  private readonly _state = {
    active: NONE,
    matches: [] as Suggestion[],
    opening: new AbortController(),
  };

  // The form's entries carry the field's name: they are written again when it changes.
  private readonly _nameWatch = new MutationObserver(() => this.renderFormValue());

  private readonly _refs = this.useRefs((ref) => ({
    control: ref('.control'),
    listbox: ref('.listbox'),
    native: ref<HTMLInputElement>('input'),
    popup: ref('.popup'),
    status: ref('.status'),
    tags: ref('.tags'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  templateHtml(): Node {
    return (
      <>
        <div class="control" attrs={{ part: 'base' }}>
          {/* biome-ignore lint/a11y/noRedundantRoles: a list drawn without bullets loses its role in Safari */}
          <ul class="tags" role="list" />
          <input class="native" autocomplete="off" />
        </div>
        <div class="floating panel popup" popover="manual" attrs={{ part: 'list' }}>
          <div class="listbox" role="listbox" id={this._listId} />
        </div>
        <span class="status sr-only" role="status" />
      </>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${CONTROL_STYLES}${FLOATING_STYLES}${styles}`;
  }

  protected drawTexts(): void {
    this.renderTags();
    this.renderValidity();
  }

  onConnect(): void {
    const native = this._refs.native;
    this._nameWatch.observe(this, { attributeFilter: ['name'], attributes: true });
    this.renderFormValue();
    this.on(native, 'input', (event) => {
      event.stopPropagation();
      this.onType();
    });
    this.on(native, 'keydown', (event) => this.onFieldKey(event));
    this.on(native, 'paste', (event) => this.onPaste(event));
    this.on(native, 'blur', () => this.commitText());
    this.on(this._refs.control, 'click', (event) => this.onControlClick(event));
    this.on(this._refs.tags, 'keydown', (event) => this.onTagKey(event));
    this.on(this._refs.popup, 'mousedown', (event) => event.preventDefault());
    this.on(this._refs.listbox, 'click', (event) => this.pick(this.suggestionAt(event)));
  }

  onDisconnect(): void {
    this._nameWatch.disconnect();
    this._state.opening.abort();
  }

  protected resetValue(): void {
    this._refs.native.value = '';
    this.value.set(parseTextList(this.getAttribute('value')));
  }

  protected setDisabledByForm(disabled: boolean): void {
    // A disabled field gets this call as it upgrades, before its template exists: wait for it.
    this.whenRendered(() => {
      this._refs.native.disabled = disabled || this.disabled.get();
    });
  }

  private onType(): void {
    const native = this._refs.native;
    if (hasTagSeparator(native.value)) {
      this.add(splitTags(native.value));
      return;
    }
    this.renderMatches();
  }

  private onFieldKey(event: KeyboardEvent): void {
    const handlers = new Map<string, () => boolean>([
      [
        COMMA,
        () => {
          this.commitText();
          return true;
        },
      ],
      ['ArrowDown', () => this.moveActive(1)],
      ['ArrowLeft', () => this.focusLastTag()],
      ['ArrowUp', () => this.moveActive(-1)],
      ['Backspace', () => this.removeLastIfEmpty()],
      ['Enter', () => this.onEnter()],
      ['Escape', () => this.closeList()],
    ]);
    if (handlers.get(event.key)?.() === true) {
      event.preventDefault();
    }
  }

  /** Enter adds the suggestion the arrows reached, or the typed text; in an empty field it submits the form. */
  private onEnter(): boolean {
    const active = this._state.matches[this._state.active];
    if (this.isOpen() && active !== undefined) {
      this.pick(active);
      return true;
    }
    return this.commitText();
  }

  /** A pasted list adds each of its items; a single word is pasted as text. */
  private onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!hasTagSeparator(pasted)) {
      return;
    }
    event.preventDefault();
    const native = this._refs.native;
    const before = native.value.slice(0, native.selectionStart ?? native.value.length);
    const after = native.value.slice(native.selectionEnd ?? native.value.length);
    this.add(splitTags(`${before}${pasted}${after}`));
  }

  private onControlClick(event: MouseEvent): void {
    const remove = (event.target as Element).closest<HTMLElement>('.tag-remove');
    if (remove !== null) {
      this.removeAt(Number(remove.dataset.index));
      this.focus();
      return;
    }
    if (event.target === this._refs.control) {
      this.focus();
    }
  }

  /** On a chip's remove button: arrows move between chips and back to the field, Backspace or Delete removes it. */
  private onTagKey(event: KeyboardEvent): void {
    const button = (event.target as Element).closest<HTMLElement>('.tag-remove');
    if (button === null) {
      return;
    }
    const index = Number(button.dataset.index);
    const handlers = new Map<string, () => void>([
      ['ArrowLeft', () => this.focusTag(Math.max(0, index - 1))],
      ['ArrowRight', () => this.focusTag(index + 1)],
      ['Backspace', () => this.removeAndFocus(index)],
      ['Delete', () => this.removeAndFocus(index)],
    ]);
    const handler = handlers.get(event.key);
    if (handler !== undefined) {
      event.preventDefault();
      handler();
    }
  }

  /** Adds the typed text as tags; true when there was text to add. */
  private commitText(): boolean {
    const text = this._refs.native.value;
    this.closeList();
    if (text.trim() === '') {
      return false;
    }
    this.add(splitTags(text));
    return true;
  }

  private add(candidates: string[]): void {
    const before = this.value.get();
    const result = addTags(before, candidates, this.max.get());
    const added = result.tags.slice(before.length);
    // When the field is full, the text stays: people see it was not taken.
    const refusedForRoom = added.length === 0 && result.duplicates.length === 0;
    if (!refusedForRoom) {
      this._refs.native.value = '';
    }
    this.closeList();
    if (added.length > 0) {
      this.value.set(result.tags);
      this.announce(jlText('addedNamed', { names: added.join(', ') }));
      this.events.emit('change', result.tags);
    }
    this.flash(result.duplicates);
  }

  private removeAt(index: number): void {
    const tags = this.value.get();
    const removed = tags[index];
    if (removed === undefined || this.disabled.get()) {
      return;
    }
    const next = tags.filter((_, position) => position !== index);
    this.value.set(next);
    this.announce(jlText('removedNamed', { name: removed }));
    this.events.emit('change', next);
  }

  private removeAndFocus(index: number): void {
    this.removeAt(index);
    const count = this.value.get().length;
    if (count === 0) {
      this.focus();
      return;
    }
    this.focusTag(Math.max(0, index - 1));
  }

  private removeLastIfEmpty(): boolean {
    const native = this._refs.native;
    if (native.value !== '' || this.value.get().length === 0) {
      return false;
    }
    this.removeAt(this.value.get().length - 1);
    return true;
  }

  private focusLastTag(): boolean {
    const native = this._refs.native;
    const count = this.value.get().length;
    if (native.selectionStart !== 0 || native.selectionEnd !== 0 || count === 0 || this.disabled.get()) {
      return false;
    }
    this.focusTag(count - 1);
    return true;
  }

  /** Focuses a chip's remove button; past the last chip, the field. */
  private focusTag(index: number): void {
    const button = this._refs.tags.querySelector<HTMLElement>(`.tag-remove[data-index="${index}"]`);
    if (button === null) {
      this.focus();
      return;
    }
    button.focus();
  }

  /** Points at the chips people tried to add again. */
  private flash(duplicates: string[]): void {
    const tags = this.value.get();
    for (const chip of this._refs.tags.querySelectorAll<HTMLElement>('.tag')) {
      const tag = tags[Number(chip.dataset.index)];
      if (tag === undefined || !hasTag(duplicates, tag)) {
        continue;
      }
      chip.classList.add('flash');
      window.setTimeout(() => chip.classList.remove('flash'), FLASH_MS);
    }
  }

  private announce(message: string): void {
    this._refs.status.textContent = message;
  }

  private isOpen(): boolean {
    return this._refs.popup.matches(':popover-open');
  }

  /** The suggestions that match the typed text and are not tags yet; the list opens while there are some. */
  private renderMatches(): void {
    const query = this._refs.native.value.trim();
    const tags = this.value.get();
    const candidates = this.suggestions
      .get()
      .filter((suggestion) => !hasTag(tags, suggestion))
      .map((label) => ({ label }));
    const matches = query === '' ? [] : filterOptions(candidates, query).slice(0, MAX_SUGGESTIONS);
    this._state.matches = matches;
    this._state.active = NONE;
    this._refs.listbox.replaceChildren(
      ...matches.map((match, index) => (
        // biome-ignore lint/a11y/useFocusableInteractive: the focus stays in the field, which points here with aria-activedescendant
        <div
          class="option"
          role="option"
          id={`${this._listId}-${index}`}
          data-index={String(index)}
          aria-selected="false">
          {highlighted(match.label, query)}
        </div>
      ))
    );
    this.renderActive();
    if (matches.length === 0) {
      this.closeList();
      return;
    }
    this.openList();
  }

  private openList(): void {
    if (this.isOpen()) {
      return;
    }
    const popup = this._refs.popup;
    popup.showPopover();
    this._state.opening.abort();
    this._state.opening = new AbortController();
    followAnchor(this._refs.native, popup, PLACEMENT, this._state.opening.signal);
    this._refs.native.setAttribute('aria-expanded', 'true');
  }

  /** Closes the suggestions; true when they were open, so Escape goes no further. */
  private closeList(): boolean {
    if (!this.isOpen()) {
      return false;
    }
    this._refs.popup.hidePopover();
    this._state.opening.abort();
    this._state.active = NONE;
    this.renderActive();
    this._refs.native.setAttribute('aria-expanded', 'false');
    return true;
  }

  private moveActive(direction: Direction): boolean {
    if (!this.isOpen()) {
      return false;
    }
    this._state.active = nextEnabledIndex(this._state.matches, this._state.active, direction);
    this.renderActive();
    const item = this._refs.listbox.children[this._state.active];
    if (item instanceof HTMLElement) {
      keepInView(this._refs.listbox, item);
    }
    return true;
  }

  private renderActive(): void {
    const active = this._state.active;
    for (const item of this._refs.listbox.querySelectorAll<HTMLElement>('[data-index]')) {
      const isActive = Number(item.dataset.index) === active;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', String(isActive));
    }
    setOrRemove(this._refs.native, 'aria-activedescendant', active === NONE ? '' : `${this._listId}-${active}`);
  }

  private suggestionAt(event: Event): Suggestion | undefined {
    const item = (event.target as Element).closest<HTMLElement>('[data-index]');
    return item === null ? undefined : this._state.matches[Number(item.dataset.index)];
  }

  private pick(suggestion: Suggestion | undefined): void {
    if (suggestion === undefined) {
      return;
    }
    this.add([suggestion.label]);
    this.focus();
  }

  /** The field is a combobox only when it offers suggestions. */
  private renderSuggestionRole(suggestions: string[]): void {
    const native = this._refs.native;
    const offers = suggestions.length > 0;
    setOrRemove(native, 'role', offers ? 'combobox' : '');
    setOrRemove(native, 'aria-autocomplete', offers ? 'list' : '');
    setOrRemove(native, 'aria-controls', offers ? this._listId : '');
    setOrRemove(native, 'aria-expanded', offers ? String(this.isOpen()) : '');
  }

  private renderTags(): void {
    const tags = this.value.get();
    const editable = !this.disabled.get();
    this._refs.tags.replaceChildren(
      ...tags.map((tag, index) => (
        <li class="tag" data-index={String(index)}>
          <span class="tag-text">{tag}</span>
          {editable ? (
            <button
              class="tag-remove"
              type="button"
              tabIndex={-1}
              aria-label={jlText('removeNamed', { name: tag })}
              data-index={String(index)}>
              <JlIcon name="x" size={REMOVE_ICON_SIZE} />
            </button>
          ) : null}
        </li>
      ))
    );
    const max = this.max.get();
    this.reflect('full', max !== NO_LIMIT && tags.length >= max);
    this.renderPlaceholder();
    this.renderFormValue();
    this.renderValidity();
  }

  /** The placeholder shows while there is no tag; chips take its place. */
  private renderPlaceholder(): void {
    const empty = this.value.get().length === 0;
    setOrRemove(this._refs.native, 'placeholder', empty ? this.placeholder.get() : '');
  }

  /** Each tag is its own entry under the field's name, as several checked boxes of one name would be. */
  private renderFormValue(): void {
    const name = this.getAttribute('name') ?? '';
    if (name === '') {
      this.internals.setFormValue(null);
      return;
    }
    const data = new FormData();
    for (const tag of this.value.get()) {
      data.append(name, tag);
    }
    this.internals.setFormValue(data);
  }

  private renderValidity(): void {
    if (this.required.get() && this.value.get().length === 0) {
      this.internals.setValidity({ valueMissing: true }, jlText('addTag'), this._refs.native);
      return;
    }
    this.internals.setValidity({});
  }

  private renderDisabled(disabled: boolean): void {
    this._refs.native.disabled = disabled;
    this.reflect('disabled', disabled);
    this.closeList();
    this.renderTags();
  }
}

JlTagInput.register();
