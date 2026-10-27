import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { clampedNumber, oneOf } from '../lib/attributes';
import { watchSizes } from '../lib/resize';
import { clampMin, clampSplit, positionAfterKey, positionAt } from '../lib/split';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-split-view.css?raw';

import type { SplitOrientation, SplitPane } from '../types/jl-split-view.types';

export const SPLIT_ORIENTATIONS: readonly SplitOrientation[] = ['horizontal', 'vertical'];
export const SPLIT_PANES: readonly SplitPane[] = ['start', 'end'];

const DEFAULT_POSITION = 50;
const DEFAULT_MIN = 15;
const FULL = 100;
const MAX_MIN = 50;
const PRIMARY_BUTTON = 0;
const DEFAULT_LABEL = 'Resize the panes';
const STACKED = 'stacked';
// The widest `stack-below` reads: a split view stacks under a phone or a tablet's width, not a desktop's.
const MAX_STACK_WIDTH = 4000;

// A horizontal split lays the panes side by side: the line between them is vertical, and so is the separator.
const SEPARATOR_ORIENTATION: Record<SplitOrientation, string> = { horizontal: 'vertical', vertical: 'horizontal' };

const parsePosition = clampedNumber(DEFAULT_POSITION, 0, FULL);

/**
 * Two panes, `start` and `end`, side by side or one above the other, with a divider to drag between them. The
 * divider also moves with the arrows (Shift for large steps), Home and End; a double click puts it back. `position`
 * is the start pane's share, in percent; each pane keeps at least `min` percent.
 *
 * Narrower than `stack-below` pixels, it shows one pane at a time, the one `pane` names: a list and the item opened
 * from it become two pages, as a phone shows them. It then has the attribute `stacked`, and fires `stack`.
 */
export class JlSplitView extends JlElement {
  static readonly selector = 'jl-split-view';

  /** The new position, in percent, once a drag ends or a key moved the divider. */
  readonly events = this.useEvents<{ change: number; stack: boolean }>();

  readonly orientation = this.useChange<SplitOrientation>(
    'horizontal',
    (value) => {
      this.reflect('orientation', value);
      this._refs.divider.setAttribute('aria-orientation', SEPARATOR_ORIENTATION[value]);
    },
    { attribute: 'orientation', parse: oneOf(SPLIT_ORIENTATIONS, 'horizontal') }
  );
  /** The start pane's share of the room, in percent. */
  readonly position = this.useChange(DEFAULT_POSITION, () => this.renderPosition(), {
    attribute: 'position',
    parse: parsePosition,
  });
  /** The smallest share each pane keeps, in percent (0 to 50). */
  readonly min = this.useChange(DEFAULT_MIN, () => this.renderPosition(), {
    attribute: 'min',
    parse: clampedNumber(DEFAULT_MIN, 0, MAX_MIN),
  });
  /** Under this width, in pixels, it shows one pane at a time; 0 never does. */
  readonly stackBelow = this.useChange(0, () => this.renderStacked(), {
    attribute: 'stack-below',
    parse: clampedNumber(0, 0, MAX_STACK_WIDTH),
  });
  /** The pane it shows while stacked: `start`, or `end` once an item is open. */
  readonly pane = this.useChange<SplitPane>('start', (value) => this.reflect('pane', value), {
    attribute: 'pane',
    parse: oneOf(SPLIT_PANES, 'start'),
  });
  /** The divider's name for screen readers. */
  readonly label = this.useChange(
    DEFAULT_LABEL,
    (value) => {
      this._refs.divider.setAttribute('aria-label', value === '' ? DEFAULT_LABEL : value);
    },
    { attribute: 'label' }
  );

  private readonly _drag = { from: DEFAULT_POSITION };

  // Its own width decides whether it stacks: the page around it may be narrow on a wide screen.
  private readonly _resize = watchSizes(() => this.renderStacked());

  /** Whether it shows one pane at a time now. */
  isStacked(): boolean {
    return this.hasAttribute(STACKED);
  }

