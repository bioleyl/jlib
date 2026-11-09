import { css } from '@jadis/core';
import { ChevronRight, Ellipsis } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-breadcrumb.css?inline';

import type { BreadcrumbItem } from '../types/jl-breadcrumb.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'chevron-right': ChevronRight, ellipsis: Ellipsis });

const ICON_SIZE = 15;
const SEPARATOR_SIZE = 14;
// Collapsed, the trail keeps its first item and the last `max - 1`: below 2 there is nothing to keep.
const MIN_MAX = 2;

type Crumb<Id extends string> = { item: BreadcrumbItem<Id>; index: number } | { hidden: number };

/** The crumbs shown: all of them, or the first, a gap for the middle, and the last `max - 1`. */
function visibleCrumbs<Id extends string>(
  items: readonly BreadcrumbItem<Id>[],
  max: number,
  expanded: boolean
): Crumb<Id>[] {
  const all = items.map((item, index) => ({ index, item }));
  if (expanded || max < MIN_MAX || items.length <= max) {
    return all;
  }
  const tail = all.slice(items.length - (max - 1));
  return [...all.slice(0, 1), { hidden: items.length - max }, ...tail];
}

/**
 * Where the page sits in a hierarchy: a trail of links, the last one being the current page. With `max`, a long
 * trail folds its middle into a button that unfolds it. An item with an `id` instead of an `href` is followed by the
 * app: the breadcrumb fires `select` with its id. Typed by its ids, `JlBreadcrumb<'orders' | 'order'>`.
 */
export class JlBreadcrumb<Id extends string = string> extends JlElement {
  static readonly selector = 'jl-breadcrumb';

  readonly events = this.useEvents<{ select: Id }>();

  // Before `items`: as the trail connects, each input calls back in this order, so the items come with their `max`.
  /** The most items shown before the middle folds; 0 never folds. */
  readonly max = this.useChange(0, () => this.render(), { attribute: 'max' });
  readonly items = this.useChange<BreadcrumbItem<Id>[]>([], () => this.renderTrail(), {
    attribute: 'items',
    parse: jsonOf([]),
  });
  /** The trail's name for screen readers. */
  readonly label = this.useChange('', () => this.renderLabel(), { attribute: 'label' });

  /** `drawn` is what the trail was made from: the inputs call back with what they hold as the trail connects. */
  private readonly _state = {
    drawn: { expanded: false, items: null as BreadcrumbItem<Id>[] | null, max: 0 },
    expanded: false,
  };

  private readonly _refs = this.useRefs((ref) => ({
    list: ref('ol'),
    nav: ref('nav'),
  }));

  templateHtml(): Node {
    return (
      <nav attrs={{ part: 'base' }}>
        <ol />
      </nav>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.list, 'click', (event) => {
      const target = event.target as Element;
      if (target.closest('.more') !== null) {
        this.expand();
        return;
      }
      this.follow(target.closest<HTMLElement>('button.crumb')?.dataset.id);
    });
  }

  protected drawTexts(): void {
    this.renderLabel();
    this.renderMoreLabel();
  }

  private renderLabel(): void {
    this._refs.nav.setAttribute('aria-label', this.label.get() || jlText('breadcrumb'));
  }

  /** A new trail starts folded. */
  private renderTrail(): void {
    this._state.expanded = false;
    this.render();
  }

  private render(): void {
    const items = this.items.get();
    const max = this.max.get();
    const expanded = this._state.expanded;
    const drawn = this._state.drawn;
    if (items === drawn.items && max === drawn.max && expanded === drawn.expanded) {
      return;
    }
    this._state.drawn = { expanded, items, max };
    const crumbs = visibleCrumbs(items, max, expanded);
    const lastIndex = items.length - 1;
    this._refs.list.replaceChildren(
      ...crumbs.map((crumb, position) => (
        <li>
          {position > 0 ? <JlIcon class="separator" name="chevron-right" size={SEPARATOR_SIZE} /> : ''}
          {'hidden' in crumb ? this.moreButton(crumb.hidden) : this.crumb(crumb.item, crumb.index === lastIndex)}
        </li>
      ))
    );
    this.renderMoreLabel();
  }

  /** The folding button says how many items it holds, in jlib's language. */
  private renderMoreLabel(): void {
    const more = this._refs.list.querySelector<HTMLElement>('.more');
    if (more === null) {
      return;
    }
    const label = jlText('showMoreCount', { count: Number(more.dataset.count) });
    more.setAttribute('aria-label', label);
    more.title = label;
  }

  /** An item the app follows, found among the items by the id its button carries. */
  private follow(id: string | undefined): void {
    const item = this.items.get().find((candidate) => candidate.id !== undefined && candidate.id === id);
    if (item?.id !== undefined) {
      this.events.emit('select', item.id);
    }
  }

  private crumb(item: BreadcrumbItem<Id>, current: boolean): Node {
    const ariaCurrent = current ? 'page' : undefined;
    const content = [
      item.icon === undefined ? '' : <JlIcon name={item.icon} size={ICON_SIZE} />,
      <span class="label">{item.label}</span>,
    ];
    if (item.href === undefined && item.id !== undefined) {
      return (
        <button type="button" class="crumb" data-id={item.id} title={item.label} aria-current={ariaCurrent}>
          {content}
        </button>
      );
    }
    if (item.href === undefined) {
      return (
        <span class="crumb" title={item.label} aria-current={ariaCurrent}>
          {content}
        </span>
      );
    }
    return (
      <a class="crumb" href={item.href} title={item.label} aria-current={ariaCurrent}>
        {content}
      </a>
    );
  }

  private moreButton(hidden: number): Node {
    return (
      <button type="button" class="more" data-count={String(hidden)}>
        <JlIcon name="ellipsis" size={ICON_SIZE} />
      </button>
    );
  }

  /** Unfolds the middle, and moves the focus to the first item it showed. */
  private expand(): void {
    this._state.expanded = true;
    this.render();
    this._refs.list.querySelector<HTMLElement>('li:nth-child(2) .crumb')?.focus();
  }
}

JlBreadcrumb.register();
