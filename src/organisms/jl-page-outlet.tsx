import { css } from '@jadis/core';

import { JlLoadingBar } from '../atoms/jl-loading-bar';
import { JlElement } from '../base/jl-element';
import { clampedNumber } from '../lib/attributes';
import { define } from '../lib/define';
import { setOrRemove } from '../lib/dom';
import { JlLoadState } from '../molecules/jl-load-state';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-page-outlet.css?inline';

// Past this, the next page shows as it is, its load states with their skeletons.
const DEFAULT_MAX_WAIT_MS = 3000;
const MAX_WAIT_LIMIT_MS = 30_000;
const NEXT_SLOT = 'next';

// The template writes <jl-loading-bar> as a tag, for its part: naming the class keeps it in the bundle.
define(JlLoadingBar);

/** Resolves after some milliseconds, or once the signal aborts. */
function waitFor(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

/**
 * Where an app's pages show, one at a time. A new page loads out of sight while the current one stays, usable,
 * under a line that says the next one is on its way; it takes the current one's place once its load states have
 * their data, or after `max-wait`, so a page never shows half drawn. The first page shows at once. It is the router's
 * way to show its pages: `router.mountOn(outlet, { show: (page) => outlet.show(page) })`.
 */
export class JlPageOutlet extends JlElement {
  static readonly selector = 'jl-page-outlet';

  readonly events = this.useEvents<{ show: HTMLElement }>();

  /** The longest the current page stays while the next one loads, in milliseconds. */
  readonly maxWait = this.useChange(DEFAULT_MAX_WAIT_MS, () => undefined, {
    attribute: 'max-wait',
    parse: clampedNumber(DEFAULT_MAX_WAIT_MS, 0, MAX_WAIT_LIMIT_MS),
  });

  // The wait of the page loading, which a newer page cuts short.
  private readonly _swap: { pending?: AbortController } = {};

  private readonly _refs = this.useRefs((ref) => ({
    line: ref(JlLoadingBar),
  }));

  /**
   * Shows a page: at once when none shows yet, else once it has its data, the current one staying until then. A page
   * still loading when another comes is dropped.
   */
  show(page: HTMLElement): void {
    this._swap.pending?.abort();
    for (const dropped of this.pages().filter((child) => child.slot === NEXT_SLOT)) {
      dropped.remove();
    }
    if (this.pages().length === 0) {
      this.append(page);
      this.reveal(page);
      return;
    }
    void this.showOnceLoaded(page);
  }

  templateHtml(): Node {
    return (
      <>
        <jl-loading-bar class="line" attrs={{ part: 'line' }} />
        <slot />
        <div class="next" inert aria-hidden="true">
          <slot name={NEXT_SLOT} />
        </div>
      </>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private async showOnceLoaded(page: HTMLElement): Promise<void> {
    const pending = new AbortController();
    this._swap.pending = pending;
    page.slot = NEXT_SLOT;
    this.append(page);
    this.drawWaiting(true);
    await Promise.race([
      JlLoadState.whenSettled(page, pending.signal),
      waitFor(this.maxWait.get(), pending.signal),
    ]);
    if (pending.signal.aborted) {
      return;
    }
    pending.abort();
    this.reveal(page);
  }

  /** Puts the page in the current one's place. */
  private reveal(page: HTMLElement): void {
    for (const left of this.pages().filter((child) => child !== page)) {
      left.remove();
    }
    page.removeAttribute('slot');
    this.drawWaiting(false);
    this.scrollToTop();
    this.events.emit('show', page);
  }

  private pages(): HTMLElement[] {
    return [...this.children].filter((child): child is HTMLElement => child instanceof HTMLElement);
  }

  private drawWaiting(waiting: boolean): void {
    setOrRemove(this, 'aria-busy', waiting ? 'true' : '');
    this.whenRendered(() => this._refs.line.active.set(waiting));
  }

  /** Brings the top of the new page into view, as a page loaded by the browser starts at its top. */
  private scrollToTop(): void {
    if (this.getBoundingClientRect().top >= 0) {
      return;
    }
    this.scrollIntoView({ block: 'start' });
  }
}

JlPageOutlet.register();
