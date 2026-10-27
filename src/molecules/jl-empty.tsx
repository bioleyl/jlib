import { css } from '@jadis/core';
import { Inbox } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { hasSlotted } from '../lib/slots';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-empty.css?raw';

import type { EmptySize } from '../types/jl-empty.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ inbox: Inbox });

export const EMPTY_SIZES: readonly EmptySize[] = ['md', 'sm'];

const DEFAULT_ICON = 'inbox';
// `icon="none"` shows no icon.
const NO_ICON = 'none';
const ICON_SIZES: Record<EmptySize, number> = { md: 22, sm: 18 };

/**
 * What a list, a table or a page shows when it has nothing yet: an icon, a heading, a sentence that says what to
 * do, and the buttons to do it in the default slot.
 */
export class JlEmpty extends JlElement {
  static readonly selector = 'jl-empty';

  readonly icon = this.useChange(DEFAULT_ICON, () => this.renderIcon(), { attribute: 'icon' });
  readonly heading = this.useChange(
    '',
    (value) => {
      this._refs.heading.textContent = value;
      this._refs.heading.hidden = value === '';
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
  readonly size = this.useChange<EmptySize>(
    'md',
    (value) => {
      this.reflect('size', value);
      this.renderIcon();
    },
    { attribute: 'size', parse: oneOf(EMPTY_SIZES, 'md') }
  );

  private readonly _refs = this.useRefs((ref) => ({
    actions: ref('.actions'),
    description: ref('.description'),
    heading: ref('.heading'),
    icon: ref(JlIcon),
    medallion: ref('.medallion'),
    slot: ref('slot'),
  }));

  templateHtml(): Node {
    return (
      <div class="empty" attrs={{ part: 'base' }}>
        <span class="medallion">
          <JlIcon />
        </span>
        <p class="heading" hidden />
        <p class="description" hidden />
        <div class="actions" hidden>
          <slot />
        </div>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    // The first slotchange can come before onConnect: draw the actions now, then follow the changes.
    this.renderActions();
    this.on(this._refs.slot, 'slotchange', () => this.renderActions());
  }

  private renderActions(): void {
    this._refs.actions.hidden = !hasSlotted(this._refs.slot);
  }

  private renderIcon(): void {
    const name = this.icon.get();
    const hidden = name === '' || name === NO_ICON;
    this._refs.icon.name.set(hidden ? '' : name);
    this._refs.icon.size.set(ICON_SIZES[this.size.get()]);
    this._refs.medallion.hidden = hidden;
  }
}

JlEmpty.register();
