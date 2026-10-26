import { css } from '@jadis/core';
import { JlBadge, JlButton, JlCommandPalette, JlElement, JlIcon, JlKbd } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { githubMark, REPOSITORY_URL } from '../lib/project';
import { actionOf, searchCommands } from '../lib/search-commands';
import { LOGO_MIN_HEIGHT } from '../lib/syware-logo';
import { navigate, onRouteChange, pageHref } from '../services/navigation';
import { setTheme } from '../services/theme';
import { SiteBrand } from './site-brand';
import { SiteLogo } from './site-logo';
import { SiteNav } from './site-nav';
import styles from './site-shell.css?raw';
import { SiteThemeSwitch } from './site-theme-switch';

const VERSION = 'v0.1';
const GITHUB_MARK_SIZE = 17;

/**
 * The frame of the site: the top bar, the side navigation (a drawer on small screens) and the page, slotted.
 * The router mounts pages inside it, so the frame keeps its state between pages.
 */
export class SiteShell extends JlElement {
  static readonly selector = 'site-shell';

  private readonly _refs = this.useRefs((ref) => ({
    menu: ref<JlButton>('.menu'),
    palette: ref<JlCommandPalette>('jl-command-palette'),
    scrim: ref('.scrim'),
    search: ref('.search'),
  }));

  templateHtml(): Node {
    return (
      <div class="app">
        <header class="top">
          <JlButton class="menu" variant="ghost" icon="menu" hint="Menu" />
          <SiteBrand />
          <JlBadge class="version" label={VERSION} />
          <span class="spacer" />
          <button type="button" class="search" aria-label="Search the docs">
            <JlIcon name="search" size={15} />
            <span class="search-text">Search</span>
            <JlKbd keys="mod+k" />
          </button>
          <a class="top-link" href={pageHref('/getting-started')}>
            Docs
          </a>
          <a class="top-link" href={pageHref('/components')}>
            Components
          </a>
          <a
            class="top-link github"
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener"
            aria-label="jlib on GitHub">
            {githubMark(GITHUB_MARK_SIZE)}
            <span class="github-text">GitHub</span>
          </a>
          <SiteThemeSwitch />
        </header>
        <aside class="side">
          <SiteNav />
        </aside>
        <div class="scrim" />
        <main>
          <slot />
          <footer class="credit">
            <SiteLogo class="credit-logo" height={LOGO_MIN_HEIGHT} />
            <p>
              jlib is made by <strong>SyWare</strong>, for SyWare's own apps. It is free for anyone to use, change
              and ship, under the MIT licence. The source is{' '}
              <a href={REPOSITORY_URL} target="_blank" rel="noopener">
                on GitHub
              </a>
              .
            </p>
          </footer>
        </main>
        <JlCommandPalette placeholder="Search components, guides, themes…" commands={searchCommands()} />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.menu.events.register('press', () => this.toggleNav(!this.hasAttribute('nav-open')));
    this.on(this._refs.scrim, 'click', () => this.toggleNav(false));
    this.on(this._refs.search, 'click', () => this._refs.palette.show());
    this._refs.palette.events.register('select', (id) => this.run(id));
    onRouteChange(() => {
      this.toggleNav(false);
      window.scrollTo({ top: 0 });
    }, this.killSignal);
  }

  /** Does what a search result says: open a page, or switch the theme. */
  private run(id: string): void {
    const action = actionOf(id);
    if (action.kind === 'go') {
      navigate(action.path);
      return;
    }
    if (action.kind === 'open') {
      window.open(action.url, '_blank', 'noopener');
      return;
    }
    if (action.kind === 'theme') {
      setTheme(action.mode);
    }
  }

  private toggleNav(open: boolean): void {
    this.reflect('nav-open', open);
  }
}

SiteShell.register();
