import { css } from '@jadis/core';
import { JlElement, JlIcon, JlInput } from 'jlib';
import { BASE_STYLES } from 'jlib/styles/shared';

import { DESIGN_PAGES } from '../docs/design';
import { docPath, docsOfLevel, GUIDES, LEVEL_LABELS, LEVELS } from '../docs/registry';
import { currentPath } from '../lib/route-path';
import styles from './site-nav.css?raw';

const ICON_SIZE = 15;

const linkTo = (path: string, label: string, icon?: string): HTMLElement => (
  <li data-label={label.toLowerCase()}>
    <a href={`#${path}`} data-path={path}>
      {icon === undefined ? null : <JlIcon name={icon} size={ICON_SIZE} />}
      <span>{label}</span>
    </a>
  </li>
);

/** The side navigation: the guide, then every component by atomic level, with a filter on top. */
export class SiteNav extends JlElement {
  static readonly selector = 'site-nav';

  private readonly _refs = this.useRefs((ref) => ({
    empty: ref('.empty'),
    filter: ref<JlInput>('jl-input'),
    groups: ref('.groups'),
  }));

  templateHtml(): Node {
    return (
      <nav aria-label="Documentation">
        <div class="search">
          <JlInput icon="search" placeholder="Filter components" size="sm" label="Filter components" clearable />
        </div>
        <div class="groups">
          <section data-group="guide">
            <p class="label">Guide</p>
            <ul>{GUIDES.map((guide) => linkTo(guide.path, guide.label, guide.icon))}</ul>
          </section>
          <section data-group="design">
            <p class="label">Design system</p>
            <ul>{DESIGN_PAGES.map((page) => linkTo(page.path, page.label, page.icon))}</ul>
          </section>
          {LEVELS.map((level) => (
            <section data-group={level}>
              <p class="label">{LEVEL_LABELS[level]}</p>
              <ul>{docsOfLevel(level).map((doc) => linkTo(docPath(doc).slice(1), doc.name))}</ul>
            </section>
          ))}
        </div>
        <p class="empty" hidden>
          No component matches.
        </p>
      </nav>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.markCurrent();
    this.on(window, 'hashchange', () => this.markCurrent());
    this._refs.filter.events.register('input', (text) => this.filter(text));
  }

  private markCurrent(): void {
    const path = currentPath();
    for (const link of this._refs.groups.querySelectorAll<HTMLAnchorElement>('a[data-path]')) {
      if (link.dataset.path !== path) {
        link.removeAttribute('aria-current');
        continue;
      }
      link.setAttribute('aria-current', 'page');
      link.scrollIntoView({ block: 'nearest' });
    }
  }

  private filter(text: string): void {
    const query = text.trim().toLowerCase();
    const sections = [...this._refs.groups.querySelectorAll<HTMLElement>('section')];
    for (const section of sections) {
      const items = [...section.querySelectorAll<HTMLElement>('li')];
      for (const item of items) {
        item.hidden = !(item.dataset.label ?? '').includes(query);
      }
      section.hidden = items.every((item) => item.hidden);
    }
    this._refs.empty.hidden = sections.some((section) => !section.hidden);
  }
}

SiteNav.register();
