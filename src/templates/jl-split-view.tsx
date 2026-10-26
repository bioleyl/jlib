import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { clampedNumber, oneOf } from '../lib/attributes';
import { clampMin, clampSplit, positionAfterKey, positionAt } from '../lib/split';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-split-view.css?raw';

import type { SplitOrientation } from '../types/jl-split-view.types';

export const SPLIT_ORIENTATIONS: readonly SplitOrientation[] = ['horizontal', 'vertical'];

const DEFAULT_POSITION = 50;
const DEFAULT_MIN = 15;
const FULL = 100;
const MAX_MIN = 50;
const PRIMARY_BUTTON = 0;
const DEFAULT_LABEL = 'Resize the panes';

// A horizontal split lays the panes side by side: the line between them is vertical, and so is the separator.
const SEPARATOR_ORIENTATION: Record<SplitOrientation, string> = { horizontal: 'vertical', vertical: 'horizontal' };

const parsePosition = clampedNumber(DEFAULT_POSITION, 0, FULL);

/**
 * Two panes, `start` and `end`, side by side or one above the other, with a divider to drag between them. The
 * divider also moves with the arrows (Shift for large steps), Home and End; a double click puts it back. `position`
 * is the start pane's share, in percent; each pane keeps at least `min` percent.
 */
export class JlSplitView extends JlElement {
  static readonly selector = 'jl-split-view';

  /** The new position, in percent, once a drag ends or a key moved the divider. */
  readonly events = this.useEvents<{ change: number }>();

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
  /** The divider's name for screen readers. */
  readonly label = this.useChange(
    DEFAULT_LABEL,
    (value) => {
      this._refs.divider.setAttribute('aria-label', value === '' ? DEFAULT_LABEL : value);
    },
    { attribute: 'label' }
  );

  private readonly _drag = { from: DEFAULT_POSITION };

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
    const divider = this._refs.divider;
    this.on(divider, 'pointerdown', (event) => this.startDrag(event));
    this.on(divider, 'pointermove', (event) => this.drag(event));
    this.on(divider, 'pointerup', (event) => this.endDrag(event));
    this.on(divider, 'pointercancel', (event) => this.endDrag(event));
    this.on(divider, 'keydown', (event) => this.onKey(event));
    this.on(divider, 'dblclick', () => this.reset());
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
