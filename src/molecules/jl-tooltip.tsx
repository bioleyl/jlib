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
const TITLE = 'title';
const TOUCH = 'touch';
// Press and hold this long on a touch screen to read the bubble, as phones do for icon buttons.
const LONG_PRESS_MS = 500;
// A finger that moves further than this is scrolling, not holding.
const MOVE_TOLERANCE_PX = 10;
// How long the bubble stays once the finger lifts.
const TOUCH_LINGER_MS = 1500;
// Triggers that do something when tapped: there, a tap acts and only a long press shows the bubble.
const INTERACTIVE = 'a[href], button, input, select, textarea, summary, [role="button"], [role="link"]';

const sideOf = (placement: Placement): Side => placement.split('-')[0] as Side;

/**
 * A short hint in a dark bubble by its trigger (the slotted element): it shows on hover and on keyboard focus after
 * a `delay`, and hides on leave, blur and Escape. The trigger gets the text as its accessible description. While
 * the pointer or the focus is on it, the trigger's own `title` (a button's `hint`) is set aside, so the browser's
 * tooltip does not show over the bubble.
 *
 * Touch screens have no hover: pressing and holding a trigger shows the bubble (and the press does not act), and
 * it stays a moment after the finger lifts; a trigger that does nothing on a tap (a word, an icon) shows or hides
 * it on a tap.
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
    // The native titles set aside while the trigger is pointed at or focused, to give back after.
    heldTitles: [] as { element: Element; title: string }[],
    hideTimer: 0,
    // A finger on the trigger: whether it is down and moved (a scroll), where it went down, the timer of the long
    // press, and whether that showed the bubble.
    press: { down: false, moved: false, opened: false, timer: 0, x: 0, y: 0 },
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
    this.on(this, 'pointerenter', (event) => {
      if (event.pointerType === TOUCH) {
        return;
      }
      this.holdTitles();
      this.scheduleShow();
    });
    this.on(this, 'pointerleave', (event) => {
      // A finger leaves when it lifts: the press decides how long the bubble stays.
      if (event.pointerType !== TOUCH) {
        this.scheduleHide();
      }
    });
    this.on(this, 'pointerdown', (event) => {
      if (event.pointerType === TOUCH) {
        this.pressStart(event);
        return;
      }
      // A click hides the bubble; the titles come back once the pointer leaves, or the browser would show them.
      this.hideBubble();
    });
    this.on(this, 'pointermove', (event) => this.pressMove(event));
    this.on(this, 'pointerup', () => this.pressUp());
    // The page took the finger to scroll: no tap, no long press.
    this.on(this, 'pointercancel', () => this.pressEnd());
    // Some phones open a menu on a long press: the bubble shows instead, except over a link, whose menu matters.
    this.on(this, 'contextmenu', (event) => this.pressHeld(event));
    // A long press shows the bubble instead of pressing the trigger: the click it may end with does nothing.
    this.addEventListener('click', (event) => this.swallowLongPress(event), {
      capture: true,
      signal: this.killSignal,
    });
    this.on(this, 'focusin', () => {
      if (deepActiveElement(document)?.matches(':focus-visible') === true) {
        this.holdTitles();
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
    this.hideBubble();
    this.restoreTitles();
  }

  /** A trigger that acts on a tap (a button, a link, a field), as opposed to a word or an icon. */
  private isInteractive(): boolean {
    return accessibleTarget(this.trigger()).matches(INTERACTIVE);
  }

  private pressStart(event: PointerEvent): void {
    const press = this._state.press;
    window.clearTimeout(press.timer);
    press.down = true;
    press.moved = false;
    press.opened = false;
    press.x = event.clientX;
    press.y = event.clientY;
    if (this.isInteractive()) {
      press.timer = window.setTimeout(() => this.openFromPress(), LONG_PRESS_MS);
    }
  }

  private pressMove(event: PointerEvent): void {
    const press = this._state.press;
    const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    if (press.down && moved > MOVE_TOLERANCE_PX) {
      press.moved = true;
      window.clearTimeout(press.timer);
    }
  }

  /** The finger lifted. On a trigger that does nothing else on a tap, a tap (not a scroll) shows or hides the bubble. */
  private pressUp(): void {
    const press = this._state.press;
    const tapped = press.down && !press.moved;
    this.pressEnd();
    if (!tapped || this.isInteractive()) {
      return;
    }
    if (this.isOpen()) {
      this.close();
      return;
    }
    this.open();
  }

  /** The finger is gone: a bubble the long press showed stays a moment, then goes. */
  private pressEnd(): void {
    const press = this._state.press;
    window.clearTimeout(press.timer);
    press.down = false;
    if (!press.opened) {
      return;
    }
    window.clearTimeout(this._state.hideTimer);
    this._state.hideTimer = window.setTimeout(() => this.close(), TOUCH_LINGER_MS);
  }

  /** The system's own long press: the bubble shows now, and the menu it would open does not, but over a link. */
  private pressHeld(event: MouseEvent): void {
    if (!this._state.press.down || !this.isInteractive()) {
      return;
    }
    if (this.openFromPress() && !accessibleTarget(this.trigger()).matches('a[href]')) {
      event.preventDefault();
    }
  }

  /** The long press shows the bubble, and says whether there is one: without a text, the press stays a press. */
  private openFromPress(): boolean {
    window.clearTimeout(this._state.press.timer);
    if (this.text.get() === '') {
      return false;
    }
    this._state.press.opened = true;
    this.open();
    return true;
  }

  private swallowLongPress(event: MouseEvent): void {
    const press = this._state.press;
    if (!press.opened) {
      return;
    }
    press.opened = false;
    event.preventDefault();
    event.stopPropagation();
  }

  private hideBubble(): void {
    window.clearTimeout(this._state.press.timer);
    window.clearTimeout(this._state.showTimer);
    window.clearTimeout(this._state.hideTimer);
    this._state.following.abort();
    const bubble = this._refs.bubble;
    if (bubble.matches(':popover-open')) {
      bubble.hidePopover();
    }
  }

  /**
   * Sets aside the native `title` of the trigger and of its inner control: the bubble says it, and the browser's
   * own tooltip would show over it a moment later. The control keeps its name for screen readers (a button's hint
   * is its `aria-label` too).
   */
  private holdTitles(): void {
    if (this.text.get() === '' || this._state.heldTitles.length > 0) {
      return;
    }
    const trigger = this.trigger();
    const elements = [...new Set([trigger, accessibleTarget(trigger)])];
    this._state.heldTitles = elements.flatMap((element) => {
      const title = element.getAttribute(TITLE);
      if (title === null) {
        return [];
      }
      element.removeAttribute(TITLE);
      return [{ element, title }];
    });
  }

  /** Gives the titles back, unless the trigger wrote new ones meanwhile. */
  private restoreTitles(): void {
    for (const { element, title } of this._state.heldTitles) {
      if (!element.hasAttribute(TITLE)) {
        element.setAttribute(TITLE, title);
      }
    }
    this._state.heldTitles = [];
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
    // A tap or a click elsewhere puts it away: on a touch screen, nothing else would.
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!event.composedPath().includes(this)) {
          this.close();
        }
      },
      { signal: following.signal }
    );
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
