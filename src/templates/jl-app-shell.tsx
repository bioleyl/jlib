import { css } from '@jadis/core';
import { Menu } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { registerIcons } from '../lib/icons';
import { watchSizes } from '../lib/resize';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-app-shell.css?raw';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ menu: Menu });

const MENU_ICON_SIZE = 18;
const HIDDEN = 'none';
// What the shell covers along the bottom of the window (its tab bar), for the toasts and floating bars of a page.
const SHELL_BOTTOM = '--jl-shell-bottom';

/** Whether a click inside the drawer followed a link: the page changes, so the drawer gets out of the way. */
const followsLink = (event: Event): boolean =>
  event.composedPath().some((node) => node instanceof HTMLAnchorElement && node.href !== '');

/**
 * The frame of an app: a top bar (`header`), a sidebar (`nav`), the main area (the default slot), which scrolls
 * on its own, and an optional panel on the right (`aside`). Narrower than 960 pixels, the sidebar becomes a drawer
 * over the content, opened by a menu button in the top bar (or `nav-open`, or `toggleNav()`), the panel hides, and
 * a bar along the bottom shows (`tabs`, such as a `jl-tab-bar`, whose `more` opens the drawer).
 * It takes the height of its container: give that one a height (`100dvh` for a whole page). A shell that fills the
 * window writes the height of its tab bar, while it shows, as `--jl-shell-bottom` on the document: toasts keep
 * above it, and a page's floating bars can (`bottom: calc(var(--jl-shell-bottom, 0px) + 16px)`).
 */
export class JlAppShell extends JlElement {
  static readonly selector = 'jl-app-shell';

  readonly events = this.useEvents<{ navtoggle: boolean }>();

  /** Whether the drawer is open, on narrow screens; wide ones always show the sidebar. */
  readonly navOpen = this.useChange(false, (value) => this.renderNavOpen(value), { attribute: 'nav-open' });

  private readonly _state = {
    navListeners: new AbortController(),
    // Whether this shell wrote --jl-shell-bottom, so it takes it back, and only it.
    publishedBottom: false,
    tabsListeners: new AbortController(),
  };

  // The main area is inert behind an open drawer; whether the drawer covers it depends on the shell's width.
  private readonly _resize = watchSizes(() => {
    this.renderInert();
    this.renderShellBottom();
  });

  private readonly _refs = this.useRefs((ref) => ({
    aside: ref('.aside'),
    asideSlot: ref<HTMLSlotElement>('slot[name="aside"]'),
    headerSlot: ref<HTMLSlotElement>('slot[name="header"]'),
    main: ref('main'),
    menu: ref<HTMLButtonElement>('.menu'),
    nav: ref('.nav'),
    navSlot: ref<HTMLSlotElement>('slot[name="nav"]'),
    scrim: ref('.scrim'),
    tabs: ref('.tabs'),
    tabsSlot: ref<HTMLSlotElement>('slot[name="tabs"]'),
  }));

  /** Opens or closes the drawer; `force` sets the state instead of flipping it. */
  toggleNav(force?: boolean): void {
    this.setNavOpen(force ?? !this.navOpen.get());
  }

  templateHtml(): Node {
    return (
      <div class="shell" attrs={{ part: 'base' }}>
        <header class="top" attrs={{ part: 'header' }}>
          <button
            class="menu"
            type="button"
            aria-label={jlText('navigation')}
            aria-expanded="false"
            aria-controls="nav">
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
        <div class="tabs" attrs={{ part: 'tabs' }}>
          <slot name="tabs" />
        </div>
        <div class="scrim" />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._resize.observe(this);
    this._resize.observe(this._refs.tabs);
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
    for (const slot of [this._refs.headerSlot, this._refs.navSlot, this._refs.asideSlot, this._refs.tabsSlot]) {
      this.on(slot, 'slotchange', () => this.renderSlots());
    }
  }

  onDisconnect(): void {
    this._resize.disconnect();
    this._state.navListeners.abort();
    this._state.tabsListeners.abort();
    this.withdrawShellBottom();
  }

  /** Tells the page how much the tab bar covers at the bottom of the window, while it shows. */
  private renderShellBottom(): void {
    const height = Math.round(this._refs.tabs.getBoundingClientRect().height);
    const fillsWindow = this.getBoundingClientRect().bottom >= window.innerHeight - 1;
    if (height === 0 || !fillsWindow) {
      this.withdrawShellBottom();
      return;
    }
    document.documentElement.style.setProperty(SHELL_BOTTOM, `${height}px`);
    this._state.publishedBottom = true;
  }

  private withdrawShellBottom(): void {
    if (!this._state.publishedBottom) {
      return;
    }
    document.documentElement.style.removeProperty(SHELL_BOTTOM);
    this._state.publishedBottom = false;
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

  /** The tab bar's "more": the other places are in the drawer. */
  private onMore(): void {
    this.setNavOpen(true);
    this._refs.nav.focus();
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
    this._refs.tabs.inert = covered;
  }

  /**
   * What was slotted: empty areas take no room, a `select` from the nav (a side nav's) closes the drawer, and a
   * `more` from the tabs (a tab bar's) opens it.
   */
  private renderSlots(): void {
    this.reflect('has-header', this._refs.headerSlot.assignedElements().length > 0);
    this.reflect('has-aside', this._refs.asideSlot.assignedElements().length > 0);
    const tabElements = this._refs.tabsSlot.assignedElements();
    this.reflect('has-tabs', tabElements.length > 0);
    this._state.tabsListeners.abort();
    this._state.tabsListeners = new AbortController();
    for (const element of tabElements) {
      element.addEventListener('more', () => this.onMore(), { signal: this._state.tabsListeners.signal });
    }
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
