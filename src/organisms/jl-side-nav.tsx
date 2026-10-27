import { css } from '@jadis/core';
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide';

import { JlButton } from '../atoms/jl-button';
import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { setOrRemove, uniqueId } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { findItem, firstLeaf, pathInSections } from '../lib/nav-tree';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-side-nav.css?raw';

import type { SideNavItem, SideNavSection } from '../types/jl-side-nav.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({
  'chevron-right': ChevronRight,
  'panel-left-close': PanelLeftClose,
  'panel-left-open': PanelLeftOpen,
});

const ICON_SIZE = 16;
const CHEVRON_SIZE = 14;
const COLLAPSE_ICON = 'panel-left-close';
const EXPAND_ICON = 'panel-left-open';
const ROW_SELECTOR = '.item';
const NEW_TAB = '_blank';
// A page opened in a new tab gets no handle on this one.
const SAFE_REL = 'noopener noreferrer';

/** A JSON attribute that should hold a list of sections; anything else gives none. */
const parseSections = (value: string | null): SideNavSection[] => {
  const parsed = jsonOf<unknown>([])(value);
  return Array.isArray(parsed) ? (parsed as SideNavSection[]) : [];
};

const hasChildren = (item: SideNavItem): boolean => (item.children?.length ?? 0) > 0;

/** A row is reachable when no closed list hides it. */
const isReachable = (row: HTMLElement): boolean => row.closest('[hidden]') === null && row.offsetParent !== null;

/**
 * The navigation of an app, down its side: sections of items with icons, badges and nested items that open with
 * a chevron. `value` is the active item (its parents open to show it); `collapsed` makes it a rail of icons, with
 * the labels as tooltips, and `collapsible` lets people fold and unfold it with a button at its bottom. Items with
 * an `href` are links; the others fire `select`.
 */
export class JlSideNav extends JlElement {
  static readonly selector = 'jl-side-nav';

  /** `collapse`: people folded the side nav into its rail (true) or unfolded it (false), for the app to remember. */
  readonly events = this.useEvents<{ select: string; collapse: boolean }>();

  readonly sections = this.useChange<SideNavSection[]>([], () => this.render(), {
    attribute: 'sections',
    parse: parseSections,
  });
  /** The id of the active item. */
  readonly value = this.useChange('', (value) => this.renderActive(value), { attribute: 'value' });
  /** Shows only the icons, in a narrow rail; the labels become tooltips. */
  readonly collapsed = this.useChange(
    false,
    (value) => {
      this.reflect('collapsed', value);
      this.renderRail();
    },
    { attribute: 'collapsed' }
  );
  /** Adds a button at the bottom that folds the side nav into its rail and unfolds it. */
  readonly collapsible = this.useChange(false, () => this.renderFold(), { attribute: 'collapsible' });
  /** The fold button's text while the side nav is open. */
  readonly collapseLabel = this.useChange(jlText('collapseMenu'), () => this.renderFold(), {
    attribute: 'collapse-label',
  });
  /** Its hint while the side nav is a rail. */
  readonly expandLabel = this.useChange(jlText('expandMenu'), () => this.renderFold(), {
    attribute: 'expand-label',
  });
  /**
   * Set by `jl-app-shell` while the side nav is its drawer, on a narrow screen: the drawer shows it whole, and its
   * fold button hides, `collapsed` waiting for a wide screen again.
   */
  readonly inDrawer = this.useChange(false, () => this.renderRail(), { attribute: 'in-drawer' });
  /** The name of the navigation for screen readers. */
  readonly label = this.useChange(
    jlText('mainNavigation'),
    (value) => {
      this._refs.nav.setAttribute('aria-label', value === '' ? jlText('mainNavigation') : value);
    },
    { attribute: 'label' }
  );

  private readonly _prefix = uniqueId('jl-side-nav');

  /** The parents people opened, or that hold the active item. */
  private readonly _state = { open: new Set<string>() };

  private readonly _refs = this.useRefs((ref) => ({
    fold: ref(JlButton),
    nav: ref('nav'),
    sections: ref('.sections'),
  }));

