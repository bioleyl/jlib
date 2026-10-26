import { css } from '@jadis/core';

import { JlButton } from '../atoms/jl-button';
import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { define } from '../lib/define';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-confirm.css?raw';
import { JlDialog } from './jl-dialog';

import type { ButtonVariant } from '../types/jl-button.types';
import type { ConfirmOptions, ConfirmTone, LeaveGuardOptions } from '../types/jl-confirm.types';

// The template writes <jl-dialog> as a tag, for its children: naming the class keeps it in the bundle.
define(JlDialog);

export const CONFIRM_TONES: readonly ConfirmTone[] = ['accent', 'danger'];

const CONFIRM_VARIANTS: Record<ConfirmTone, ButtonVariant> = { accent: 'primary', danger: 'danger' };
const DEFAULT_CONFIRM = 'Confirm';
const DEFAULT_CANCEL = 'Cancel';
const CLOSE = 'close';

type Resolve = (confirmed: boolean) => void;

/**
 * A yes-or-no question in a small modal dialog. `ask()` opens it and resolves `true` on confirm, `false` on cancel,
 * Escape or a click outside. Most pages call `confirmDialog({ heading, text })`, which makes one, asks, and removes
 * it. With the danger tone the confirm button is red and the focus starts on Cancel.
 */
export class JlConfirm extends JlElement {
  static readonly selector = 'jl-confirm';

  readonly events = this.useEvents<{ confirm: undefined; cancel: undefined }>();

  readonly heading = this.useChange('', (value) => this._refs.dialog.heading.set(value), { attribute: 'heading' });
  readonly text = this.useChange(
    '',
    (value) => {
      this._refs.text.textContent = value;
      this._refs.text.hidden = value === '';
    },
    { attribute: 'text' }
  );
  readonly confirmLabel = this.useChange(DEFAULT_CONFIRM, (value) => this._refs.confirm.label.set(value), {
    attribute: 'confirm-label',
  });
  readonly cancelLabel = this.useChange(DEFAULT_CANCEL, (value) => this._refs.cancel.label.set(value), {
    attribute: 'cancel-label',
  });
  readonly tone = this.useChange<ConfirmTone>(
    'accent',
    (value) => {
      this.reflect('tone', value);
      this._refs.confirm.variant.set(CONFIRM_VARIANTS[value]);
    },
    { attribute: 'tone', parse: oneOf(CONFIRM_TONES, 'accent') }
  );

  private readonly _question = { confirmed: false, pending: null as Promise<boolean> | null };

  private readonly _refs = this.useRefs((ref) => ({
    cancel: ref<JlButton>('.cancel'),
    confirm: ref<JlButton>('.confirm'),
    dialog: ref<JlDialog>('jl-dialog'),
    text: ref('.text'),
  }));

  /** Opens the question; resolves `true` when confirmed, `false` otherwise. Asking again while open waits for the same answer. */
  ask(): Promise<boolean> {
    const pending =
      this._question.pending ?? new Promise<boolean>((resolve) => this.whenRendered(() => this.openFor(resolve)));
    this._question.pending = pending;
    return pending;
  }

  templateHtml(): Node {
    return (
      <jl-dialog size="sm">
        <p class="text" hidden />
        <slot />
        <JlButton slot="actions" class="cancel" label={DEFAULT_CANCEL} />
        <JlButton slot="actions" class="confirm" variant="primary" label={DEFAULT_CONFIRM} />
      </jl-dialog>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.cancel.events.register('press', () => this._refs.dialog.close());
    this._refs.confirm.events.register('press', () => {
      this._question.confirmed = true;
      this._refs.dialog.close();
    });
  }

  /** Every way the dialog closes ends in its close event: that is where the answer is given. */
  private openFor(resolve: Resolve): void {
    const dialog = this._refs.dialog;
    this._question.confirmed = false;
    dialog.addEventListener(CLOSE, () => this.answer(resolve), { once: true });
    dialog.show();
    // On the first opening the dialog shows its footer in its own onConnect, a task later: focus after it.
    window.setTimeout(() => this.focusFirst());
  }

  /** Cancel for a dangerous question, so that a quick Enter never destroys anything; confirm otherwise. */
  private focusFirst(): void {
    if (this._question.pending === null) {
      return;
    }
    const first = this.tone.get() === 'danger' ? this._refs.cancel : this._refs.confirm;
    first.focus();
  }

  private answer(resolve: Resolve): void {
    const confirmed = this._question.confirmed;
    this._question.pending = null;
    this._question.confirmed = false;
    this.events.emit(confirmed ? 'confirm' : 'cancel');
    resolve(confirmed);
  }
}

JlConfirm.register();

/**
 * Asks a yes-or-no question in a modal dialog and resolves the answer: `true` on confirm, `false` on cancel,
 * Escape or a click outside. The dialog is removed once answered.
 *
 * ```ts
 * if (await confirmDialog({ heading: 'Delete the file?', tone: 'danger', confirmLabel: 'Delete' })) { … }
 * ```
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  const element = (
    <JlConfirm
      heading={options.heading}
      text={options.text}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      tone={options.tone}
    />
  ) as JlConfirm;
  document.body.append(element);
  return element.ask().finally(() => element.remove());
}

const LEAVE_HEADING = 'Leave without saving?';
const LEAVE_TEXT = 'Your changes are lost.';
const LEAVE_LABEL = 'Leave';
const STAY_LABEL = 'Keep editing';

/**
 * Guards a form or an editor against leaving with changes not saved. Closing or reloading the tab asks the
 * browser's own question; the function it returns asks in the page, for the app's router to call before it moves
 * on: `if (!(await canLeave())) return;`. It resolves `true` at once when nothing would be lost.
 */
export function guardLeave(options: LeaveGuardOptions): () => Promise<boolean> {
  window.addEventListener(
    'beforeunload',
    (event) => {
      if (options.isDirty()) {
        event.preventDefault();
      }
    },
    { signal: options.signal }
  );
  return async () =>
    !options.isDirty()
    || confirmDialog({
      cancelLabel: options.stayLabel ?? STAY_LABEL,
      confirmLabel: options.leaveLabel ?? LEAVE_LABEL,
      heading: options.heading ?? LEAVE_HEADING,
      text: options.text ?? LEAVE_TEXT,
      tone: 'danger',
    });
}
