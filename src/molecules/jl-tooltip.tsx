import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { arrowOffset } from '../lib/arrow';
import { clampedNumber, oneOf } from '../lib/attributes';
import { followAnchor, PLACEMENTS, placeFloating } from '../lib/floating';
import { accessibleTarget, deepActiveElement } from '../lib/trigger';
import { BASE_STYLES, FLOATING_STYLES } from '../styles/shared';
import styles from './jl-tooltip.css?raw';

import type { Placement, Side } from '../types/floating.types';

const DEFAULT_DELAY_MS = 300;
const MAX_DELAY_MS = 10_000;
// Time to move the pointer from the trigger onto the bubble before it hides.
const HIDE_GRACE_MS = 120;
// Room between the trigger and the bubble, for the arrow.
const GAP = 9;
// The arrow keeps this far from the bubble's corners.
const ARROW_MARGIN = 10;
const DESCRIPTION = 'aria-description';

const sideOf = (placement: Placement): Side => placement.split('-')[0] as Side;

/**
 * A short hint in a dark bubble by its trigger (the slotted element): it shows on hover and on keyboard focus after
 * a `delay`, and hides on leave, blur and Escape. The trigger gets the text as its accessible description.
 */
export class JlTooltip extends JlElement {
  static readonly selector = 'jl-tooltip';

  readonly text = this.useChange('', (value) => this.renderText(value), { attribute: 'text' });
  /** Where the bubble goes; it flips to the other side when there is no room. */
  readonly placement = this.useChange<Placement>('top', () => this.reposition(), {
    attribute: 'placement',
    parse: oneOf(PLACEMENTS, 'top'),
  });
  /** How long the pointer or the focus stays on the trigger before the bubble shows, in milliseconds. */
  readonly delay = this.useChange(DEFAULT_DELAY_MS, () => undefined, {
    attribute: 'delay',
    parse: clampedNumber(DEFAULT_DELAY_MS, 0, MAX_DELAY_MS),
  });

  private readonly _state = {
    described: null as Element | null,
    following: new AbortController(),
    hideTimer: 0,
    showTimer: 0,
  };

  private readonly _refs = this.useRefs((ref) => ({
    bubble: ref('.bubble'),
    slot: ref('slot'),
    text: ref('.text'),
  }));

  templateHtml(): Node {
    return (
      <>
        <slot />
        <div class="floating bubble" popover="manual" role="tooltip" attrs={{ part: 'base' }}>
          <span class="text" />
          <span class="arrow" />
        </div>
      </>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${FLOATING_STYLES}${styles}`;
  }

  onConnect(): void {
    this.describeTrigger();
    this.on(this._refs.slot, 'slotchange', () => this.describeTrigger());
    this.on(this, 'pointerenter', () => this.scheduleShow());
    this.on(this, 'pointerleave', () => this.scheduleHide());
    this.on(this, 'pointerdown', () => this.close());
    this.on(this, 'focusin', () => {
      if (deepActiveElement(document)?.matches(':focus-visible') === true) {
        this.scheduleShow();
      }
    });
    this.on(this, 'focusout', () => this.close());
  }

  onDisconnect(): void {
    this.close();
  }

  /** Shows the bubble now. */
  show(): void {
    this.whenRendered(() => this.open());
  }

  /** Hides the bubble now. */
  hide(): void {
    this.whenRendered(() => this.close());
  }

  private close(): void {
    window.clearTimeout(this._state.showTimer);
    window.clearTimeout(this._state.hideTimer);
    this._state.following.abort();
    const bubble = this._refs.bubble;
    if (bubble.matches(':popover-open')) {
      bubble.hidePopover();
    }
  }

  private trigger(): Element {
    return this._refs.slot.assignedElements({ flatten: true })[0] ?? this;
  }

  private isOpen(): boolean {
    return this._refs.bubble.matches(':popover-open');
  }

  private scheduleShow(): void {
    window.clearTimeout(this._state.hideTimer);
    if (this.isOpen()) {
      return;
    }
    window.clearTimeout(this._state.showTimer);
    this._state.showTimer = window.setTimeout(() => this.open(), this.delay.get());
  }

  private scheduleHide(): void {
    window.clearTimeout(this._state.showTimer);
    window.clearTimeout(this._state.hideTimer);
    this._state.hideTimer = window.setTimeout(() => this.close(), HIDE_GRACE_MS);
  }

  private open(): void {
    if (this.text.get() === '' || this.isOpen()) {
      return;
    }
    const bubble = this._refs.bubble;
    bubble.showPopover();
    const following = new AbortController();
    this._state.following = following;
    followAnchor(this.trigger(), bubble, this.placement.get(), following.signal, GAP);
    // After followAnchor's own listeners, so the arrow points from where the bubble went.
    window.addEventListener('scroll', () => this.placeArrow(), {
      capture: true,
      passive: true,
      signal: following.signal,
    });
    window.addEventListener('resize', () => this.placeArrow(), { passive: true, signal: following.signal });
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') {
          this.close();
        }
      },
      { signal: following.signal }
    );
    this.placeArrow();
  }

  private reposition(): void {
    if (!this.isOpen()) {
      return;
    }
    placeFloating(this.trigger(), this._refs.bubble, this.placement.get(), GAP);
    this.placeArrow();
  }

  private placeArrow(): void {
    const bubble = this._refs.bubble;
    const placement = (bubble.dataset.placement ?? this.placement.get()) as Placement;
    const offset = arrowOffset(
      this.trigger().getBoundingClientRect(),
      bubble.getBoundingClientRect(),
      sideOf(placement),
      ARROW_MARGIN
    );
    bubble.style.setProperty('--arrow', `${offset}px`);
  }

  private renderText(text: string): void {
    this._refs.text.textContent = text;
    this.describeTrigger();
    if (text === '') {
      this.close();
      return;
    }
    this.reposition();
  }

  /** Gives the trigger the text as its description, and takes it back from a trigger that left. */
  private describeTrigger(): void {
    const target = accessibleTarget(this.trigger());
    const previous = this._state.described;
    if (previous !== null && previous !== target) {
      previous.removeAttribute(DESCRIPTION);
    }
    this._state.described = target;
    const text = this.text.get();
    if (text === '' || target === this) {
      target.removeAttribute(DESCRIPTION);
      return;
    }
    target.setAttribute(DESCRIPTION, text);
  }
}

JlTooltip.register();
