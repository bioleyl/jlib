import { css } from '@jadis/core';
import { X } from 'lucide';

import { JlButton } from '../atoms/jl-button';
import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-drawer.css?raw';

import type { DrawerPlacement, DrawerSize } from '../types/jl-drawer.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ x: X });

export const DRAWER_PLACEMENTS: readonly DrawerPlacement[] = ['right', 'left', 'bottom'];
export const DRAWER_SIZES: readonly DrawerSize[] = ['md', 'sm', 'lg'];

/**
 * A panel that slides over the page from an edge, on the browser's own modal `<dialog>`: focus stays inside, Escape
 * and the backdrop close it. From the bottom it has rounded top corners and a handle, as sheets have on phones.
 * The content goes in the default slot, header buttons in `slot="actions"`, the buttons at the bottom in
 * `slot="footer"`.
 */
export class JlDrawer extends JlElement {
  static readonly selector = 'jl-drawer';

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
  readonly placement = this.useChange<DrawerPlacement>('right', (value) => this.reflect('placement', value), {
    attribute: 'placement',
    parse: oneOf(DRAWER_PLACEMENTS, 'right'),
  });
  readonly size = this.useChange<DrawerSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(DRAWER_SIZES, 'md'),
  });
  readonly open = this.useChange(false, (value) => this.renderOpen(value), { attribute: 'open' });
  /** Keeps the drawer open on Escape and on a click outside: only its own buttons close it. */
  readonly persistent = this.useChange(
    false,
    (value) => {
      this._refs.close.hidden = value;
    },
    { attribute: 'persistent' }
  );

  private readonly _refs = this.useRefs((ref) => ({
    close: ref<JlButton>('.close'),
    description: ref('.description'),
    dialog: ref('dialog'),
    footer: ref('footer'),
    footerSlot: ref<HTMLSlotElement>('slot[name="footer"]'),
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
      <dialog attrs={{ part: 'base' }} aria-labelledby="heading" aria-describedby="description">
        <span class="handle" aria-hidden="true" />
        <header>
          <div class="titles">
            {/* biome-ignore lint/a11y/useHeadingContent: the heading is an input, written when it is set */}
            <h2 id="heading" />
            <p class="description" id="description" hidden />
          </div>
          <div class="actions">
            <slot name="actions" />
            <JlButton class="close" variant="ghost" icon="x" size="sm" />
          </div>
        </header>
        <div class="body">
          <slot />
        </div>
        <footer hidden>
          <slot name="footer" />
        </footer>
      </dialog>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  protected drawTexts(): void {
    this._refs.close.hint.set(jlText('close'));
  }

  onConnect(): void {
    const dialog = this._refs.dialog;
    this._refs.close.events.register('press', () => this.close());
    this.on(dialog, 'close', () => {
      this.reflect('open', false);
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
    this.on(this._refs.footerSlot, 'slotchange', () => this.renderFooter());
    this.renderOpen(this.open.get());
  }

  private renderFooter(): void {
    this._refs.footer.hidden = this._refs.footerSlot.assignedElements().length === 0;
  }

  private renderOpen(open: boolean): void {
    const dialog = this._refs.dialog;
    if (open === dialog.open || !this.isConnected) {
      return;
    }
    if (open) {
      dialog.showModal();
      this.reflect('open', true);
      this.events.emit('open');
      return;
    }
    // The attribute follows at once: set back later, by the dialog's close event, it would reopen the drawer.
    this.reflect('open', false);
    dialog.close();
  }
}

JlDrawer.register();
