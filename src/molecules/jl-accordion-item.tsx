import { css } from '@jadis/core';
import { ChevronDown } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { registerIcons } from '../lib/icons';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-accordion-item.css?raw';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'chevron-down': ChevronDown });

const ICON_SIZE = 16;

/**
 * A section that opens and closes under its heading, on the browser's own `<details>`. Alone it is a disclosure;
 * in a `jl-accordion` it is one of a list. `toggle` fires with the new state.
 */
export class JlAccordionItem extends JlElement {
  static readonly selector = 'jl-accordion-item';

  readonly events = this.useEvents<{ toggle: boolean }>();

  readonly heading = this.useChange(
    '',
    (value) => {
      this._refs.heading.textContent = value;
    },
    { attribute: 'heading' }
  );
  readonly open = this.useChange(false, (value) => this.renderOpen(value), { attribute: 'open' });
  /** An icon before the heading. */
  readonly icon = this.useChange(
    '',
    (name) => {
      this._refs.icon.name.set(name);
      this._refs.icon.hidden = name === '';
    },
    { attribute: 'icon' }
  );
  /** Cannot be opened or closed by people. */
  readonly disabled = this.useChange(
    false,
    (value) => {
      this.reflect('disabled', value);
      this._refs.summary.toggleAttribute('aria-disabled', value);
      this._refs.summary.tabIndex = value ? -1 : 0;
    },
    { attribute: 'disabled' }
  );

  private readonly _refs = this.useRefs((ref) => ({
    details: ref('details'),
    heading: ref('.heading'),
    icon: ref<JlIcon>('.icon'),
    summary: ref('summary'),
  }));

  templateHtml(): Node {
    return (
      <details attrs={{ part: 'base' }}>
        <summary>
          <JlIcon class="icon" size={ICON_SIZE} hidden />
          <span class="heading" />
          <JlIcon class="chevron" name="chevron-down" size={ICON_SIZE} />
        </summary>
        <div class="content">
          <slot />
        </div>
      </details>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const details = this._refs.details;
    this.on(this._refs.summary, 'click', (event) => {
      if (this.disabled.get()) {
        event.preventDefault();
      }
    });
    // The native event stays in the shadow root; the item says it again with the new state.
    this.on(details, 'toggle', (event) => {
      const { oldState, newState } = event as ToggleEvent;
      if (oldState === newState) {
        return;
      }
      if (details.open !== this.open.get()) {
        this.open.set(details.open);
      }
      this.events.emit('toggle', details.open);
    });
  }

  private renderOpen(open: boolean): void {
    this.reflect('open', open);
    this._refs.details.open = open;
  }
}

JlAccordionItem.register();
