import { css } from '@jadis/core';
import { Search } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlSpinner } from '../atoms/jl-spinner';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { highlightSegments } from '../lib/fuzzy';
import { hotkeyLabels, isApplePlatform, matchesHotkey, parseHotkey } from '../lib/hotkey';
import { registerIcons } from '../lib/icons';
import { groupMatches, matchCommands } from '../lib/palette';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-command-palette.css?raw';

import type { PaletteCommand, PaletteGroup, PaletteMatch } from '../types/jl-command-palette.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ search: Search });

const DEFAULT_HOTKEY = 'mod+k';
const NO_HOTKEY = 'none';
const SEARCH_ICON_SIZE = 18;
const DEFAULT_DEBOUNCE_MS = 250;
const OPTION_ICON_SIZE = 16;

/** How far each key moves the active command. */
const MOVES: ReadonlyMap<string, number> = new Map([
  ['ArrowDown', 1],
  ['ArrowUp', -1],
]);

const optionId = (index: number): string => `option-${index}`;

const onApple = (): boolean => isApplePlatform(navigator.platform);

function keycaps(shortcut: string): Node[] {
  return hotkeyLabels(shortcut, onApple()).map((label) => <kbd>{label}</kbd>);
}

function highlighted(label: string, positions: readonly number[]): (Node | string)[] {
  return highlightSegments(label, positions).map((segment) =>
    segment.marked ? <mark>{segment.text}</mark> : segment.text
  );
}

/**
 * A search box over every command of an app, opened by ⌘K (Ctrl+K off Apple) or `show()`. Typing filters the
 * commands by their letters in order, best matches first, under their groups; arrows move, Enter runs the command
 * (`select` with its id) and Escape closes. It sits near the top of the window, on the browser's modal `<dialog>`.
 */
export class JlCommandPalette extends JlElement {
  static readonly selector = 'jl-command-palette';

  /** `search`: what was typed, once typing pauses (and empty when it opens), for a page that answers it. */
  readonly events = this.useEvents<{ select: string; open: undefined; close: undefined; search: string }>();

  readonly commands = this.useChange<PaletteCommand[]>([], () => this.renderResults(), {
    attribute: 'commands',
    parse: jsonOf<PaletteCommand[]>([]),
  });
  readonly open = this.useChange(false, (value) => this.renderOpen(value), { attribute: 'open' });
  readonly placeholder = this.useChange(
    jlText('commandPlaceholder'),
    (value) => {
      this._refs.input.placeholder = value;
    },
    { attribute: 'placeholder' }
  );
  /** The keys that open and close it from anywhere on the page; `none` for no keys. `mod` is ⌘ or Ctrl. */
  readonly hotkey = this.useChange(DEFAULT_HOTKEY, () => this.renderHotkey(), { attribute: 'hotkey' });
  /** What it says when nothing matches. */
  readonly emptyText = this.useChange(
    jlText('noCommands'),
    (value) => {
      this._refs.empty.textContent = value;
    },
    { attribute: 'empty-text' }
  );
  /** How long typing pauses, in milliseconds, before `search` fires. */
  readonly debounce = this.useChange(DEFAULT_DEBOUNCE_MS, () => undefined, { attribute: 'debounce' });
  /** Shows a spinner in place of the search icon, while the page looks for what was typed. */
  readonly loading = this.useChange(
    false,
    (value) => {
      this._refs.searchIcon.hidden = value;
      this._refs.spinner.hidden = !value;
    },
    { attribute: 'loading' }
  );
  /** The dialog's name for screen readers. */
  readonly label = this.useChange(
    jlText('commandPalette'),
    (value) => this._refs.dialog.setAttribute('aria-label', value),
    {
      attribute: 'label',
    }
  );

  private readonly _state = { active: 0, matches: [] as PaletteMatch[], timer: 0 };

  private readonly _refs = this.useRefs((ref) => ({
    dialog: ref('dialog'),
    empty: ref('.empty'),
    hotkeyHint: ref('.hotkey-hint'),
    hotkeyKeys: ref('.hotkey-keys'),
    input: ref<HTMLInputElement>('input'),
    results: ref('.results'),
    searchIcon: ref<JlIcon>('.search-icon'),
    spinner: ref(JlSpinner),
  }));

  show(): void {
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }

