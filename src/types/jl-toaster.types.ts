import type { ToastTone } from './jl-toast.types';

/** The corner or edge of the window where the toaster stacks its notifications. */
export type ToasterPlacement = 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center' | 'bottom-left';

/** What `toast()` and `JlToaster.notify()` show. */
export type ToastOptions = {
  heading?: string;
  text?: string;
  tone?: ToastTone;
  /** An icon name; the tone's icon when absent. */
  icon?: string;
  /** How long it stays, in milliseconds: 5000, or 8000 for an error or with an action; 0 keeps it until closed. */
  duration?: number;
  /** Shows a close button; on by default. */
  closable?: boolean;
  /** The text of a button in the toast, such as "Undo". */
  actionLabel?: string;
  /** Called when that button is pressed; the toast then closes. */
  onAction?: () => void;
  /** Shows a progress bar under the text, while the work it tells about runs. */
  working?: boolean;
  /** How far that work is, in percent; `null` for work of unknown length. */
  progress?: number | null;
};

/** What `toast()` returns: a way to change the notification while it shows, and to close it before its time. */
export type ToastHandle = {
  /** Changes what the toast says (its text, tone, progress, action…): the options given replace those it had. */
  update(changes: ToastOptions): void;
  dismiss(): void;
};

/** The texts a download's toast shows: `{time}`, `{received}`, `{total}`, `{name}`, `{size}` and `{error}` are filled. */
export type DownloadTexts = {
  /** While the server prepares the file: "Preparing the file… {time}". */
  preparing: string;
  /** Bytes received, of a size the server did not say: "{received} received". */
  received: string;
  /** Bytes received of the size the server said: "{received} of {total}". */
  receivedOf: string;
  /** Saved: "Saved as {name}, {size}". */
  saved: string;
  /** Failed: "Not downloaded: {error}". */
  failed: string;
  /** The action that stops it. */
  cancel: string;
};

export type DownloadOptions = {
  /** The toast's heading: what is downloaded ("METS of Letters 1902"); the file's name otherwise. */
  title?: string;
  /** The name to save under when the server gives none; the address's last segment otherwise. */
  fileName?: string;
  /** The request's options: headers, credentials… */
  init?: RequestInit;
  texts?: Partial<DownloadTexts>;
};

/** How a download ended: saved (under a name, its size in bytes), failed (why), or canceled. */
export type DownloadResult =
  | { outcome: 'saved'; name: string; size: number }
  | { outcome: 'failed'; error: string }
  | { outcome: 'canceled' };
