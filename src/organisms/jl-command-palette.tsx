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
import { modalClosed, modalOpened, onBackdropPress } from '../lib/modal';
import { groupMatches, matchCommands } from '../lib/palette';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-command-palette.css?inline';

import type { PaletteCommand, PaletteMatch } from '../types/jl-command-palette.types';

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

const OPTION_ID_PREFIX = 'option-';

/** A command's option as drawn, kept while the command is in `commands`: a search moves it, never draws it again. */
interface DrawnOption {
  element: HTMLElement;
  label: HTMLElement;
  /** The matched letters its label shows, joined. */
  marks: string;
}

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
 * Typed by its ids, `JlCommandPalette<'theme' | 'logout'>` takes commands of those ids and gives `select` one of
 * them.
 */
export class JlCommandPalette<Id extends string = string> extends JlElement {
  static readonly selector = 'jl-command-palette';

  /** `search`: what was typed, once typing pauses (and empty when it opens), for a page that answers it. */
  readonly events = this.useEvents<{ select: Id; open: undefined; close: undefined; search: string }>();

  readonly commands = this.useChange<PaletteCommand<Id>[]>([], (commands) => this.renderCommands(commands), {
    attribute: 'commands',
    parse: jsonOf<PaletteCommand<Id>[]>([]),
  });
  readonly open = this.useChange(false, (value) => this.renderOpen(value), { attribute: 'open' });
  /** What the field says before anything is typed; jlib's own text when empty. */
  readonly placeholder = this.useChange('', () => this.drawTexts(), { attribute: 'placeholder' });
  /** The keys that open and close it from anywhere on the page; `none` for no keys. `mod` is ⌘ or Ctrl. */
  readonly hotkey = this.useChange(DEFAULT_HOTKEY, () => this.renderHotkey(), { attribute: 'hotkey' });
  /** What it says when nothing matches; jlib's own text when empty. */
  readonly emptyText = this.useChange('', () => this.drawTexts(), { attribute: 'empty-text' });
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
  readonly label = this.useChange('', () => this.drawTexts(), { attribute: 'label' });

  /** The matches listed, their options in the same order, the one active, and every option drawn by its command. */
  private readonly _state: {
    active: number;
    activeOption: HTMLElement | undefined;
    made: number;
    matches: PaletteMatch<Id>[];
    options: Map<PaletteCommand<Id>, DrawnOption>;
    shown: HTMLElement[];
    timer: number;
  } = { active: 0, activeOption: undefined, made: 0, matches: [], options: new Map(), shown: [], timer: 0 };

