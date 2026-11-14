import { css } from '@jadis/core';
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide';

import { JlButton } from '../atoms/jl-button';
import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf, oneOf, textOf } from '../lib/attributes';
import { setOrRemove, uniqueId } from '../lib/dom';
import { hotkeyLabels, isApplePlatform, matchesHotkey, parseHotkey } from '../lib/hotkey';
import { registerIcons } from '../lib/icons';
import { findItem, firstLeaf, pathInSections } from '../lib/nav-tree';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-side-nav.css?inline';

import type { SideNavCollapsible, SideNavItem, SideNavSection } from '../types/jl-side-nav.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({
  'chevron-right': ChevronRight,
  'panel-left-close': PanelLeftClose,
  'panel-left-open': PanelLeftOpen,
});

export const SIDE_NAV_COLLAPSIBLES: readonly SideNavCollapsible[] = ['none', 'button', 'handle'];

const ICON_SIZE = 16;
const CHEVRON_SIZE = 14;
const COLLAPSE_ICON = 'panel-left-close';
const EXPAND_ICON = 'panel-left-open';
const FOLD_BUTTON = 'fold-button';
const DEFAULT_HOTKEY = 'mod+b';
// `hotkey="none"` folds with no key.
const NO_HOTKEY = 'none';
const ROW_SELECTOR = '.item';
// On the sections once people opened a parent: the CSS animates the lists of children only then.
const GLIDING = 'gliding';
const NEW_TAB = '_blank';
// A page opened in a new tab gets no handle on this one.
const SAFE_REL = 'noopener noreferrer';
const NO_ITEM = '';

/** A JSON attribute that should hold a list of sections; anything else gives none. */
const parseSections = <Id extends string>(value: string | null): SideNavSection<Id>[] => {
  const parsed = jsonOf<unknown>([])(value);
  return Array.isArray(parsed) ? (parsed as SideNavSection<Id>[]) : [];
};

/** Whether keys fold the side nav: an empty `hotkey` and `none` name no keys. */
const hasKeys = (hotkey: string): boolean => hotkey !== '' && hotkey !== NO_HOTKEY;

const onApple = (): boolean => isApplePlatform(navigator.platform);

/** A fold label with its keys: "Collapse the menu (Ctrl+B)", "(⌘B)" on a Mac. */
const withKeys = (label: string, hotkey: string): string => {
  const apple = onApple();
  return `${label} (${hotkeyLabels(hotkey, apple).join(apple ? '' : '+')})`;
};

/** The attribute written bare (`<jl-side-nav collapsible>`, as before it took a value) gives the handle. */
const parseCollapsible = (value: string | null): SideNavCollapsible =>
  value === '' ? 'handle' : oneOf(SIDE_NAV_COLLAPSIBLES, 'none')(value);

const hasChildren = (item: SideNavItem): boolean => (item.children?.length ?? 0) > 0;

/** A row is reachable when no closed list hides it. */
const isReachable = (row: HTMLElement): boolean => row.closest('[hidden]') === null && row.offsetParent !== null;

/**
 * The navigation of an app, down its side: sections of items with icons, badges and nested items that open with
 * a chevron. `value` is the active item (its parents open to show it); `collapsed` makes it a rail of icons, with
 * the labels as tooltips, and `collapsible` lets people fold and unfold it, with a button at its bottom or a handle along its edge, and with `hotkey`. Items with
 * an `href` are links; the others fire `select`. Typed by its ids, `JlSideNav<'jobs' | 'people'>` takes items of
 * those ids and gives `select` one of them.
 */
export class JlSideNav<Id extends string = string> extends JlElement {
  static readonly selector = 'jl-side-nav';

  /** `collapse`: people folded the side nav into its rail (true) or unfolded it (false), for the app to remember. */
  readonly events = this.useEvents<{ select: Id; collapse: boolean }>();

  readonly sections = this.useChange<SideNavSection<Id>[]>([], () => this.schedule(), {
    attribute: 'sections',
    parse: parseSections<Id>,
  });
  /** The id of the active item. */
  readonly value = this.useChange<Id | typeof NO_ITEM>(NO_ITEM, (value) => this.renderActive(value), {
    attribute: 'value',
    parse: textOf<Id | typeof NO_ITEM>(NO_ITEM),
  });
  /** Shows only the icons, in a narrow rail; the labels become tooltips. */
  readonly collapsed = this.useChange(
    false,
    (value) => {
      this.reflect('collapsed', value);
      this.schedule();
    },
    { attribute: 'collapsed' }
  );
  /**
   * What people fold the side nav into its rail with, and unfold it: `none` (the app's own control, setting
   * `collapsed`), an icon `button` at its bottom, or a `handle` along its edge. The last two fold on `hotkey` too.
   */
  readonly collapsible = this.useChange<SideNavCollapsible>(
    'none',
    (value) => {
      this.reflect('collapsible', value);
      this.schedule();
    },
    { attribute: 'collapsible', parse: parseCollapsible }
  );
  /** What the handle says while the side nav is open; jlib's own when empty. */
  readonly collapseLabel = this.useChange('', () => this.schedule(), { attribute: 'collapse-label' });
  /** What it says while the side nav is a rail; jlib's own when empty. */
  readonly expandLabel = this.useChange('', () => this.schedule(), { attribute: 'expand-label' });
  /** The keys that fold and unfold it too when `collapsible` gives a control, from anywhere in the page; `none` for no keys. */
  readonly hotkey = this.useChange(DEFAULT_HOTKEY, () => this.schedule(), { attribute: 'hotkey' });
  /**
   * Set by `jl-app-shell` while the side nav is its drawer, on a narrow screen: the drawer shows it whole, and its
   * handle hides, `collapsed` waiting for a wide screen again.
   */
  readonly inDrawer = this.useChange(
    false,
    (value) => {
      this.reflect('in-drawer', value);
      this.schedule();
    },
    { attribute: 'in-drawer' }
  );
  /** The name of the navigation for screen readers. */
  readonly label = this.useChange('', () => this.renderLabel(), { attribute: 'label' });

