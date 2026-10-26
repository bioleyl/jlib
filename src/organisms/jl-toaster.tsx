import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { clampedNumber, oneOf } from '../lib/attributes';
import { JlToast } from '../molecules/jl-toast';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-toaster.css?raw';

import type { ToasterPlacement, ToastHandle, ToastOptions } from '../types/jl-toaster.types';

export const TOASTER_PLACEMENTS: readonly ToasterPlacement[] = [
  'bottom-right',
  'bottom-center',
  'bottom-left',
  'top-right',
  'top-center',
];

const DEFAULT_MAX = 3;
const MAX_LIMIT = 20;
const DEFAULT_DURATION = 5000;
// Long enough to read an error, or to reach the button of an action such as Undo.
const LONG_DURATION = 8000;
const LONG_TONE = 'danger';
const DEFAULT_LABEL = 'Notifications';
const STACKED = 'data-stacked';

/** How long a toast stays when its options do not say: longer for an error, or to give time to press its action. */
const defaultDuration = (options: ToastOptions): number =>
  options.tone === LONG_TONE || (options.actionLabel ?? '') !== '' ? LONG_DURATION : DEFAULT_DURATION;
const OPEN = ':popover-open';

/**
 * The corner of the window where notifications stack, newest nearest the edge, at most `max` at a time. It lives in
 * the top layer, so it shows over open dialogs, and its live region reads new toasts to screen readers. Pages
 * usually call `toast({ heading, text, tone })`, which finds or makes the page's toaster.
 */
export class JlToaster extends JlElement {
  static readonly selector = 'jl-toaster';

  readonly placement = this.useChange<ToasterPlacement>(
    'bottom-right',
    (value) => this.reflect('placement', value),
    {
      attribute: 'placement',
      parse: oneOf(TOASTER_PLACEMENTS, 'bottom-right'),
    }
  );
  /** How many toasts show at once; older ones wait for newer ones to close. */
  readonly max = this.useChange(DEFAULT_MAX, () => this.renderStack(), {
    attribute: 'max',
    parse: clampedNumber(DEFAULT_MAX, 1, MAX_LIMIT),
  });
  /** The region's name for screen readers. */
  readonly label = this.useChange(DEFAULT_LABEL, (value) => this._refs.region.setAttribute('aria-label', value), {
    attribute: 'label',
  });

  private readonly _watched = new WeakSet<JlToast>();

  private readonly _refs = this.useRefs((ref) => ({
    region: ref('.region'),
    slot: ref('slot'),
  }));

  /**
   * Shows a notification. It stays 5 seconds unless `duration` says otherwise, 8 for an error or with an action;
   * it has a close button unless told not to.
   */
  notify(options: ToastOptions): ToastHandle {
    const toast = (
      <JlToast
        heading={options.heading}
        text={options.text}
        tone={options.tone}
        icon={options.icon}
        duration={options.duration ?? defaultDuration(options)}
        closable={options.closable ?? true}
        actionLabel={options.actionLabel}
      />
    ) as JlToast;
    const onAction = options.onAction;
    if (onAction !== undefined) {
      toast.addEventListener('action', () => onAction());
    }
    this.append(toast);
    this.whenRendered(() => this.raise());
    return { dismiss: () => toast.dismiss() };
  }

  templateHtml(): Node {
    return (
      <section
        class="region"
        popover="manual"
        aria-live="polite"
        aria-relevant="additions text"
        attrs={{ part: 'base' }}>
        <slot />
      </section>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    // The first slotchange can come before onConnect: stack what is there now, then follow the changes.
    this.renderStack();
    this.on(this._refs.slot, 'slotchange', () => this.renderStack());
  }

  onDisconnect(): void {
    const region = this._refs.region;
    if (region.matches(OPEN)) {
      region.hidePopover();
    }
  }

  private toasts(): JlToast[] {
    return [...this.children].filter((child): child is JlToast => child instanceof JlToast && !child.hidden);
  }

  /** The newest `max` toasts show; the older ones wait. A dismissed toast leaves the toaster. */
  private renderStack(): void {
    if (!this.isConnected) {
      return;
    }
    const toasts = this.toasts();
    const hiddenCount = Math.max(0, toasts.length - this.max.get());
    for (const [index, toast] of toasts.entries()) {
      toast.toggleAttribute(STACKED, index < hiddenCount);
      this.watch(toast);
    }
    this.renderOpen(toasts.length > 0);
  }

  private watch(toast: JlToast): void {
    if (this._watched.has(toast)) {
      return;
    }
    this._watched.add(toast);
    toast.addEventListener('dismiss', () => toast.remove(), { once: true });
  }

  private renderOpen(open: boolean): void {
    const region = this._refs.region;
    if (open === region.matches(OPEN)) {
      return;
    }
    if (open) {
      region.showPopover();
      return;
    }
    region.hidePopover();
  }

  /**
   * Puts the toaster back on top of the top layer, above a dialog opened since it showed. Not while a toast holds
   * the focus: hiding the region for a moment would drop it.
   */
  private raise(): void {
    const region = this._refs.region;
    if (!region.matches(OPEN)) {
      this.renderStack();
      return;
    }
    if (this.matches(':focus-within')) {
      return;
    }
    region.hidePopover();
    region.showPopover();
  }
}

JlToaster.register();

/** The page's toaster: the first one in the document, or a new one at the end of the body. */
function pageToaster(): JlToaster {
  const found = document.querySelector<JlToaster>(JlToaster.selector);
  if (found !== null) {
    return found;
  }
  const toaster = new JlToaster();
  document.body.append(toaster);
  return toaster;
}

/**
 * Shows a notification in the page's toaster, made on first use: `toast({ heading: 'Saved', tone: 'ok' })`.
 * Returns a handle to close it early.
 */
export function toast(options: ToastOptions): ToastHandle {
  return pageToaster().notify(options);
}