  templateHtml(): Node {
    return (
      <dialog attrs={{ part: 'base' }}>
        <div class="search">
          <JlIcon class="search-icon" name="search" size={SEARCH_ICON_SIZE} />
          <JlSpinner class="search-spinner" size={SEARCH_ICON_SIZE} hidden />
          <input
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="results"
            aria-autocomplete="list"
            autocomplete="off"
            spellcheck={false}
          />
          <kbd class="escape">Esc</kbd>
        </div>
        <div class="results" id="results" role="listbox" aria-label={jlText('commands')} />
        <p class="empty" role="status" hidden />
        <footer aria-hidden="true">
          <span class="hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            to move
          </span>
          <span class="hint">
            <kbd>↵</kbd>
            to run
          </span>
          <span class="hint hotkey-hint">
            <span class="hotkey-keys" />
            to close
          </span>
        </footer>
      </dialog>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const dialog = this._refs.dialog;
    const input = this._refs.input;
    this.on(document, 'keydown', (event) => this.toggleOnHotkey(event));
    this.on(input, 'input', (event) => {
      // Ours alone: the native event crosses the shadow root, and a page listening to the palette would hear it.
      event.stopPropagation();
      this.renderResults();
      this.scheduleSearch();
    });
    this.on(input, 'keydown', (event) => this.navigate(event));
    this.on(this._refs.results, 'pointermove', (event) => {
      const index = this.indexOf(event.target);
      if (index !== null && index !== this._state.active) {
        this.activate(index);
      }
    });
    this.on(this._refs.results, 'click', (event) => {
      const index = this.indexOf(event.target);
      if (index !== null) {
        this.choose(index);
      }
    });
    this.on(dialog, 'close', () => {
      this.reflect('open', false);
      this.open.set(false);
      this.events.emit('close');
    });
    this.on(dialog, 'click', (event) => {
      if (event.target === dialog) {
        this.close();
      }
    });
    this.renderOpen(this.open.get());
  }

  private toggleOnHotkey(event: KeyboardEvent): void {
    const hotkey = this.hotkey.get();
    if (hotkey === '' || hotkey === NO_HOTKEY || event.defaultPrevented) {
      return;
    }
    if (!matchesHotkey(event, parseHotkey(hotkey), onApple())) {
      return;
    }
    event.preventDefault();
    this.open.set(!this.open.get());
  }

  private navigate(event: KeyboardEvent): void {
    const move = MOVES.get(event.key);
    if (move !== undefined) {
      event.preventDefault();
      this.move(move);
      return;
    }
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      this.choose(this._state.active);
    }
  }

  private indexOf(target: EventTarget | null): number | null {
    const option = target instanceof Element ? target.closest<HTMLElement>('[role="option"]') : null;
    return option === null ? null : Number(option.dataset.index);
  }

  private move(step: number): void {
    const count = this._state.matches.length;
    if (count === 0) {
      return;
    }
    this.activate((this._state.active + step + count) % count);
  }

  private choose(index: number): void {
    const match = this._state.matches[index];
    if (match === undefined) {
      return;
    }
    this.close();
    this.events.emit('select', match.command.id);
  }

  private renderOpen(open: boolean): void {
    const dialog = this._refs.dialog;
    if (open === dialog.open || !this.isConnected) {
      return;
    }
    if (!open) {
      // The attribute follows at once: set back later, by the dialog's close event, it would reopen the palette.
      this.reflect('open', false);
      dialog.close();
      return;
    }
    this._refs.input.value = '';
    this.renderResults();
    this.search('');
    dialog.showModal();
    this._refs.input.focus();
    this.reflect('open', true);
    this.events.emit('open');
  }

  private scheduleSearch(): void {
    window.clearTimeout(this._state.timer);
    this._state.timer = window.setTimeout(() => this.search(this._refs.input.value), this.debounce.get());
  }

  private search(query: string): void {
    window.clearTimeout(this._state.timer);
    this.events.emit('search', query);
  }

  private renderHotkey(): void {
    const hotkey = this.hotkey.get();
    const none = hotkey === '' || hotkey === NO_HOTKEY;
    this._refs.hotkeyHint.hidden = none;
    this._refs.hotkeyKeys.replaceChildren(...(none ? [] : keycaps(hotkey)));
  }

  private renderResults(): void {
    const groups = groupMatches(matchCommands(this.commands.get(), this._refs.input.value));
    this._state.matches = groups.flatMap((group) => group.matches);
    this._refs.results.replaceChildren(...groups.map((group, index) => this.groupNode(group, index)));
    this._refs.results.hidden = this._state.matches.length === 0;
    this._refs.empty.hidden = this._state.matches.length > 0;
    this.activate(0);
  }

  private groupNode(group: PaletteGroup, groupIndex: number): Node {
    const first = this._state.matches.indexOf(group.matches[0] as PaletteMatch);
    const options = group.matches.map((match, index) => this.optionNode(match, first + index));
    if (group.label === '') {
      // biome-ignore lint/a11y/useSemanticElements: a group of options in a listbox has no HTML element
      return <div role="group">{options}</div>;
    }
    const labelId = `group-${groupIndex}`;
    return (
      // biome-ignore lint/a11y/useSemanticElements: a group of options in a listbox has no HTML element
      <div role="group" aria-labelledby={labelId}>
        <div class="group-label" id={labelId} aria-hidden="true">
          {group.label}
        </div>
        {options}
      </div>
    );
  }

  private optionNode(match: PaletteMatch, index: number): Node {
    const { command } = match;
    const icon =
      command.icon === undefined ? (
        <span class="option-icon" />
      ) : (
        <JlIcon class="option-icon" name={command.icon} size={OPTION_ICON_SIZE} />
      );
    return (
      // biome-ignore lint/a11y/useFocusableInteractive: the focus stays in the search box, which points here with aria-activedescendant
      <div class="option" role="option" id={optionId(index)} data-index={index} aria-selected="false">
        {icon}
        <span class="option-label">{highlighted(command.label, match.positions)}</span>
        {command.description ? <span class="option-description">{command.description}</span> : null}
        {command.shortcut === undefined ? null : <span class="keys">{keycaps(command.shortcut)}</span>}
      </div>
    );
  }

  private activate(index: number): void {
    this._state.active = index;
    const options = this._refs.results.querySelectorAll<HTMLElement>('[role="option"]');
    for (const option of options) {
      option.setAttribute('aria-selected', String(Number(option.dataset.index) === index));
    }
    const active = options[index];
    setOrRemove(this._refs.input, 'aria-activedescendant', active === undefined ? '' : optionId(index));
    active?.scrollIntoView({ block: 'nearest' });
  }
}

JlCommandPalette.register();
