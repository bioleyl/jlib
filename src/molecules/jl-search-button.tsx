import { css } from '@jadis/core';
import { Search } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlKbd } from '../atoms/jl-kbd';
import { JlElement } from '../base/jl-element';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { parseShortcut, shortcutAria } from '../lib/key-shortcut';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-search-button.css?raw';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ search: Search });

const DEFAULT_LABEL = 'Search';
const DEFAULT_HOTKEY = 'mod+k';
// `hotkey="none"` shows no keys.
const NO_HOTKEY = 'none';
const ICON_SIZE = 15;
const MAC_PATTERN = /Mac|iPhone|iPad|iPod/;

const isMac = (): boolean => MAC_PATTERN.test(navigator.userAgent);

/**
 * What opens an app's command palette: it looks like a search field, with the palette's keys (Ctrl K, ⌘K on a
 * Mac). `compact` keeps the icon alone, for a folded side nav or a phone's top bar. Listen to `press`; the keys are
 * the palette's own (`jl-command-palette` listens to them), the button only shows them.
 */
export class JlSearchButton extends JlElement {
  static readonly selector = 'jl-search-button';

  readonly events = this.useEvents<{ press: undefined }>();

  /** The text, and the button's name: "Search". */
  readonly label = this.useChange(DEFAULT_LABEL, () => this.renderLabel(), { attribute: 'label' });
  /** The keys that open the palette, as `jl-kbd` writes them: `mod+k`; `none` for no keys. */
  readonly hotkey = this.useChange(DEFAULT_HOTKEY, () => this.renderHotkey(), { attribute: 'hotkey' });
  /** The icon alone, the label as its tooltip. */
  readonly compact = this.useChange(false, (value) => this.reflect('compact', value), { attribute: 'compact' });

  private readonly _refs = this.useRefs((ref) => ({
    button: ref('button'),
    keys: ref<JlKbd>('jl-kbd'),
    text: ref('.text'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.button.focus(options);
  }

  templateHtml(): Node {
    return (
      <button type="button" class="search" attrs={{ part: 'base' }}>
        <JlIcon name="search" size={ICON_SIZE} />
        <span class="text" />
        <JlKbd />
      </button>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.renderLabel();
    this.renderHotkey();
    this.on(this._refs.button, 'click', () => this.events.emit('press'));
  }

  private renderLabel(): void {
    const label = this.label.get() || DEFAULT_LABEL;
    this._refs.text.textContent = label;
    this._refs.button.setAttribute('aria-label', label);
    this._refs.button.title = label;
  }

  private renderHotkey(): void {
    const text = this.hotkey.get();
    const shortcut = text === NO_HOTKEY ? null : parseShortcut(text);
    this._refs.keys.keys.set(shortcut === null ? '' : text);
    this._refs.keys.hidden = shortcut === null;
    setOrRemove(this._refs.button, 'aria-keyshortcuts', shortcut === null ? '' : shortcutAria(shortcut, isMac()));
  }
}

JlSearchButton.register();