  private readonly _refs = this.useRefs((ref) => ({
    divider: ref('.divider'),
    split: ref('.split'),
  }));

  /** Puts the divider back where the page first placed it. */
  reset(): void {
    this.whenRendered(() => this.commit(parsePosition(this.getAttribute('position'))));
  }

  templateHtml(): Node {
    return (
      <div class="split" attrs={{ part: 'base' }}>
        <div class="pane start" id="start" attrs={{ part: 'start' }}>
          <slot name="start" />
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: a separator people move holds a grip and takes the focus */}
        <div
          class="divider"
          role="separator"
          tabIndex={0}
          aria-controls="start"
          aria-valuenow={String(DEFAULT_POSITION)}
          aria-valuemin="0"
          aria-valuemax="100"
          attrs={{ part: 'divider' }}>
          <span class="grip" />
        </div>
        <div class="pane end" attrs={{ part: 'end' }}>
          <slot name="end" />
        </div>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._resize.observe(this);
    const divider = this._refs.divider;
    this.on(divider, 'pointerdown', (event) => this.startDrag(event));
    this.on(divider, 'pointermove', (event) => this.drag(event));
    this.on(divider, 'pointerup', (event) => this.endDrag(event));
    this.on(divider, 'pointercancel', (event) => this.endDrag(event));
    this.on(divider, 'keydown', (event) => this.onKey(event));
    this.on(divider, 'dblclick', () => this.reset());
  }

  onDisconnect(): void {
    this._resize.disconnect();
  }

  private renderStacked(): void {
    const below = this.stackBelow.get();
    const stacked = below > 0 && this.getBoundingClientRect().width < below;
    if (stacked === this.isStacked()) {
      return;
    }
    this.reflect(STACKED, stacked);
    this.events.emit('stack', stacked);
  }

  private current(): number {
    return clampSplit(this.position.get(), this.min.get());
  }

  private startDrag(event: PointerEvent): void {
    if (event.button !== PRIMARY_BUTTON) {
      return;
    }
    event.preventDefault();
    this._refs.divider.setPointerCapture(event.pointerId);
    this._drag.from = this.current();
    this.reflect('dragging', true);
  }

  private drag(event: PointerEvent): void {
    if (!this._refs.divider.hasPointerCapture(event.pointerId)) {
      return;
    }
    const rect = this._refs.split.getBoundingClientRect();
    const horizontal = this.orientation.get() === 'horizontal';
    const position = horizontal
      ? positionAt(event.clientX, rect.left, rect.width)
      : positionAt(event.clientY, rect.top, rect.height);
    this.position.set(clampSplit(position, this.min.get()));
  }

  private endDrag(event: PointerEvent): void {
    const divider = this._refs.divider;
    if (!divider.hasPointerCapture(event.pointerId)) {
      return;
    }
    divider.releasePointerCapture(event.pointerId);
    this.reflect('dragging', false);
    if (this.current() !== this._drag.from) {
      this.events.emit('change', this.current());
    }
  }

  private onKey(event: KeyboardEvent): void {
    const next = positionAfterKey(
      this.current(),
      event.key,
      this.orientation.get(),
      this.min.get(),
      event.shiftKey
    );
    if (next === null) {
      return;
    }
    event.preventDefault();
    this.commit(next);
  }

  /** Moves the divider as people asked, and says so when it moved. */
  private commit(position: number): void {
    const next = clampSplit(position, this.min.get());
    const moved = next !== this.current();
    this.position.set(next);
    if (moved) {
      this.events.emit('change', next);
    }
  }

  private renderPosition(): void {
    const min = clampMin(this.min.get());
    const position = this.current();
    this._refs.split.style.setProperty('--position', `${position}%`);
    const divider = this._refs.divider;
    divider.setAttribute('aria-valuenow', String(Math.round(position)));
    divider.setAttribute('aria-valuemin', String(min));
    divider.setAttribute('aria-valuemax', String(FULL - min));
  }
}

JlSplitView.register();
