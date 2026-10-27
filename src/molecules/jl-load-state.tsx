import { css } from '@jadis/core';
import { CircleAlert, RefreshCw } from 'lucide';

import { JlButton } from '../atoms/jl-button';
import { JlSkeleton } from '../atoms/jl-skeleton';
import { JlElement } from '../base/jl-element';
import { clampedNumber, oneOf } from '../lib/attributes';
import { define } from '../lib/define';
import { registerIcons } from '../lib/icons';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import { JlEmpty } from './jl-empty';
import styles from './jl-load-state.css?raw';

import type { LoadSkeleton, LoadState, LoadTask } from '../types/jl-load-state.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'circle-alert': CircleAlert, refresh: RefreshCw });

// The template writes <jl-empty> as a tag, for the button it holds: naming the class keeps it in the bundle.
define(JlEmpty);

export const LOAD_STATES: readonly LoadState[] = ['loading', 'ready', 'empty', 'error'];
export const LOAD_SKELETONS: readonly LoadSkeleton[] = ['rows', 'cards', 'lines'];

const DEFAULT_ERROR_HEADING = 'This could not be loaded';
// A quick answer shows no skeleton at all: it would only flash.
const DEFAULT_DELAY_MS = 300;
const MAX_DELAY_MS = 5000;
const DEFAULT_COUNT = 3;
const MAX_COUNT = 24;
// The widths of a paragraph's lines, so the skeleton reads as text.
const LINE_WIDTHS = ['100%', '92%', '96%', '70%'];

/** The skeleton of each shape, `count` times. */
const SKELETONS: Record<LoadSkeleton, (count: number) => Node[]> = {
  cards: (count) =>
    Array.from({ length: count }, () => (
      <div class="bone-card">
        <JlSkeleton shape="rect" height="120px" />
        <JlSkeleton width="70%" />
        <JlSkeleton width="45%" />
      </div>
    )),
  lines: (count) =>
    Array.from({ length: count }, (_, index) => <JlSkeleton width={LINE_WIDTHS[index % LINE_WIDTHS.length]} />),
  rows: (count) =>
    Array.from({ length: count }, () => (
      <div class="bone-row">
        <JlSkeleton shape="circle" width="32px" height="32px" />
        <div class="bone-lines">
          <JlSkeleton width="60%" />
          <JlSkeleton width="35%" />
        </div>
      </div>
    )),
};

/**
 * What a list or a page shows while its data comes: nothing for a moment, then a skeleton shaped like it; then the
 * data (the default slot), what to say when there is none (slot `empty`, a `jl-empty`), or, when it failed, what
 * failed and Try again. `load()` fetches, draws and moves between the states; a later `load()` keeps what is shown
 * until the new data is there, so live updates do not flash. Or set `state` yourself.
 */
export class JlLoadState extends JlElement {
  static readonly selector = 'jl-load-state';

  readonly events = this.useEvents<{ retry: undefined }>();

  readonly state = this.useChange<LoadState>('loading', (value) => this.renderState(value), {
    attribute: 'state',
    parse: oneOf(LOAD_STATES, 'loading'),
  });
  /** The shape of the skeleton; slot `loading` takes one of the page's own instead. */
  readonly skeleton = this.useChange<LoadSkeleton>('rows', () => this.renderSkeleton(), {
    attribute: 'skeleton',
    parse: oneOf(LOAD_SKELETONS, 'rows'),
  });
  /** How many rows, cards or lines the skeleton has. */
  readonly count = this.useChange(DEFAULT_COUNT, () => this.renderSkeleton(), {
    attribute: 'count',
    parse: clampedNumber(DEFAULT_COUNT, 1, MAX_COUNT),
  });
  /** Milliseconds before the skeleton shows. */
  readonly delay = this.useChange(DEFAULT_DELAY_MS, () => undefined, {
    attribute: 'delay',
    parse: clampedNumber(DEFAULT_DELAY_MS, 0, MAX_DELAY_MS),
  });
  readonly errorHeading = this.useChange(DEFAULT_ERROR_HEADING, (value) => this._refs.error.heading.set(value), {
    attribute: 'error-heading',
  });
  readonly errorText = this.useChange(
    jlText('loadStateError'),
    (value) => this._refs.error.description.set(value),
    {
      attribute: 'error-text',
    }
  );
  readonly retryLabel = this.useChange(jlText('retry'), (value) => this._refs.retry.label.set(value), {
    attribute: 'retry-label',
  });

