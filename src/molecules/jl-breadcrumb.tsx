import { css } from '@jadis/core';
import { ChevronRight, Ellipsis } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-breadcrumb.css?raw';

import type { BreadcrumbItem } from '../types/jl-breadcrumb.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'chevron-right': ChevronRight, ellipsis: Ellipsis });

const ICON_SIZE = 15;
const SEPARATOR_SIZE = 14;
// Collapsed, the trail keeps its first item and the last `max - 1`: below 2 there is nothing to keep.
const MIN_MAX = 2;

type Crumb = { item: BreadcrumbItem; index: number } | { hidden: number };

/** The crumbs shown: all of them, or the first, a gap for the middle, and the last `max - 1`. */
function visibleCrumbs(items: readonly BreadcrumbItem[], max: number, expanded: boolean): Crumb[] {
  const all = items.map((item, index) => ({ index, item }));
  if (expanded || max < MIN_MAX || items.length <= max) {
    return all;
  }
  const tail = all.slice(items.length - (max - 1));
  return [...all.slice(0, 1), { hidden: items.length - max }, ...tail];
}

/**
 * Where the page sits in a hierarchy: a trail of links, the last one being the current page. With `max`, a long
 * trail folds its middle into a button that unfolds it.
 */
export class JlBreadcrumb extends JlElement {
  static readonly selector = 'jl-breadcrumb';

  readonly items = this.useChange<BreadcrumbItem[]>([], () => this.renderTrail(), {
    attribute: 'items',
    parse: jsonOf([]),
  });
  /** The most items shown before the middle folds; 0 never folds. */
  readonly max = this.useChange(0, () => this.render(), { attribute: 'max' });
  /** The trail's name for screen readers. */
  readonly label = this.useChange('', () => this.renderLabel(), { attribute: 'label' });

  private readonly _state = { expanded: false };

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
      if ((event.target as Element).closest('.more') !== null) {
        this.expand();
      }
    });
  }

  protected drawTexts(): void {
    this.renderLabel();
    this.render();
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
    const crumbs = visibleCrumbs(items, this.max.get(), this._state.expanded);
    const lastIndex = items.length - 1;
    this._refs.list.replaceChildren(
      ...crumbs.map((crumb, position) => (
        <li>
          {position > 0 ? <JlIcon class="separator" name="chevron-right" size={SEPARATOR_SIZE} /> : ''}
          {'hidden' in crumb ? this.moreButton(crumb.hidden) : this.crumb(crumb.item, crumb.index === lastIndex)}
        </li>
      ))
    );
  }

  private crumb(item: BreadcrumbItem, current: boolean): Node {
    const ariaCurrent = current ? 'page' : undefined;
    const content = [
      item.icon === undefined ? '' : <JlIcon name={item.icon} size={ICON_SIZE} />,
      <span class="label">{item.label}</span>,
    ];
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
    const label = jlText('showMoreCount', { count: hidden });
    return (
      <button type="button" class="more" aria-label={label} title={label}>
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
