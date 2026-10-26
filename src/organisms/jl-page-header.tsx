import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { hasSlotted } from '../lib/slots';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-page-header.css?raw';

/**
 * The top of a page: its heading and what it is for, a breadcrumb above, the page's actions beside the heading
 * (under it on a phone) and a row of badges under the description. `divided` draws a line under it all.
 */
export class JlPageHeader extends JlElement {
  static readonly selector = 'jl-page-header';

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
  /** Draws a line under the header, between it and the page's content. */
  readonly divided = this.useChange(false, (value) => this.reflect('divided', value), { attribute: 'divided' });

  private readonly _refs = this.useRefs((ref) => ({
    actions: ref('.actions'),
    actionsSlot: ref<HTMLSlotElement>('slot[name="actions"]'),
    breadcrumb: ref('.breadcrumb'),
    breadcrumbSlot: ref<HTMLSlotElement>('slot[name="breadcrumb"]'),
    description: ref('.description'),
    heading: ref('h1'),
    meta: ref('.meta'),
    metaSlot: ref<HTMLSlotElement>('slot[name="meta"]'),
  }));

  templateHtml(): Node {
    return (
      <header class="page-header" attrs={{ part: 'base' }}>
        <div class="breadcrumb" hidden>
          <slot name="breadcrumb" />
        </div>
        <div class="main">
          <div class="titles">
            {/* biome-ignore lint/a11y/useHeadingContent: the heading is an input, written when it is set */}
            <h1 />
            <p class="description" hidden />
          </div>
          <div class="actions" hidden>
            <slot name="actions" />
          </div>
        </div>
        <div class="meta" hidden>
          <slot name="meta" />
        </div>
      </header>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const refs = this._refs;
    // The first slotchange can come before onConnect: draw the slots now, then follow the changes.
    this.renderSlots();
    for (const slot of [refs.breadcrumbSlot, refs.actionsSlot, refs.metaSlot]) {
      this.on(slot, 'slotchange', () => this.renderSlots());
    }
  }

  private renderSlots(): void {
    const refs = this._refs;
    refs.breadcrumb.hidden = !hasSlotted(refs.breadcrumbSlot);
    refs.actions.hidden = !hasSlotted(refs.actionsSlot);
    refs.meta.hidden = !hasSlotted(refs.metaSlot);
  }
}

JlPageHeader.register();
