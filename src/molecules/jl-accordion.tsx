import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { define } from '../lib/define';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-accordion.css?raw';
import { JlAccordionItem } from './jl-accordion-item';

import type { AccordionVariant } from '../types/jl-accordion.types';

export const ACCORDION_VARIANTS: readonly AccordionVariant[] = ['plain', 'bordered'];

define(JlAccordionItem);

const TOGGLE = 'toggle';

/**
 * A list of `jl-accordion-item`s. One item opens at a time (opening one closes the others) unless `multiple` is
 * set. `bordered` puts the items in a box with lines between them.
 */
export class JlAccordion extends JlElement {
  static readonly selector = 'jl-accordion';

  /** Lets several items stay open together. */
  readonly multiple = this.useChange(false, () => this.keepOneOpen(), { attribute: 'multiple' });
  readonly variant = this.useChange<AccordionVariant>('plain', (value) => this.reflect('variant', value), {
    attribute: 'variant',
    parse: oneOf(ACCORDION_VARIANTS, 'plain'),
  });

  templateHtml(): Node {
    return (
      <div class="accordion" attrs={{ part: 'base' }}>
        <slot />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.keepOneOpen();
    // The items' toggle does not bubble, but it passes here on its way down: listen in the capture phase.
    this.addEventListener(TOGGLE, (event) => this.onToggle(event), { capture: true, signal: this.killSignal });
  }

  private items(): JlAccordionItem[] {
    return [...this.children].filter((child): child is JlAccordionItem => child instanceof JlAccordionItem);
  }

  private onToggle(event: Event): void {
    const item = event.target;
    const opened = (event as CustomEvent<boolean>).detail === true;
    if (!(item instanceof JlAccordionItem) || item.parentElement !== this || !opened || this.multiple.get()) {
      return;
    }
    this.closeAllBut(item);
  }

  /** Without `multiple`, only the first open item stays open. */
  private keepOneOpen(): void {
    const firstOpen = this.items().find((item) => item.open.get());
    if (firstOpen !== undefined && !this.multiple.get()) {
      this.closeAllBut(firstOpen);
    }
  }

  private closeAllBut(kept: JlAccordionItem): void {
    for (const item of this.items()) {
      if (item !== kept && item.open.get()) {
        item.open.set(false);
      }
    }
  }
}

JlAccordion.register();
