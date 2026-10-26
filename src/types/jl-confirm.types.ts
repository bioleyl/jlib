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
