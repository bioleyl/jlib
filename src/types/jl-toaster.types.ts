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
  /** How long it stays, in milliseconds; 0 keeps it until closed. */
  duration?: number;
  /** Shows a close button; on by default. */
  closable?: boolean;
  /** The text of a button in the toast, such as "Undo". */
  actionLabel?: string;
  /** Called when that button is pressed; the toast then closes. */
  onAction?: () => void;
};

/** What `toast()` returns: a way to close the notification before its time. */
export type ToastHandle = {
  dismiss(): void;
};