  private readonly _refs = this.useRefs((ref) => ({
    closeText: ref('.close-text'),
    dialog: ref('dialog'),
    empty: ref('.empty'),
    hotkeyHint: ref('.hotkey-hint'),
    hotkeyKeys: ref('.hotkey-keys'),
    input: ref<HTMLInputElement>('input'),
    moveText: ref('.move-text'),
    results: ref('.results'),
    runText: ref('.run-text'),
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
            id="query"
            role="combobox"
            aria-expanded="true"
            aria-controls="results"
            aria-autocomplete="list"
            autocomplete="off"
            spellcheck={false}
          />
          <kbd class="escape">Esc</kbd>
        </div>
        <div class="results" id="results" role="listbox" />
        <p class="empty" role="status" />
        <footer aria-hidden="true">
          <span class="hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span class="move-text" />
          </span>
          <span class="hint">
            <kbd>↵</kbd>
            <span class="run-text" />
          </span>
          <span class="hint hotkey-hint">
            <span class="hotkey-keys" />
            <span class="close-text" />
          </span>
        </footer>
      </dialog>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  protected drawTexts(): void {
    this._refs.input.placeholder = this.placeholder.get() || jlText('commandPlaceholder');
    this._refs.empty.textContent = this.emptyText.get() || jlText('noCommands');
    this._refs.dialog.setAttribute('aria-label', this.label.get() || jlText('commandPalette'));
    this._refs.results.setAttribute('aria-label', jlText('commands'));
    this._refs.moveText.textContent = jlText('commandMove');
    this._refs.runText.textContent = jlText('commandRun');
    this._refs.closeText.textContent = jlText('commandClose');
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
      modalClosed(dialog);
      this.reflect('open', false);
      this.open.set(false);
      this.events.emit('close');
    });
    onBackdropPress(dialog, () => this.close(), this.killSignal);
    this.renderOpen(this.open.get());
  }

  /** A palette taken out of the page while it shows is no longer the modal on top. */
  onDisconnect(): void {
    modalClosed(this._refs.dialog);
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
    const index = option === null ? -1 : this._state.shown.indexOf(option);
    return index === -1 ? null : index;
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
      modalClosed(dialog);
      return;
    }
    this._refs.input.value = '';
    this.renderResults();
    this.search('');
    dialog.showModal();
    modalOpened(dialog);
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

  /** Forgets the options of commands that left; the list is drawn again only while it shows, and when it opens. */
  private renderCommands(commands: PaletteCommand<Id>[]): void {
    const kept = new Set(commands);
    for (const command of this._state.options.keys()) {
      if (!kept.has(command)) {
        this._state.options.delete(command);
      }
    }
    if (this._refs.dialog.open) {
      this.renderResults();
    }
  }

  /** Lists the matches in their groups, moving the options already drawn; the CSS hides an empty list. */
  private renderResults(): void {
    const groups = groupMatches(matchCommands(this.commands.get(), this._refs.input.value));
    const lists = groups.map((group) => ({
      label: group.label,
      options: group.matches.map((match) => this.drawOption(match)),
    }));
    this._state.matches = groups.flatMap((group) => group.matches);
    this._state.shown = lists.flatMap((list) => list.options);
    this._refs.results.replaceChildren(
      ...lists.map((list, index) => this.groupNode(list.label, list.options, index))
    );
    this.activate(0);
  }

  private groupNode(label: string, options: HTMLElement[], groupIndex: number): Node {
    if (label === '') {
      // biome-ignore lint/a11y/useSemanticElements: a group of options in a listbox has no HTML element
      return <div role="group">{options}</div>;
    }
    const labelId = `group-${groupIndex}`;
    return (
      // biome-ignore lint/a11y/useSemanticElements: a group of options in a listbox has no HTML element
      <div role="group" aria-labelledby={labelId}>
        <div class="group-label" id={labelId} aria-hidden="true">
          {label}
        </div>
        {options}
      </div>
    );
  }

  /** The match's option, made the first time its command is listed, its label's marks changed when they do. */
  private drawOption(match: PaletteMatch<Id>): HTMLElement {
    const drawn = this._state.options.get(match.command) ?? this.makeOption(match.command);
    const marks = match.positions.join();
    if (drawn.marks !== marks) {
      drawn.label.replaceChildren(...highlighted(match.command.label, match.positions));
      drawn.marks = marks;
    }
    return drawn.element;
  }

  private makeOption(command: PaletteCommand<Id>): DrawnOption {
    const label = <span class="option-label">{command.label}</span>;
    const id = `${OPTION_ID_PREFIX}${this._state.made++}`;
    const icon =
      command.icon === undefined ? (
        <span class="option-icon" />
      ) : (
        <JlIcon class="option-icon" name={command.icon} size={OPTION_ICON_SIZE} />
      );
    const element = (
      // biome-ignore lint/a11y/useFocusableInteractive: the focus stays in the search box, which points here with aria-activedescendant
      <div class="option" role="option" id={id} aria-selected="false">
        {icon}
        {label}
        {command.description ? <span class="option-description">{command.description}</span> : null}
        {command.shortcut === undefined ? null : <span class="keys">{keycaps(command.shortcut)}</span>}
      </div>
    );
    const drawn = { element, label, marks: '' };
    this._state.options.set(command, drawn);
    return drawn;
  }

  /** Marks the option that becomes active and clears the one that was: the others are left alone. */
  private activate(index: number): void {
    this._state.active = index;
    this._state.activeOption?.setAttribute('aria-selected', 'false');
    const active = this._state.shown[index];
    this._state.activeOption = active;
    active?.setAttribute('aria-selected', 'true');
    setOrRemove(this._refs.input, 'aria-activedescendant', active?.id ?? '');
    if (active !== undefined) {
      // Scrolled once the list is laid out for the frame, not straight after it changed, which would lay it out again.
      requestAnimationFrame(() => active.scrollIntoView({ block: 'nearest' }));
    }
  }
}

JlCommandPalette.register();
