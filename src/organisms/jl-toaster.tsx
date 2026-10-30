import { css } from '@jadis/core';
import { Download } from 'lucide';

import { JlElement } from '../base/jl-element';
import { clampedNumber, oneOf } from '../lib/attributes';
import { answerError, dispositionFileName, readWithProgress, saveBlob, urlFileName } from '../lib/download';
import { formatFileSize } from '../lib/files';
import { registerIcons } from '../lib/icons';
import { fillText } from '../lib/text';
import { jlTemplate, jlText } from '../lib/texts';
import { formatDuration } from '../lib/time';
import { JlToast } from '../molecules/jl-toast';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-toaster.css?raw';

import type {
  DownloadOptions,
  DownloadResult,
  DownloadTexts,
  ToasterPlacement,
  ToastHandle,
  ToastOptions,
} from '../types/jl-toaster.types';

// The icon it draws itself: a page registers only the names it writes.
registerIcons({ download: Download });

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
const STACKED = 'data-stacked';

/** How long a toast stays when its options do not say: longer for an error, or to give time to press its action. */
const defaultDuration = (options: ToastOptions): number =>
  options.tone === LONG_TONE || (options.actionLabel ?? '') !== '' ? LONG_DURATION : DEFAULT_DURATION;
const OPEN = ':popover-open';

/** The inputs of a toast that an update may change, each set when the update gives it. */
const TOAST_SETTERS: { [Key in keyof ToastOptions]: (toast: JlToast, value: ToastOptions[Key]) => void } = {
  actionLabel: (toast, value) => toast.actionLabel.set(value ?? ''),
  closable: (toast, value) => toast.closable.set(value ?? false),
  duration: (toast, value) => toast.duration.set(value ?? 0),
  heading: (toast, value) => toast.heading.set(value ?? ''),
  icon: (toast, value) => toast.icon.set(value ?? ''),
  onAction: () => undefined,
  progress: (toast, value) => toast.progress.set(value ?? null),
  text: (toast, value) => toast.text.set(value ?? ''),
  tone: (toast, value) => toast.tone.set(value ?? 'neutral'),
  working: (toast, value) => toast.working.set(value ?? false),
};

function updateToast(toast: JlToast, changes: ToastOptions): void {
  for (const key of Object.keys(changes) as (keyof ToastOptions)[]) {
    (TOAST_SETTERS[key] as (target: JlToast, value: unknown) => void)(toast, changes[key]);
  }
}

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
  readonly label = this.useChange('', () => this.drawTexts(), { attribute: 'label' });

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
        working={options.working}
        progress={options.progress}
      />
    ) as JlToast;
    // The action may change while the toast shows (a download's Cancel, gone once it is saved).
    const actions = { onAction: options.onAction };
    toast.addEventListener('action', () => actions.onAction?.());
    this.append(toast);
    this.whenRendered(() => this.raise());
    return {
      dismiss: () => toast.dismiss(),
      update: (changes) => {
        if ('onAction' in changes) {
          actions.onAction = changes.onAction;
        }
        updateToast(toast, changes);
      },
    };
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

  protected drawTexts(): void {
    this._refs.region.setAttribute('aria-label', this.label.get() || jlText('notifications'));
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

// A download's toast: its progress while the file comes, then where it was saved for a while, or why it failed.
const DOWNLOAD_ICON = 'download';
const SAVED_VISIBLE_MS = 6000;
const PREPARING_TICK_MS = 1000;
const PROGRESS_INTERVAL_MS = 250;
const PERCENT = 100;
const FALLBACK_NAME = 'download';
const CONTENT_LENGTH = 'content-length';
const CONTENT_DISPOSITION = 'content-disposition';

/** A download's texts, in jlib's language, their placeholders left to fill: what `download()` says unless told otherwise. */
export const downloadTexts = (): DownloadTexts => ({
  cancel: jlText('downloadCancel'),
  failed: jlTemplate('downloadFailed'),
  preparing: jlTemplate('downloadPreparing'),
  received: jlTemplate('downloadReceived'),
  receivedOf: jlTemplate('downloadReceivedOf'),
  saved: jlTemplate('downloadSaved'),
});

/** The toast's text and bar for the bytes received: a share of the size when the server said it. */
function receiving(received: number, total: number, texts: DownloadTexts): ToastOptions {
  const size = formatFileSize(received);
  if (total <= 0) {
    return { progress: null, text: fillText(texts.received, { received: size }) };
  }
  return {
    progress: Math.min(PERCENT, (received / total) * PERCENT),
    text: fillText(texts.receivedOf, { received: size, total: formatFileSize(total) }),
  };
}

async function failureOf(response: Response): Promise<Error> {
  const body: unknown = await response.json().catch(() => null);
  return new Error(answerError(body, response.status));
}

/**
 * Downloads a file with its progress in a toast of the page's toaster: the time the server takes to prepare it,
 * the bytes received (a bar when it says the size), then the name it was saved under, or why it failed. Its
 * Cancel stops it. Call it from a download link's click, leaving a modified click (a new tab) to the browser.
 */
export async function download(url: string, options: DownloadOptions = {}): Promise<DownloadResult> {
  const texts = { ...downloadTexts(), ...options.texts };
  const controller = new AbortController();
  const started = performance.now();
  const preparingText = (): string =>
    fillText(texts.preparing, { time: formatDuration(performance.now() - started) });
  const handle = toast({
    actionLabel: texts.cancel,
    closable: false,
    duration: 0,
    heading: options.title ?? urlFileName(url, FALLBACK_NAME),
    icon: DOWNLOAD_ICON,
    onAction: () => controller.abort(),
    progress: null,
    text: preparingText(),
    working: true,
  });
  const preparing = window.setInterval(() => handle.update({ text: preparingText() }), PREPARING_TICK_MS);
  try {
    const response = await fetch(url, { ...options.init, signal: controller.signal });
    window.clearInterval(preparing);
    if (!response.ok) {
      throw await failureOf(response);
    }
    const total = Number(response.headers.get(CONTENT_LENGTH)) || 0;
    const blob = await readWithProgress(
      response,
      (received) => handle.update(receiving(received, total, texts)),
      PROGRESS_INTERVAL_MS
    );
    const name =
      dispositionFileName(response.headers.get(CONTENT_DISPOSITION))
      ?? options.fileName
      ?? urlFileName(url, FALLBACK_NAME);
    saveBlob(blob, name);
    handle.update({
      actionLabel: '',
      closable: true,
      duration: SAVED_VISIBLE_MS,
      icon: '',
      text: fillText(texts.saved, { name, size: formatFileSize(blob.size) }),
      tone: 'ok',
      working: false,
    });
    return { name, outcome: 'saved', size: blob.size };
  } catch (error) {
    window.clearInterval(preparing);
    if (controller.signal.aborted) {
      handle.dismiss();
      return { outcome: 'canceled' };
    }
    const message = error instanceof Error ? error.message : String(error);
    handle.update({
      actionLabel: '',
      closable: true,
      icon: '',
      text: fillText(texts.failed, { error: message }),
      tone: 'danger',
      working: false,
    });
    return { error: message, outcome: 'failed' };
  }
}
