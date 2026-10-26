import { css } from '@jadis/core';
import { X } from 'lucide';

import { JlButton } from '../atoms/jl-button';
import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-dialog.css?raw';

import type { DialogSize } from '../types/jl-dialog.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ x: X });

export const DIALOG_SIZES: readonly DialogSize[] = ['md', 'sm', 'lg', 'full'];

/**
 * A modal window over the page, on the browser's own `<dialog>`: focus stays inside, Escape closes it. The
 * content goes in the default slot, the buttons in `slot="actions"`. Open it with `open` or `show()`.
 */
export class JlDialog extends JlElement {
  static readonly selector = 'jl-dialog';

  readonly events = this.useEvents<{ open: undefined; close: undefined }>();

  readonly heading = this.useChange(
    '',
    (value) => {
      this._refs.heading.textContent = value;
    },
    { attribute: 'heading' }
  );
  readonly description = this.useChange(
    '',
    (value) => {
      this._refs.description.textContent = value;
      this._refs.description.hidden = value === '';
    },
    { attribute: 'description' }
  );
  readonly size = this.useChange<DialogSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(DIALOG_SIZES, 'md'),
  });
  readonly open = this.useChange(false, (value) => this.renderOpen(value), { attribute: 'open' });
  /** Keeps the dialog open on Escape and on a click outside: only its own buttons close it. */
  readonly persistent = this.useChange(
    false,
    (value) => {
      this._refs.close.hidden = value;
    },
    { attribute: 'persistent' }
  );

  private readonly _refs = this.useRefs((ref) => ({
    actions: ref<HTMLSlotElement>('slot[name="actions"]'),
    close: ref<JlButton>('.close'),
    description: ref('.description'),
    dialog: ref('dialog'),
    footer: ref('footer'),
    heading: ref('h2'),
  }));

  show(): void {
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }

  templateHtml(): Node {
    return (
      <dialog attrs={{ part: 'base' }} aria-labelledby="heading">
        <header>
          <div class="titles">
            {/* biome-ignore lint/a11y/useHeadingContent: the heading is an input, written when it is set */}
            <h2 id="heading" />
            <p class="description" hidden />
          </div>
          <JlButton class="close" variant="ghost" icon="x" hint="Close" size="sm" />
        </header>
        <div class="body">
          <slot />
        </div>
        <footer hidden>
          <slot name="actions" />
        </footer>
      </dialog>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const dialog = this._refs.dialog;
    this._refs.close.events.register('press', () => this.close());
    this.on(dialog, 'close', () => {
      this.open.set(false);
      this.events.emit('close');
    });
    this.on(dialog, 'cancel', (event) => {
      if (this.persistent.get()) {
        event.preventDefault();
      }
    });
    this.on(dialog, 'click', (event) => {
      if (event.target === dialog && !this.persistent.get()) {
        this.close();
      }
    });
    // The first slotchange can come before onConnect: draw the footer now, then follow the changes.
    this.renderFooter();
    this.on(this._refs.actions, 'slotchange', () => this.renderFooter());
  }

  private renderFooter(): void {
    this._refs.footer.hidden = this._refs.actions.assignedElements().length === 0;
  }

  private renderOpen(open: boolean): void {
    const dialog = this._refs.dialog;
    // Now, not later: a stale attribute replayed by the observer would open the dialog again after a close.
    this.reflect('open', open);
    if (open === dialog.open || !this.isConnected) {
      return;
    }
    if (open) {
      this.renderFooter();
      dialog.showModal();
      this.events.emit('open');
      return;
    }
    dialog.close();
  }
}

JlDialog.register();
