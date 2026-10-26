/** The colour of the confirm button: the accent for a normal decision, danger for what destroys data. */
export type ConfirmTone = 'accent' | 'danger';

/** What `confirmDialog()` asks. */
export type ConfirmOptions = {
  heading: string;
  text?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

/** What `guardLeave()` watches, and what it asks, in the app's words. */
export type LeaveGuardOptions = {
  /** Whether leaving now would lose changes. */
  isDirty: () => boolean;
  /** Ends the guard, such as the killSignal of the page it guards. */
  signal: AbortSignal;
  /** "Leave without saving?" */
  heading?: string;
  /** "Your changes are lost." */
  text?: string;
  /** "Leave" */
  leaveLabel?: string;
  /** "Keep editing" */
  stayLabel?: string;
};
