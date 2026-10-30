import { css } from '@jadis/core';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf, oneOf } from '../lib/attributes';
import { uniqueId } from '../lib/dom';
import { followAnchor, PLACEMENTS } from '../lib/floating';
import { firstIndex, lastIndex, letterIndex, stepIndex } from '../lib/roving';
import { setTriggerAria } from '../lib/trigger';
import { BASE_STYLES, FLOATING_STYLES } from '../styles/shared';
import styles from './jl-menu.css?raw';

import type { Placement } from '../types/floating.types';
import type { MenuAction, MenuDivider, MenuItem } from '../types/jl-menu.types';

const ICON_SIZE = 16;
const CLOSED = 'closed';
const ITEM_SELECTOR = '[role="menuitem"]';

type Section<Value extends string> = { heading: string; entries: (MenuAction<Value> | MenuDivider)[] };

type KeyMove = (enabled: readonly boolean[], from: number) => number;

// The keys that move the focus among the items while the menu is open. Keyboard keys are PascalCase names: a Map
// keeps them as they are.
const KEY_MOVES = new Map<string, KeyMove>([
  ['ArrowDown', (enabled, from) => stepIndex(enabled, from, 1)],
  ['ArrowUp', (enabled, from) => stepIndex(enabled, from, -1)],
  ['End', lastIndex],
  ['Home', firstIndex],
]);

// The keys that open the menu from its trigger, and the item they focus first.
const OPENING_KEYS = new Map<string, (enabled: readonly boolean[]) => number>([
  ['ArrowDown', firstIndex],
  ['ArrowUp', lastIndex],
]);

const CHOOSING_KEYS = new Set(['Enter', ' ']);

/** The items split under their headings; what comes before the first heading has none. */
function sectionsOf<Value extends string>(items: readonly MenuItem<Value>[]): Section<Value>[] {
  const sections: Section<Value>[] = [{ entries: [], heading: '' }];
  for (const item of items) {
    if ('heading' in item) {
      sections.push({ entries: [], heading: item.heading });
      continue;
    }
    sections.at(-1)?.entries.push(item);
  }
  return sections;
}

/** A single printable character typed without a modifier: a letter for typeahead. */
const isTypeahead = (event: KeyboardEvent): boolean =>
  event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey;

/**
 * A list of actions that opens from its trigger (`slot="trigger"`, any button): on a press or with ArrowDown. Arrows,
 * Home, End and the first letter move through it; Enter chooses, Escape closes. `select` fires with the value.
 * Typed by its values, `JlMenu<'edit' | 'delete'>` takes actions of those values and gives `select` one of them:
 * a page handles them with a `Record<'edit' | 'delete', () => void>`, which misses none.
 */
export class JlMenu<Value extends string = string> extends JlElement {
  static readonly selector = 'jl-menu';

  readonly events = this.useEvents<{ select: Value; open: undefined; close: undefined }>();

  readonly items = this.useChange<MenuItem<Value>[]>([], () => this.renderItems(), {
    attribute: 'items',
    parse: jsonOf<MenuItem<Value>[]>([]),
  });
  /** Where the menu goes; it flips to the other side when there is no room. */
  readonly placement = this.useChange<Placement>('bottom-start', () => this.follow(), {
    attribute: 'placement',
    parse: oneOf(PLACEMENTS, 'bottom-start'),
  });
  /** The menu's name for screen readers; the trigger names it otherwise. */
  readonly label = this.useChange('', () => this.renderName(), { attribute: 'label' });

  private readonly _state = {
    following: new AbortController(),
    // Whether the menu was open when the pointer went down on the trigger: the click outside closes it then.
    openAtPointerDown: false,
  };

  private readonly _refs = this.useRefs((ref) => ({
    menu: ref('.menu'),
    trigger: ref<HTMLSlotElement>('slot[name="trigger"]'),
  }));

  /** Opens the menu and focuses its first item. */
  show(): void {
    this.whenRendered(() => this.open(firstIndex));
  }