  // The last load, which Try again runs again, and the timer that shows the skeleton.
  // The last load, which Try again runs again; the number of the latest load, which alone may draw; and the timer
  // that shows the skeleton.
  private readonly _work: {
    latest: number;
    retry?: () => Promise<boolean>;
    timer?: ReturnType<typeof setTimeout>;
  } = { latest: 0 };

  private readonly _refs = this.useRefs((ref) => ({
    bones: ref('.bones'),
    content: ref('.content'),
    empty: ref('.empty'),
    error: ref(JlEmpty),
    loading: ref('.loading'),
    retry: ref<JlButton>('.retry'),
  }));

  /**
   * Fetches the data and draws it. The first time, and after a failure, the skeleton shows while it comes; later
   * (a refresh), what is shown stays until the new data is there, and stays too if it fails. Resolves to whether it
   * worked: a refresh that fails says so only here, for the page to tell people. A load overtaken by a later one
   * (a search typed on, a poll during a reload) draws nothing and resolves true: the later one decides.
   */
  async load<Value>(task: LoadTask<Value>): Promise<boolean> {
    this._work.latest += 1;
    const ticket = this._work.latest;
    this._work.retry = () => this.load(task);
    if (!this.isShowing()) {
      this.state.set('loading');
    }
    try {
      const value = await task.fetch();
      if (ticket !== this._work.latest) {
        return true;
      }
      task.draw(value);
      this.state.set(task.isEmpty?.(value) === true ? 'empty' : 'ready');
      return true;
    } catch {
      if (ticket !== this._work.latest) {
        return true;
      }
      if (!this.isShowing()) {
        this.state.set('error');
      }
      return false;
    }
  }

  /** Whether data is shown (the content or the empty state), which a refresh keeps. */
  private isShowing(): boolean {
    const state = this.state.get();
    return state === 'ready' || state === 'empty';
  }

  templateHtml(): Node {
    return (
      <div class="load-state" attrs={{ part: 'base' }}>
        <div class="loading" hidden aria-busy="true">
          <slot name="loading">
            <div class="bones" />
          </slot>
        </div>
        <jl-empty
          class="error"
          icon="circle-alert"
          heading={DEFAULT_ERROR_HEADING}
          description={jlText('loadStateError')}
          hidden>
          <JlButton class="retry" icon="refresh" label={jlText('retry')} />
        </jl-empty>
        <div class="empty" hidden>
          <slot name="empty" />
        </div>
        <div class="content" hidden>
          <slot />
        </div>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.renderSkeleton();
    this.renderState(this.state.get());
    this._refs.retry.events.register('press', () => {
      this.events.emit('retry');
      void this._work.retry?.();
    });
  }

  onDisconnect(): void {
    clearTimeout(this._work.timer);
  }

  private renderState(state: LoadState): void {
    const refs = this._refs;
    clearTimeout(this._work.timer);
    refs.loading.hidden = true;
    refs.error.hidden = state !== 'error';
    refs.empty.hidden = state !== 'empty';
    refs.content.hidden = state !== 'ready';
    this.reflect('state', state);
    if (state === 'loading') {
      this._work.timer = setTimeout(() => {
        refs.loading.hidden = false;
      }, this.delay.get());
    }
  }

  private renderSkeleton(): void {
    const kind = this.skeleton.get();
    this._refs.bones.className = `bones ${kind}`;
    this._refs.bones.replaceChildren(...SKELETONS[kind](this.count.get()));
  }
}

JlLoadState.register();
