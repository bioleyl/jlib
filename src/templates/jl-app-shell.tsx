import { css } from '@jadis/core';
import { Menu } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { registerIcons } from '../lib/icons';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-app-shell.css?raw';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ menu: Menu });

const MENU_ICON_SIZE = 18;
const HIDDEN = 'none';

/** Whether a click inside the drawer followed a link: the page changes, so the drawer gets out of the way. */
const followsLink = (event: Event): boolean =>
  event.composedPath().some((node) => node instanceof HTMLAnchorElement && node.href !== '');

/**
 * The frame of an app: a top bar (`header`), a sidebar (`nav`), the main area (the default slot), which scrolls
 * on its own, and an optional panel on the right (`aside`). Narrower than 960 pixels, the sidebar becomes a drawer
 * over the content, opened by a menu button in the top bar (or `nav-open`, or `toggleNav()`), and the panel hides.
 * It takes the height of its container: give that one a height (`100dvh` for a whole page).
 */
export class JlAppShell extends JlElement {
  static readonly selector = 'jl-app-shell';

  readonly events = this.useEvents<{ navtoggle: boolean }>();

  /** Whether the drawer is open, on narrow screens; wide ones always show the sidebar. */
  readonly navOpen = this.useChange(false, (value) => this.renderNavOpen(value), { attribute: 'nav-open' });

  private readonly _state = { navListeners: new AbortController() };

  // The main area is inert behind an open drawer; whether the drawer covers it depends on the shell's width.
  private readonly _resize = new ResizeObserver(() => this.renderInert());

  private readonly _refs = this.useRefs((ref) => ({
    aside: ref('.aside'),
    asideSlot: ref<HTMLSlotElement>('slot[name="aside"]'),
    headerSlot: ref<HTMLSlotElement>('slot[name="header"]'),
    main: ref('main'),
    menu: ref<HTMLButtonElement>('.menu'),
    nav: ref('.nav'),
    navSlot: ref<HTMLSlotElement>('slot[name="nav"]'),
    scrim: ref('.scrim'),
  }));

  /** Opens or closes the drawer; `force` sets the state instead of flipping it. */
  toggleNav(force?: boolean): void {
    this.setNavOpen(force ?? !this.navOpen.get());
  }

  templateHtml(): Node {
    return (
      <div class="shell" attrs={{ part: 'base' }}>
        <header class="top" attrs={{ part: 'header' }}>
          <button class="menu" type="button" aria-label="Navigation" aria-expanded="false" aria-controls="nav">
            <JlIcon name="menu" size={MENU_ICON_SIZE} />
          </button>
          <slot name="header" />
        </header>
        <div class="nav" id="nav" tabIndex={-1} attrs={{ part: 'nav' }}>
          <slot name="nav" />
        </div>
        <main class="main" attrs={{ part: 'main' }}>
          <slot />
        </main>
        <aside class="aside" attrs={{ part: 'aside' }}>
          <slot name="aside" />
        </aside>
        <div class="scrim" />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._resize.observe(this);
    this.on(this._refs.menu, 'click', () => this.onMenu());
    this.on(this._refs.scrim, 'click', () => this.setNavOpen(false));
    this.on(this._refs.nav, 'click', (event) => {
      if (followsLink(event)) {
        this.setNavOpen(false);
      }
    });
    this.on(this, 'keydown', (event) => this.onKey(event));
    // The first slotchange can come before onConnect: read the slots now, then follow them.
    this.renderSlots();
    for (const slot of [this._refs.headerSlot, this._refs.navSlot, this._refs.asideSlot]) {
      this.on(slot, 'slotchange', () => this.renderSlots());
    }
  }

  onDisconnect(): void {
    this._resize.disconnect();
    this._state.navListeners.abort();
  }

  /** Whether the shell is narrow: the menu button shows only then. */
  private isNarrow(): boolean {
    return getComputedStyle(this._refs.menu).display !== HIDDEN;
  }

  private onMenu(): void {
    const opening = !this.navOpen.get();
    this.setNavOpen(opening);
    if (opening) {
      this._refs.nav.focus();
    }
  }

  private onKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.navOpen.get() || !this.isNarrow()) {
      return;
    }
    event.preventDefault();
    this.setNavOpen(false);
    this._refs.menu.focus();
  }

  /** The drawer as people open and close it: says so. */
  private setNavOpen(open: boolean): void {
    if (open === this.navOpen.get()) {
      return;
    }
    this.navOpen.set(open);
    this.events.emit('navtoggle', open);
  }

  private renderNavOpen(open: boolean): void {
    this.reflect('nav-open', open);
    this._refs.menu.setAttribute('aria-expanded', String(open));
    this.renderInert();
  }

  private renderInert(): void {
    const covered = this.navOpen.get() && this.isNarrow();
    this._refs.main.inert = covered;
    this._refs.aside.inert = covered;
  }

  /** What was slotted: empty areas take no room, and a `select` from the nav (a side nav's) closes the drawer. */
  private renderSlots(): void {
    this.reflect('has-header', this._refs.headerSlot.assignedElements().length > 0);
    this.reflect('has-aside', this._refs.asideSlot.assignedElements().length > 0);
    const navElements = this._refs.navSlot.assignedElements();
    this.reflect('has-nav', navElements.length > 0);
    this._state.navListeners.abort();
    this._state.navListeners = new AbortController();
    const signal = this._state.navListeners.signal;
    for (const element of navElements) {
      element.addEventListener('select', () => this.setNavOpen(false), { signal });
    }
    this.renderInert();
  }
}

JlAppShell.register();
