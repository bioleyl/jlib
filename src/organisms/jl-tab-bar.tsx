import { css } from '@jadis/core';
import { Ellipsis } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf, textOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-tab-bar.css?raw';

import type { TabBarItem } from '../types/jl-tab-bar.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ ellipsis: Ellipsis });

const ICON_SIZE = 22;
const MAX_COUNT = 99;
const ITEM_SELECTOR = '.item';
const NO_ITEM = '';

/** A JSON attribute that should hold a list of items; anything else gives none. */
const parseItems = <Id extends string>(value: string | null): TabBarItem<Id>[] => {
  const parsed = jsonOf<unknown>([])(value);
  return Array.isArray(parsed) ? (parsed as TabBarItem<Id>[]) : [];
};

/** What the badge shows: counts are capped so they fit over the icon. */
const badgeText = (badge: string | number | undefined): string => {
  if (typeof badge === 'number') {
    return badge > MAX_COUNT ? `${MAX_COUNT}+` : String(badge);
  }
  return badge ?? '';
};

/**
 * The bar along the bottom of a phone, under the thumb: the three to five main places of an app, an icon over a
 * label, one tap away. `value` is the current item. Items with an `href` are links; the others are buttons; both
 * fire `select`. `more` adds a last button for everything else, which fires `more`: in a `jl-app-shell`, it opens
 * the navigation drawer. Typed by its ids, `JlTabBar<'home' | 'jobs'>` takes items of those ids and gives `select`
 * one of them.
 */
export class JlTabBar<Id extends string = string> extends JlElement {
  static readonly selector = 'jl-tab-bar';

  readonly events = this.useEvents<{ select: Id; more: undefined }>();

  readonly items = this.useChange<TabBarItem<Id>[]>([], () => this.render(), {
    attribute: 'items',
    parse: parseItems<Id>,
  });
  /** The id of the current item. */
  readonly value = this.useChange<Id | typeof NO_ITEM>(NO_ITEM, (value) => this.renderCurrent(value), {
    attribute: 'value',
    parse: textOf<Id | typeof NO_ITEM>(NO_ITEM),
  });
  /** The label of a last button for the other places (`More`); empty shows none. */
  readonly more = this.useChange(
    '',
    (value) => {
      this._refs.moreLabel.textContent = value;
      this._refs.more.hidden = value === '';
    },
    { attribute: 'more' }
  );
  /** The name of the navigation for screen readers. */
  readonly label = this.useChange(
    jlText('shortcuts'),
    (value) => this._refs.nav.setAttribute('aria-label', value === '' ? jlText('shortcuts') : value),
    { attribute: 'label' }
  );

  private readonly _refs = this.useRefs((ref) => ({
    items: ref('.items'),
    more: ref<HTMLButtonElement>('.more'),
    moreLabel: ref('.more .label'),
    nav: ref('nav'),
  }));

  templateHtml(): Node {
    return (
      <nav attrs={{ part: 'base' }}>
        <div class="items" />
        <button class="item more" type="button" hidden>
          <span class="icon">
            <JlIcon name="ellipsis" size={ICON_SIZE} />
          </span>
          <span class="label" />
        </button>
      </nav>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.items, 'click', (event) => this.onClick(event));
    this.on(this._refs.more, 'click', () => this.events.emit('more'));
  }

  private onClick(event: MouseEvent): void {
    const pressed = (event.target as Element).closest<HTMLElement>(ITEM_SELECTOR)?.dataset.id;
    const id = this.items.get().find((item) => item.id === pressed)?.id;
    if (id === undefined) {
      return;
    }
    this.value.set(id);
    this.events.emit('select', id);
  }

  private render(): void {
    this._refs.items.replaceChildren(...this.items.get().map((item) => this.renderItem(item)));
    this.renderCurrent(this.value.get());
  }

  private renderItem(item: TabBarItem<Id>): Node {
    const badge = badgeText(item.badge);
    const content = (
      <>
        <span class="icon">
          <JlIcon name={item.icon} size={ICON_SIZE} />
          {badge === '' ? null : <span class="badge">{badge}</span>}
        </span>
        <span class="label">{item.label}</span>
      </>
    );
    if (item.href === undefined) {
      return (
        <button class="item" type="button" data-id={item.id}>
          {content}
        </button>
      );
    }
    return (
      <a class="item" href={item.href} data-id={item.id}>
        {content}
      </a>
    );
  }

  /** The current item says so: `aria-current="page"`, drawn in the accent. */
  private renderCurrent(value: string): void {
    for (const item of this._refs.items.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) {
      setOrRemove(item, 'aria-current', item.dataset.id === value ? 'page' : '');
    }
  }
}

JlTabBar.register();
