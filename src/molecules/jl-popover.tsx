import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { followAnchor, PLACEMENTS } from '../lib/floating';
import { firstFocusable, setTriggerAria } from '../lib/trigger';
import { BASE_STYLES, FLOATING_STYLES } from '../styles/shared';
import styles from './jl-popover.css?raw';

import type { Placement } from '../types/floating.types';

const CLOSED = 'closed';

/**
 * A panel of content that opens by its trigger (`slot="trigger"`) on a click, over the page: a small form, a few
 * settings, details. A click outside or Escape closes it; the focus moves into it when it opens and back to the
 * trigger when Escape closes it.
 */
export class JlPopover extends JlElement {
  static readonly selector = 'jl-popover';

  readonly events = this.useEvents<{ open: undefined; close: undefined }>();

  /** Where the panel goes; it flips to the other side when there is no room. */
  readonly placement = this.useChange<Placement>('bottom-start', () => this.follow(), {
    attribute: 'placement',
    parse: oneOf(PLACEMENTS, 'bottom-start'),
  });
  readonly open = this.useChange(false, (value) => this.renderOpen(value), { attribute: 'open' });
  /** A title over the content; it also names the panel for screen readers. */
  readonly heading = this.useChange('', () => this.renderHeading(), { attribute: 'heading' });

  private readonly _state = {
    following: new AbortController(),
    // Whether the panel was open when the pointer went down on the trigger: the click outside closes it then.
    openAtPointerDown: false,
  };

  private readonly _refs = this.useRefs((ref) => ({
    content: ref<HTMLSlotElement>('slot:not([name])'),
    header: ref('header'),
    heading: ref('h2'),
    panel: ref('.panel'),
    trigger: ref<HTMLSlotElement>('slot[name="trigger"]'),
  }));

  show(): void {
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }

  toggle(): void {
    this.open.set((open) => !open);
  }

  templateHtml(): Node {
    return (
      <>
        <slot name="trigger" />
        <div class="floating panel" popover="auto" role="dialog" tabIndex={-1} attrs={{ part: 'base' }}>
          <header hidden>
            {/* biome-ignore lint/a11y/useHeadingContent: the heading is an input, written when it is set */}
            <h2 id="heading" />
          </header>
          <div class="body">
            <slot />
          </div>
        </div>
      </>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${FLOATING_STYLES}${styles}`;
  }

  onConnect(): void {
    const panel = this._refs.panel;
    const trigger = this._refs.trigger;
    this.renderTrigger();
    this.on(trigger, 'slotchange', () => this.renderTrigger());
    this.on(trigger, 'pointerdown', () => {
      this._state.openAtPointerDown = this.isOpen();
    });
    this.on(trigger, 'click', () => {
      const closedByPointer = this._state.openAtPointerDown;
      this._state.openAtPointerDown = false;
      if (!closedByPointer) {
        this.toggle();
      }
    });
    this.on(panel, 'beforetoggle', (event) => {
      if ((event as ToggleEvent).newState === CLOSED && this.focusIsInside()) {
        this.triggerElement()?.focus();
      }
    });
    this.on(panel, 'toggle', (event) => this.onToggle((event as ToggleEvent).newState !== CLOSED));
  }

  onDisconnect(): void {
    this._state.following.abort();
  }

  private triggerElement(): HTMLElement | null {
    const [element] = this._refs.trigger.assignedElements({ flatten: true });
    return element instanceof HTMLElement ? element : null;
  }

  private isOpen(): boolean {
    return this._refs.panel.matches(':popover-open');
  }

  /** Whether the focus is in the panel or its content, rather than on the trigger or elsewhere. */
  private focusIsInside(): boolean {
    const active = (this.getRootNode() as Document | ShadowRoot).activeElement;
    const trigger = this.triggerElement();
    if (active === null || trigger?.contains(active) === true) {
      return false;
    }
    return active === this || this.contains(active);
  }

  private renderOpen(open: boolean): void {
    this.reflect('open', open);
    if (!this.isConnected || open === this.isOpen()) {
      return;
    }
    if (!open) {
      this._refs.panel.hidePopover();
      return;
    }
    this._refs.panel.showPopover();
    this.follow();
    this.focusContent();
  }

  /** The panel opened or closed, by a click, by Escape or by code. */
  private onToggle(open: boolean): void {
    this.renderTrigger();
    if (open !== this.open.get()) {
      this.open.set(open);
    }
    if (!open) {
      this._state.following.abort();
    }
    this.events.emit(open ? 'open' : 'close');
  }

  /** Keeps the panel by the trigger while it is open. */
  private follow(): void {
    this._state.following.abort();
    const trigger = this.triggerElement();
    if (!this.isOpen() || trigger === null) {
      return;
    }
    this._state.following = new AbortController();
    followAnchor(trigger, this._refs.panel, this.placement.get(), this._state.following.signal);
  }

  private focusContent(): void {
    const target = firstFocusable(this._refs.content.assignedElements({ flatten: true }));
    (target ?? this._refs.panel).focus();
  }

  private renderTrigger(): void {
    const trigger = this.triggerElement();
    if (trigger === null) {
      return;
    }
    setTriggerAria(trigger, 'aria-haspopup', 'dialog');
    setTriggerAria(trigger, 'aria-expanded', String(this.isOpen()));
    this.renderHeading();
  }

  private renderHeading(): void {
    const heading = this.heading.get();
    const panel = this._refs.panel;
    this._refs.heading.textContent = heading;
    this._refs.header.hidden = heading === '';
    if (heading !== '') {
      panel.setAttribute('aria-labelledby', 'heading');
      return;
    }
    // Without a heading, the trigger names the panel; it lives outside this shadow root, hence the element reference.
    panel.removeAttribute('aria-labelledby');
    const trigger = this.triggerElement();
    panel.ariaLabelledByElements = trigger === null ? null : [trigger];
  }
}

JlPopover.register();
