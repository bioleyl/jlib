import { css } from '@jadis/core';
import { ChevronLeft, ChevronRight } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { clampedNumber, oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { CONTROL_SIZES } from '../lib/options';
import { clampPage, pageItems } from '../lib/pagination';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-pagination.css?raw';

import type { ControlSize } from '../types/options.types';
import type { PageItem } from '../types/pagination.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight });

const ICON_SIZES: Record<ControlSize, number> = { lg: 18, md: 16, sm: 14 };
const MAX_PAGES = Number.MAX_SAFE_INTEGER;
const MAX_NEIGHBOURS = 5;
const STEP_BACK = -1;
const STEP_FORWARD = 1;

/**
 * Moves through pages of results: the first and last pages, the current one with its neighbours, and gaps between;
 * or, `compact`, "3 of 12" between two arrows. `change` fires with the page people go to.
 */
export class JlPagination extends JlElement {
  static readonly selector = 'jl-pagination';

  readonly events = this.useEvents<{ change: number }>();

  /** The current page, from 1. */
  readonly page = this.useChange(1, () => this.render(), {
    attribute: 'page',
    parse: clampedNumber(1, 1, MAX_PAGES),
  });
  /** How many pages there are. */
  readonly pages = this.useChange(1, () => this.render(), {
    attribute: 'pages',
    parse: clampedNumber(1, 0, MAX_PAGES),
  });
  /** How many pages show on each side of the current one. */
  readonly siblings = this.useChange(1, () => this.render(), {
    attribute: 'siblings',
    parse: clampedNumber(1, 0, MAX_NEIGHBOURS),
  });
  /** How many pages always show at each end. */
  readonly boundaries = this.useChange(1, () => this.render(), {
    attribute: 'boundaries',
    parse: clampedNumber(1, 0, MAX_NEIGHBOURS),
  });
  /** Only the arrows and "3 of 12", for narrow places. */
  readonly compact = this.useChange(
    false,
    (value) => {
      this.reflect('compact', value);
      this.render();
    },
    { attribute: 'compact' }
  );
  readonly size = this.useChange<ControlSize>('md', (value) => this.renderSize(value), {
    attribute: 'size',
    parse: oneOf(CONTROL_SIZES, 'md'),
  });
  /** The navigation's name for screen readers, when a page has more than one. */
  readonly label = this.useChange(
    jlText('pagination'),
    (value) => {
      this._refs.nav.setAttribute('aria-label', value || jlText('pagination'));
    },
    { attribute: 'label' }
  );

  private readonly _refs = this.useRefs((ref) => ({
    list: ref('.pages'),
    nav: ref('nav'),
    next: ref<HTMLButtonElement>('.next'),
    nextIcon: ref<JlIcon>('.next jl-icon'),
    previous: ref<HTMLButtonElement>('.previous'),
    previousIcon: ref<JlIcon>('.previous jl-icon'),
    status: ref('.status'),
  }));

  templateHtml(): Node {
    return (
      <nav attrs={{ part: 'base' }}>
        <button type="button" class="button previous" aria-label={jlText('previousPage')}>
          <JlIcon name="chevron-left" />
        </button>
        <ol class="pages" />
        <span class="status" hidden />
        <button type="button" class="button next" aria-label={jlText('nextPage')}>
          <JlIcon name="chevron-right" />
        </button>
      </nav>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.previous, 'click', () => this.step(STEP_BACK));
    this.on(this._refs.next, 'click', () => this.step(STEP_FORWARD));
    this.on(this._refs.list, 'click', (event) => {
      const button = (event.target as Element).closest<HTMLElement>('[data-page]');
      if (button !== null) {
        this.goTo(Number(button.dataset.page));
        this._refs.list.querySelector<HTMLElement>('[aria-current]')?.focus();
      }
    });
  }

  /** The current page, kept within the pages there are. */
  private currentPage(): number {
    return clampPage(this.page.get(), this.pages.get());
  }

  private render(): void {
    const pages = this.pages.get();
    const page = this.currentPage();
    const compact = this.compact.get();
    this._refs.previous.disabled = page <= 1;
    this._refs.next.disabled = page >= pages;
    this._refs.list.hidden = compact;
    this._refs.status.hidden = !compact;
    this._refs.status.replaceChildren(<span class="sr-only">Page </span>, `${page} of ${Math.max(pages, 1)}`);
    if (!compact) {
      const items = pageItems(page, pages, this.siblings.get(), this.boundaries.get());
      this._refs.list.replaceChildren(...items.map((item) => this.entry(item, page)));
    }
  }

  private entry(item: PageItem, current: number): Node {
    if (item.type === 'gap') {
      return (
        <li class="gap" aria-hidden="true">
          …
        </li>
      );
    }
    const isCurrent = item.page === current;
    return (
      <li>
        <button
          type="button"
          class="button page"
          data-page={item.page}
          aria-label={`Page ${item.page}`}
          aria-current={isCurrent ? 'page' : undefined}>
          {String(item.page)}
        </button>
      </li>
    );
  }

  private renderSize(size: ControlSize): void {
    this.reflect('size', size);
    this._refs.previousIcon.size.set(ICON_SIZES[size]);
    this._refs.nextIcon.size.set(ICON_SIZES[size]);
  }

  /** Goes one page back or forward from an arrow; at an end, the focus moves to the other arrow. */
  private step(direction: typeof STEP_BACK | typeof STEP_FORWARD): void {
    this.goTo(this.currentPage() + direction);
    const arrow = direction === STEP_BACK ? this._refs.previous : this._refs.next;
    const other = direction === STEP_BACK ? this._refs.next : this._refs.previous;
    if (arrow.disabled) {
      other.focus();
    }
  }

  /** Goes to a page people picked, and says so. */
  private goTo(page: number): void {
    const target = clampPage(page, this.pages.get());
    if (target === this.currentPage()) {
      return;
    }
    this.page.set(target);
    this.events.emit('change', target);
  }
}

JlPagination.register();