  private readonly _prefix = uniqueId('jl-side-nav');

  /** The parents people opened, or that hold the active item. */
  private readonly _state = { open: new Set<string>() };
  /** The sections and the form (rail or whole) the items were drawn for, and whether a drawing waits. */
  private readonly _drawn: { queued: boolean; rail: boolean; sections: SideNavSection<Id>[] | undefined } = {
    queued: false,
    rail: false,
    sections: undefined,
  };

  private readonly _refs = this.useRefs((ref) => ({
    bottom: ref('.bottom'),
    fold: ref<HTMLButtonElement>('.fold'),
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
        </div>
        <button type="button" class="fold">
          <span class="grip" />
        </button>
      </nav>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.fold, 'click', () => this.fold());
    document.addEventListener('keydown', (event) => this.foldOnHotkey(event), { signal: this.killSignal });
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
    this.whenRendered(() => {
      // From the first parent people open, the lists glide; the ones open as the items are drawn just show.
      this._refs.sections.classList.add(GLIDING);
      this.renderOpen();
    });
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
    // In the rail, a parent leads to its first leaf.
    this.choose(findItem(this.sections.get(), row?.dataset.target ?? '')?.id ?? item.id);
  }

  /** Whether it shows as the rail now: folded, and not in a drawer. */
  private isRail(): boolean {
    return this.collapsed.get() && !this.inDrawer.get();
  }

  /** The keys fold it wherever the focus is, unless the page used them or a drawer shows it whole. */
  private foldOnHotkey(event: KeyboardEvent): void {
    const hotkey = this.hotkey.get();
    const folds = this.collapsible.get() !== 'none' && !this.inDrawer.get() && hasKeys(hotkey);
    if (!folds || event.defaultPrevented || !matchesHotkey(event, parseHotkey(hotkey), onApple())) {
      return;
    }
    event.preventDefault();
    this.fold();
  }

  private fold(): void {
    const collapsed = !this.collapsed.get();
    this.collapsed.set(collapsed);
    this.events.emit('collapse', collapsed);
  }

  /** Draws on the next microtask: the inputs set while connecting give one drawing, not one each. */
  private schedule(): void {
    if (this._drawn.queued) {
      return;
    }
    this._drawn.queued = true;
    queueMicrotask(() => this.flush());
  }

  /** The rail, or the whole side nav, said on the host (`rail`) for the styles and the page. */
  private flush(): void {
    this._drawn.queued = false;
    const rail = this.isRail();
    this.reflect('rail', rail);
    this.renderFold();
    this.renderItems(rail);
  }

  /** Draws the items again only for other sections or the other form: the rail's rows lead elsewhere. */
  private renderItems(rail: boolean): void {
    const sections = this.sections.get();
    if (sections === this._drawn.sections && rail === this._drawn.rail) {
      return;
    }
    Object.assign(this._drawn, { rail, sections });
    this.render();
  }

  protected drawTexts(): void {
    this.renderLabel();
    for (const expander of this._refs.sections.querySelectorAll<HTMLElement>('.expander')) {
      const name = findItem(this.sections.get(), expander.dataset.id ?? '')?.label ?? '';
      expander.setAttribute('aria-label', jlText('showPagesOf', { name }));
    }
    this.schedule();
  }

  private renderLabel(): void {
    this._refs.nav.setAttribute('aria-label', this.label.get() || jlText('mainNavigation'));
  }

  /** What the handle or the button says and does next; the CSS shows the one `collapsible` names, none in a drawer. */
  private renderFold(): void {
    const fold = this._refs.fold;
    const rail = this.isRail();
    const hotkey = this.hotkey.get();
    const label = rail
      ? this.expandLabel.get() || jlText('expandMenu')
      : this.collapseLabel.get() || jlText('collapseMenu');
    const hint = hasKeys(hotkey) ? withKeys(label, hotkey) : label;
    fold.setAttribute('aria-label', label);
    fold.setAttribute('aria-expanded', String(!rail));
    fold.title = hint;
    if (this.collapsible.get() === 'button') {
      const button = this.foldButton();
      button.icon.set(rail ? EXPAND_ICON : COLLAPSE_ICON);
      button.hint.set(hint);
    }
  }

  /** The button at the bottom, made the first time `collapsible` asks for it. */
  private foldButton(): JlButton {
    const bottom = this._refs.bottom;
    const made = bottom.querySelector<JlButton>(`.${FOLD_BUTTON}`);
    if (made !== null) {
      return made;
    }
    const button = (<JlButton class={FOLD_BUTTON} variant="ghost" />) as JlButton;
    // For as long as the button lives: a registration would end the first time the side nav leaves the page.
    button.addEventListener('press', () => this.fold());
    bottom.append(button);
    return button;
  }

  private choose(id: Id): void {
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
    this._refs.sections.classList.remove(GLIDING);
    this._refs.sections.replaceChildren(
      ...this.sections.get().map((section, index) => this.sectionNode(section, index))
    );
    this.renderOpen();
    this.renderActive(this.value.get());
  }

  private sectionNode(section: SideNavSection<Id>, index: number): Node {
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

  private itemNode(item: SideNavItem<Id>, depth: number): Node {
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
            aria-label={jlText('showPagesOf', { name: item.label })}
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
  private rowNode(item: SideNavItem<Id>, depth: number, childrenId: string): Node {
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

  private rowContent(item: SideNavItem<Id>, toggles: boolean): Node[] {
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
