import { css } from '@jadis/core';
import { Menu, X } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-navbar.css?raw';

import type { NavbarLink } from '../types/jl-navbar.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ menu: Menu, x: X });

const ICON_SIZE = 18;
const DEFAULT_LABEL = 'Main';
const MENU_ICON = 'menu';
const CLOSE_ICON = 'x';

/**
 * The bar at the top of an app or a site: the brand (`slot="brand"`), the main links, and actions
 * (`slot="actions"`). When the bar itself is narrower than 720 pixels, the links fold into a menu button that opens
 * them as a list under the bar.
 */
export class JlNavbar extends JlElement {
  static readonly selector = 'jl-navbar';

  readonly links = this.useChange<NavbarLink[]>([], () => this.renderLinks(), {
    attribute: 'links',
    parse: jsonOf([]),
  });
  /** Stays at the top of the window while the page scrolls. */
  readonly sticky = this.useChange(false, (value) => this.reflect('sticky', value), { attribute: 'sticky' });
  /** The navigation's name for screen readers. */
  readonly label = this.useChange(
    DEFAULT_LABEL,
    (value) => {
      this._refs.links.setAttribute('aria-label', value || DEFAULT_LABEL);
      this._refs.drawer.setAttribute('aria-label', value || DEFAULT_LABEL);
    },
    { attribute: 'label' }
  );

  private readonly _refs = this.useRefs((ref) => ({
    drawer: ref('.drawer'),
    drawerList: ref('.drawer ul'),
    links: ref('.links'),
    linksList: ref('.links ul'),
    toggle: ref<HTMLButtonElement>('.toggle'),
    toggleIcon: ref<JlIcon>('.toggle jl-icon'),
  }));

  templateHtml(): Node {
    return (
      <header attrs={{ part: 'base' }}>
        <div class="bar">
          <div class="brand">
            <slot name="brand" />
          </div>
          <nav class="links">
            <ul />
          </nav>
          <div class="actions">
            <slot name="actions" />
          </div>
          <button type="button" class="toggle" aria-expanded="false" aria-controls="drawer" aria-label="Menu">
            <JlIcon name={MENU_ICON} size={ICON_SIZE} />
          </button>
        </div>
        <nav class="drawer" id="drawer" hidden>
          <ul />
        </nav>
      </header>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.toggle, 'click', () => this.setDrawer(!this.hasAttribute('expanded')));
    this.on(this._refs.drawer, 'click', (event) => {
      if ((event.target as Element).closest('a') !== null) {
        this.setDrawer(false);
      }
    });
    this.on(this._refs.drawer, 'keydown', (event) => {
      if (event.key === 'Escape') {
        this.setDrawer(false);
        this._refs.toggle.focus();
      }
    });
  }

  private renderLinks(): void {
    const links = this.links.get();
    this._refs.linksList.replaceChildren(...links.map((link) => this.link(link)));
    this._refs.drawerList.replaceChildren(...links.map((link) => this.link(link)));
  }

  private link(link: NavbarLink): Node {
    return (
      <li>
        <a class="link" href={link.href} aria-current={link.active === true ? 'page' : undefined}>
          {link.label}
        </a>
      </li>
    );
  }

  /** Opens or closes the list of links under the bar, on a narrow bar. */
  private setDrawer(open: boolean): void {
    this._refs.drawer.hidden = !open;
    this._refs.toggle.setAttribute('aria-expanded', String(open));
    this._refs.toggle.setAttribute('aria-label', open ? 'Close the menu' : 'Menu');
    this._refs.toggleIcon.name.set(open ? CLOSE_ICON : MENU_ICON);
    this.reflect('expanded', open);
  }
}

JlNavbar.register();