  hide(): void {
    this.whenRendered(() => this.close());
  }

  templateHtml(): Node {
    return (
      <>
        <slot name="trigger" />
        <div class="floating panel menu" popover="auto" role="menu" tabIndex={-1} attrs={{ part: 'base' }} />
      </>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${FLOATING_STYLES}${styles}`;
  }

  onConnect(): void {
    const menu = this._refs.menu;
    const trigger = this._refs.trigger;
    this.renderTrigger();
    this.on(trigger, 'slotchange', () => this.renderTrigger());
    this.on(trigger, 'pointerdown', () => {
      this._state.openAtPointerDown = this.isOpen();
    });
    this.on(trigger, 'click', () => this.onTriggerClick());
    this.on(trigger, 'keydown', (event) => this.onTriggerKeydown(event));
    this.on(menu, 'keydown', (event) => this.onMenuKeydown(event));
    this.on(menu, 'click', (event) => this.chooseItem((event.target as Element).closest(ITEM_SELECTOR)));
    this.on(menu, 'pointermove', (event) => {
      const item = (event.target as Element).closest<HTMLElement>(ITEM_SELECTOR);
      if (item !== null && this.menuItems().includes(item) && item !== this.shadowRoot?.activeElement) {
        item.focus();
      }
    });
    // Tab moves the focus out of the menu: it closes once the focus has gone on its way (closing earlier would
    // send the focus back to the trigger).
    this.on(menu, 'focusout', () => {
      window.setTimeout(() => {
        if (!this.focusIsInMenu()) {
          this.close();
        }
      });
    });
    this.on(menu, 'toggle', (event) => this.onToggle((event as ToggleEvent).newState !== CLOSED));
  }

  onDisconnect(): void {
    this._state.following.abort();
  }

  private triggerElement(): HTMLElement | null {
    const [element] = this._refs.trigger.assignedElements({ flatten: true });
    return element instanceof HTMLElement ? element : null;
  }

  private isOpen(): boolean {
    return this._refs.menu.matches(':popover-open');
  }

  /** Every item, the disabled ones included, in order. */
  private allItems(): HTMLElement[] {
    return [...this._refs.menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)];
  }

  /** The items people can choose. */
  private menuItems(): HTMLElement[] {
    return this.allItems().filter((item) => !item.hasAttribute('aria-disabled'));
  }

  private enabledFlags(): boolean[] {
    return this.allItems().map((item) => !item.hasAttribute('aria-disabled'));
  }

  private onTriggerClick(): void {
    const closedByPointer = this._state.openAtPointerDown;
    this._state.openAtPointerDown = false;
    if (closedByPointer || this.isOpen()) {
      this.close();
      return;
    }
    this.open(firstIndex);
  }

  private onTriggerKeydown(event: KeyboardEvent): void {
    const focusFirst = OPENING_KEYS.get(event.key);
    if (focusFirst === undefined) {
      return;
    }
    event.preventDefault();
    this.open(focusFirst);
  }

  private onMenuKeydown(event: KeyboardEvent): void {
    const items = this.allItems();
    const from = items.indexOf(event.target as HTMLElement);
    const move = KEY_MOVES.get(event.key);
    if (move !== undefined) {
      event.preventDefault();
      this.focusItem(move(this.enabledFlags(), from));
      return;
    }
    if (CHOOSING_KEYS.has(event.key)) {
      event.preventDefault();
      this.chooseItem(items[from] ?? null);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.triggerElement()?.focus();
      return;
    }
    if (isTypeahead(event)) {
      const labels = items.map((item) => item.querySelector('.label')?.textContent ?? '');
      this.focusItem(letterIndex(labels, this.enabledFlags(), from, event.key));
    }
  }

  private open(focusFirst: (enabled: readonly boolean[]) => number): void {
    const menu = this._refs.menu;
    if (!this.isOpen()) {
      menu.showPopover();
      this.follow();
    }
    const index = focusFirst(this.enabledFlags());
    if (index === -1) {
      menu.focus();
      return;
    }
    this.focusItem(index);
  }

  private close(): void {
    if (this.isOpen()) {
      this._refs.menu.hidePopover();
    }
  }

  private focusItem(index: number): void {
    this.allItems()[index]?.focus();
  }

  /** Chooses an item people picked: the menu closes, the focus goes back to the trigger, and `select` fires. */
  private chooseItem(item: Element | null): void {
    if (!(item instanceof HTMLElement) || item.hasAttribute('aria-disabled')) {
      return;
    }
    const action = this.actionOf(item);
    this.close();
    this.triggerElement()?.focus();
    if (action !== undefined) {
      this.events.emit('select', action.value);
    }
  }

  /** The action an item of the list draws. */
  private actionOf(item: HTMLElement): MenuAction<Value> | undefined {
    return this.items
      .get()
      .find((entry): entry is MenuAction<Value> => 'value' in entry && entry.value === item.dataset.value);
  }

  private onToggle(open: boolean): void {
    this.renderTrigger();
    if (!open) {
      this._state.following.abort();
    }
    this.events.emit(open ? 'open' : 'close');
  }

  private focusIsInMenu(): boolean {
    const active = this.shadowRoot?.activeElement ?? null;
    return active !== null && this._refs.menu.contains(active);
  }

  /** Keeps the menu by the trigger while it is open. */
  private follow(): void {
    this._state.following.abort();
    const trigger = this.triggerElement();
    if (!this.isOpen() || trigger === null) {
      return;
    }
    this._state.following = new AbortController();
    followAnchor(trigger, this._refs.menu, this.placement.get(), this._state.following.signal);
  }

  private renderTrigger(): void {
    const trigger = this.triggerElement();
    if (trigger === null) {
      return;
    }
    setTriggerAria(trigger, 'aria-haspopup', 'menu');
    setTriggerAria(trigger, 'aria-expanded', String(this.isOpen()));
    this.renderName();
  }

  private renderName(): void {
    const menu = this._refs.menu;
    const label = this.label.get();
    if (label !== '') {
      menu.setAttribute('aria-label', label);
      menu.ariaLabelledByElements = null;
      return;
    }
    menu.removeAttribute('aria-label');
    // The trigger lives outside this shadow root: an id reference cannot reach it, the element reference can.
    const trigger = this.triggerElement();
    menu.ariaLabelledByElements = trigger === null ? null : [trigger];
  }

  private renderItems(): void {
    this._refs.menu.replaceChildren(...sectionsOf(this.items.get()).map((section) => this.section(section)));
  }

  private section(section: Section<Value>): Node {
    const entries = section.entries.map((entry) => this.entry(entry));
    if (section.heading === '') {
      return <>{entries}</>;
    }
    const id = uniqueId('jl-menu-heading');
    return (
      // biome-ignore lint/a11y/useSemanticElements: a fieldset groups form fields; this groups menu items
      <div class="group" role="group" aria-labelledby={id}>
        <div class="heading" id={id} role="presentation">
          {section.heading}
        </div>
        {entries}
      </div>
    );
  }

  private entry(entry: MenuAction<Value> | MenuDivider): Node {
    if ('divider' in entry) {
      return <hr class="divider" />;
    }
    return (
      <div
        class="item"
        role="menuitem"
        tabIndex={-1}
        data-value={entry.value}
        data-danger={entry.danger === true ? '' : undefined}
        aria-disabled={entry.disabled === true ? 'true' : undefined}>
        {entry.icon === undefined ? '' : <JlIcon class="icon" name={entry.icon} size={ICON_SIZE} />}
        <span class="text">
          <span class="label">{entry.label}</span>
          {entry.description === undefined ? '' : <span class="description">{entry.description}</span>}
        </span>
        {entry.shortcut === undefined ? '' : <kbd class="shortcut">{entry.shortcut}</kbd>}
      </div>
    );
  }
}

JlMenu.register();
