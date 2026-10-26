import { css } from '@jadis/core';
import { Search, X } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlSpinner } from '../atoms/jl-spinner';
import { JlFormControl } from '../base/jl-form-control';
import { oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import {
  hasCommandModifier,
  matchesShortcut,
  parseShortcut,
  shortcutAria,
  shortcutLabels,
} from '../lib/key-shortcut';
import { CONTROL_SIZES } from '../lib/options';
import { BASE_STYLES, CONTROL_STYLES } from '../styles/shared';
import styles from './jl-search.css?raw';

import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ search: Search, x: X });

const DEFAULT_DEBOUNCE_MS = 250;
const ICON_SIZE = 16;
const ACTION_ICON_SIZE = 14;
const DEFAULT_LABEL = 'Search';
const MAC_PATTERN = /Mac|iPhone|iPad|iPod/;
// Where a key press is typing, so a shortcut without a modifier must leave it alone.
const TYPING_TARGETS = 'input, textarea, select, [contenteditable]';

const isMac = (): boolean => MAC_PATTERN.test(navigator.userAgent);

/** Whether the key was pressed while typing in a field, looking through shadow roots. */
function isTyping(event: KeyboardEvent): boolean {
  const [target] = event.composedPath();
  return target instanceof HTMLElement && (target.isContentEditable || target.matches(TYPING_TARGETS));
}

/**
 * A search field: `search` fires once typing pauses for `debounce` milliseconds (and at once on Enter), `input` at
 * each key. A `shortcut` ("/", "mod+k") focuses it from anywhere on the page and shows its keys in the field.
 */
export class JlSearch extends JlFormControl {
  static readonly selector = 'jl-search';

  readonly events = this.useEvents<{ input: string; search: string; enter: string }>();

  readonly value = this.useChange('', (value) => this.renderValue(value), { attribute: 'value' });
  readonly placeholder = this.useChange('', (value) => setOrRemove(this._refs.native, 'placeholder', value), {
    attribute: 'placeholder',
  });
  /** The field's name for screen readers; "Search" when nothing else names it. */
  readonly label = this.useChange(
    '',
    (value) => this._refs.native.setAttribute('aria-label', value || DEFAULT_LABEL),
    {
      attribute: 'label',
    }
  );
  /** How long typing must pause, in milliseconds, before `search` fires. */
  readonly debounce = this.useChange(DEFAULT_DEBOUNCE_MS, () => undefined, { attribute: 'debounce' });
  /** Keys that focus the field from anywhere: "/" or "mod+k" (⌘ on a Mac, Ctrl elsewhere). */
  readonly shortcut = this.useChange('', () => this.renderShortcut(), { attribute: 'shortcut' });
  readonly size = this.useChange<ControlSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(CONTROL_SIZES, 'md'),
  });
  /** Shows a spinner in place of the search icon, while results are on their way. */
  readonly loading = this.useChange(
    false,
    (value) => {
      this._refs.icon.hidden = value;
      this._refs.spinner.hidden = !value;
      this._refs.native.toggleAttribute('aria-busy', value);
      this.reflect('loading', value);
    },
    { attribute: 'loading' }
  );
  readonly disabled = this.useChange(
    false,
    (value) => {
      this.reflect('disabled', value);
      this.renderDisabled();
    },
    { attribute: 'disabled' }
  );

  private readonly _form = { disabled: false };

  private readonly _state = { lastSearch: '', timer: 0 };

  private readonly _refs = this.useRefs((ref) => ({
    clear: ref('.clear'),
    icon: ref<JlIcon>('.icon'),
    keys: ref('.keys'),
    native: ref<HTMLInputElement>('input'),
    spinner: ref<JlSpinner>('jl-spinner'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  /** Selects the whole text, ready to be replaced. */
  select(): void {
    this._refs.native.select();
  }

  /** Empties the field, as its clear button does: `input` and `search` fire with `''`, and it takes the focus. */
  clear(): void {
    this.value.set('');
    this.events.emit('input', '');
    this.search('');
    this.focus();
  }

  templateHtml(): Node {
    return (
      <div class="control" attrs={{ part: 'base' }}>
        <span class="adornment lead">
          <JlIcon class="icon" name="search" size={ICON_SIZE} />
          <JlSpinner size={ICON_SIZE} hidden />
        </span>
        <input class="native" type="search" autocomplete="off" />
        <button class="action clear" type="button" aria-label="Clear the search" tabIndex={-1} hidden>
          <JlIcon name="x" size={ACTION_ICON_SIZE} />
        </button>
        <span class="keys" aria-hidden="true" hidden />
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
      this.scheduleSearch();
    });
    this.on(native, 'keydown', (event) => this.onFieldKey(event));
    this.on(this._refs.clear, 'click', () => this.clear());
    document.addEventListener('keydown', (event) => this.onPageKey(event), { signal: this.killSignal });
  }

  onDisconnect(): void {
    window.clearTimeout(this._state.timer);
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
    this.renderActions();
  }

  private onFieldKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.search(this.value.get());
      this.events.emit('enter', this.value.get());
      return;
    }
    // Escape empties a field with text, as native search fields do; an empty one lets Escape through (a dialog).
    if (event.key === 'Escape' && this.value.get() !== '') {
      event.preventDefault();
      event.stopPropagation();
      this.clear();
    }
  }

  private onPageKey(event: KeyboardEvent): void {
    const shortcut = parseShortcut(this.shortcut.get());
    if (shortcut === null || event.defaultPrevented || this._refs.native.disabled) {
      return;
    }
    if (!matchesShortcut(event, shortcut, isMac()) || (!hasCommandModifier(shortcut) && isTyping(event))) {
      return;
    }
    event.preventDefault();
    this.focus();
    this.select();
  }

  private scheduleSearch(): void {
    window.clearTimeout(this._state.timer);
    this._state.timer = window.setTimeout(() => {
      if (this.value.get() !== this._state.lastSearch) {
        this.search(this.value.get());
      }
    }, this.debounce.get());
  }

  private search(query: string): void {
    window.clearTimeout(this._state.timer);
    this._state.lastSearch = query;
    this.events.emit('search', query);
  }

  private renderValue(value: string): void {
    const native = this._refs.native;
    if (native.value !== value) {
      native.value = value;
    }
    this.internals.setFormValue(value);
    this.renderActions();
  }

  private renderActions(): void {
    const hasText = this.value.get() !== '';
    this._refs.clear.hidden = !hasText || this._refs.native.disabled;
    this._refs.keys.hidden = hasText || this._refs.keys.childElementCount === 0;
  }

  private renderShortcut(): void {
    const shortcut = parseShortcut(this.shortcut.get());
    const labels = shortcut === null ? [] : shortcutLabels(shortcut, isMac());
    this._refs.keys.replaceChildren(...labels.map((label) => <kbd class="key">{label}</kbd>));
    setOrRemove(this._refs.native, 'aria-keyshortcuts', shortcut === null ? '' : shortcutAria(shortcut, isMac()));
    this.renderActions();
  }
}

JlSearch.register();
