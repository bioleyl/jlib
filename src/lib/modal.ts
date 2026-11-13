import { Bus } from '@jadis/core';

import { setOrRemove } from './dom';

// The native dialogs jlib's modals show, in the order they opened: the last one is on top.
const shown: HTMLDialogElement[] = [];

/** Emits `change` when one of jlib's modals opens or closes. */
export const modalBus = new Bus<{ change: undefined }>();

/**
 * The modal on top, when one is open. A modal makes everything outside it inert, the top layer included: what must
 * stay usable over it, as the toaster's notifications must, sits inside this element meanwhile.
 */
export const topModal = (): HTMLDialogElement | undefined => shown.at(-1);

function forget(dialog: HTMLDialogElement): void {
  const index = shown.indexOf(dialog);
  if (index !== -1) {
    shown.splice(index, 1);
  }
}

/** Says a modal shows, on top of the others: called after its `showModal()`. */
export function modalOpened(dialog: HTMLDialogElement): void {
  forget(dialog);
  shown.push(dialog);
  modalBus.emit('change');
}

/** Says a modal shows no more: it closed, or left the page. Nothing for one that was not showing. */
export function modalClosed(dialog: HTMLDialogElement): void {
  if (!shown.includes(dialog)) {
    return;
  }
  forget(dialog);
  modalBus.emit('change');
}

/**
 * Calls back for a press on a modal's backdrop: a click that started and ended on the dialog element itself, around
 * its content. A selection dragged out of a field ends its click on the dialog too, and is not a press outside.
 */
export function onBackdropPress(dialog: HTMLDialogElement, pressed: () => void, signal: AbortSignal): void {
  const press = { startedOutside: false };
  dialog.addEventListener(
    'pointerdown',
    (event) => {
      press.startedOutside = event.target === dialog;
    },
    { signal }
  );
  dialog.addEventListener(
    'click',
    (event) => {
      const outside = press.startedOutside && event.target === dialog;
      press.startedOutside = false;
      if (outside) {
        pressed();
      }
    },
    { signal }
  );
}

const CLOSED_BY = 'closedby';
const CLOSED_BY_NOTHING = 'none';

/**
 * Keeps a persistent modal open on Escape. Refusing its `cancel` event is not enough: a browser lets a page refuse
 * a close request only a few times in a row, then closes the dialog. `closedby="none"` asks for no request at all.
 */
export function setPersistent(dialog: HTMLDialogElement, persistent: boolean): void {
  setOrRemove(dialog, CLOSED_BY, persistent ? CLOSED_BY_NOTHING : '');
}