  templateHtml(): Node {
    return (
      <nav attrs={{ part: 'base' }}>
        <slot name="header" />
        <div class="sections" />
        <div class="bottom">
          <slot name="footer" />
          <JlButton class="fold" variant="ghost" size="sm" hidden />
        </div>
      </nav>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.fold.events.register('press', () => this.fold());
    this.on(this._refs.sections, 'click', (event) => this.onClick(event));
    this.on(this._refs.sections, 'keydown', (event) => this.onKey(event));
  }

  /** Opens or closes a parent item. */
  toggleItem(id: string, force?: boolean): void {
    const open = force ?? !this._state.open.has(id);
    if (open) {
      this._state.open.add(id);
    } else {
      this._state.open.delete(id);
    }
    this.whenRendered(() => this.renderOpen());
  }

  private onClick(event: MouseEvent): void {
    const target = event.target as Element;
    const expander = target.closest<HTMLElement>('.expander');
    if (expander !== null) {
      this.toggleItem(expander.dataset.id ?? '');
      return;
    }
    const row = target.closest<HTMLElement>(ROW_SELECTOR);
    const item = findItem(this.sections.get(), row?.dataset.id ?? '');
    if (item === null) {
      return;
    }
    if (hasChildren(item) && item.href === undefined && !this.isRail()) {
      this.toggleItem(item.id);
      return;
    }
    this.choose(row?.dataset.target ?? item.id);
  }

  /** Whether it shows as the rail now: folded, and not in a drawer. */
  private isRail(): boolean {
    return this.collapsed.get() && !this.inDrawer.get();
  }

  private fold(): void {
    const collapsed = !this.collapsed.get();
    this.collapsed.set(collapsed);
    this.events.emit('collapse', collapsed);
  }

  /** The rail, or the whole side nav: drawn again, said on the host (`rail`) for the styles and the page. */
  private renderRail(): void {
    this.reflect('rail', this.isRail());
    this.render();
    this.renderFold();
  }

  private renderFold(): void {
    const fold = this._refs.fold;
    const rail = this.isRail();
    fold.hidden = !this.collapsible.get() || this.inDrawer.get();
    fold.icon.set(rail ? EXPAND_ICON : COLLAPSE_ICON);
    fold.label.set(rail ? '' : this.collapseLabel.get());
    fold.hint.set(rail ? this.expandLabel.get() : '');
  }

  private choose(id: string): void {
    this.value.set(id);
    this.events.emit('select', id);
  }

  /** Up and Down move between the rows people can see, Right opens a parent, Left closes it or goes up to it. */
  private onKey(event: KeyboardEvent): void {
    const row = (event.target as Element).closest<HTMLElement>(ROW_SELECTOR);
    if (row === null) {
      return;
    }
    const rows = [...this._refs.sections.querySelectorAll<HTMLElement>(ROW_SELECTOR)].filter(isReachable);
    const index = rows.indexOf(row);
    const id = row.dataset.id ?? '';
    const moves = new Map<string, () => void>([
      ['ArrowDown', () => rows[Math.min(rows.length - 1, index + 1)]?.focus()],
      ['ArrowLeft', () => this.closeOrGoUp(id, row)],
      ['ArrowRight', () => this.openOrGoDown(id, row)],
      ['ArrowUp', () => rows[Math.max(0, index - 1)]?.focus()],
      ['End', () => rows.at(-1)?.focus()],
      ['Home', () => rows[0]?.focus()],
    ]);
    const move = moves.get(event.key);
    if (move !== undefined) {
      event.preventDefault();
      move();
    }
  }

  private openOrGoDown(id: string, row: HTMLElement): void {
    if (row.dataset.parent === undefined || this.isRail()) {
      return;
    }
    if (!this._state.open.has(id)) {
      this.toggleItem(id, true);
      return;
    }
    row.closest('li')?.querySelector<HTMLElement>(`.children ${ROW_SELECTOR}`)?.focus();
  }

  private closeOrGoUp(id: string, row: HTMLElement): void {
    if (row.dataset.parent !== undefined && this._state.open.has(id)) {
      this.toggleItem(id, false);
      return;
    }
    row.closest('.children')?.closest('li')?.querySelector<HTMLElement>(ROW_SELECTOR)?.focus();
  }

  private render(): void {
    for (const id of pathInSections(this.sections.get(), this.value.get()).slice(0, -1)) {
      this._state.open.add(id);
    }
    this._refs.sections.replaceChildren(
      ...this.sections.get().map((section, index) => this.sectionNode(section, index))
    );
    this.renderOpen();
    this.renderActive(this.value.get());
  }

  private sectionNode(section: SideNavSection, index: number): Node {
    const headingId = `${this._prefix}-section-${index}`;
    const label = section.label ?? '';
    return (
      <div class="section">
        {label === '' ? null : (
          <p class="section-label" id={headingId}>
            {label}
          </p>
        )}
        {/* biome-ignore lint/a11y/noRedundantRoles: a list drawn without bullets loses its role in Safari */}
        <ul class="items" role="list" aria-labelledby={label === '' ? undefined : headingId}>
          {section.items.map((item) => this.itemNode(item, 0))}
        </ul>
      </div>
    );
  }

  private itemNode(item: SideNavItem, depth: number): Node {
    const parent = hasChildren(item);
    const childrenId = `${this._prefix}-${item.id}-children`;
    return (
      <li class="entry">
        {this.rowNode(item, depth, childrenId)}
        {parent && item.href !== undefined && !this.isRail() ? (
          <button
            class="expander"
            type="button"
            data-id={item.id}
            aria-label={`Show the pages of ${item.label}`}
            aria-controls={childrenId}>
            <JlIcon name="chevron-right" size={CHEVRON_SIZE} />
          </button>
        ) : null}
        {parent ? (
          // biome-ignore lint/a11y/noRedundantRoles: a list drawn without bullets loses its role in Safari
          <ul class="children" id={childrenId} role="list" hidden>
            {(item.children ?? []).map((child) => this.itemNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  }

  /**
   * The row of an item: a link when it has an `href`, otherwise a button. In the rail, a parent leads to its first
   * leaf, since its children cannot show there.
   */
  private rowNode(item: SideNavItem, depth: number, childrenId: string): Node {
    const collapsed = this.isRail();
    const parent = hasChildren(item);
    const target = collapsed ? firstLeaf(item) : item;
    const toggles = parent && item.href === undefined && !collapsed;
    const content = this.rowContent(item, toggles);
    const attributes = {
      class: 'item',
      'data-depth': String(depth),
      'data-id': item.id,
      'data-parent': parent ? '' : undefined,
      'data-target': target.id,
      title: collapsed ? item.label : undefined,
    };
    if (target.href !== undefined) {
      return (
        <a
          href={target.href}
          target={target.target}
          rel={target.target === NEW_TAB ? SAFE_REL : undefined}
          {...attributes}>
          {content}
        </a>
      );
    }
    return (
      <button
        type="button"
        aria-expanded={toggles ? 'false' : undefined}
        aria-controls={toggles ? childrenId : undefined}
        {...attributes}>
        {content}
      </button>
    );
  }

  private rowContent(item: SideNavItem, toggles: boolean): Node[] {
    const badge = item.badge === undefined ? '' : String(item.badge);
    return [
      item.icon === undefined ? (
        <span class="item-initial" aria-hidden="true">
          {item.label.charAt(0)}
        </span>
      ) : (
        <JlIcon class="item-icon" name={item.icon} size={ICON_SIZE} />
      ),
      <span class="item-label">{item.label}</span>,
      badge === '' ? null : <span class="item-badge">{badge}</span>,
      toggles ? <JlIcon class="chevron" name="chevron-right" size={CHEVRON_SIZE} /> : null,
    ].filter((node): node is Node => node !== null);
  }

  /** Shows the children of open parents, and says so on their chevrons. */
  private renderOpen(): void {
    for (const list of this._refs.sections.querySelectorAll<HTMLElement>('.children')) {
      const entry = list.closest('li');
      const row = entry?.querySelector<HTMLElement>(ROW_SELECTOR);
      const id = row?.dataset.id ?? '';
      const open = this._state.open.has(id);
      list.hidden = !open;
      entry?.classList.toggle('open', open);
      for (const control of entry?.querySelectorAll(`[aria-controls="${list.id}"]`) ?? []) {
        control.setAttribute('aria-expanded', String(open));
      }
    }
  }

  /** Marks the active row, and the parents above it; opens them so it shows. */
  private renderActive(value: string): void {
    const path = pathInSections(this.sections.get(), value);
    const opened = path.slice(0, -1).filter((id) => !this._state.open.has(id));
    for (const id of opened) {
      this._state.open.add(id);
    }
    if (opened.length > 0) {
      this.renderOpen();
    }
    for (const row of this._refs.sections.querySelectorAll<HTMLElement>(ROW_SELECTOR)) {
      const id = row.dataset.id ?? '';
      const active = id === value || (this.isRail() && row.dataset.target === value);
      setOrRemove(row, 'aria-current', active ? 'page' : '');
      row.classList.toggle('holds-active', !active && path.includes(id));
    }
  }
}

JlSideNav.register();
