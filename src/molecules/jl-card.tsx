import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { hasSlotted } from '../lib/slots';
import { isActivationKey, startedOnControl } from '../lib/surface';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-card.css?raw';

import type { CardPadding } from '../types/jl-card.types';

export const CARD_PADDINGS: readonly CardPadding[] = ['md', 'none', 'sm', 'lg'];

// What a link card is called by screen readers when it has no heading to name it.
const DEFAULT_LINK_NAME = 'Open';

/**
 * A flat surface that groups one subject: a heading and a description, the content, and optional media on top,
 * actions in the header and a footer. With `href` the whole card is a link; with `interactive` it fires `press`.
 */
export class JlCard extends JlElement {
  static readonly selector = 'jl-card';

  readonly events = this.useEvents<{ press: undefined }>();

  readonly heading = this.useChange(
    '',
    (value) => {
      this._refs.heading.textContent = value;
      this._refs.heading.hidden = value === '';
      this._refs.linkName.textContent = value || DEFAULT_LINK_NAME;
      this.renderSections();
    },
    { attribute: 'heading' }
  );
  readonly description = this.useChange(
    '',
    (value) => {
      this._refs.description.textContent = value;
      this._refs.description.hidden = value === '';
      this.renderSections();
    },
    { attribute: 'description' }
  );
  /** The room around the content; `none` leaves the body edge to edge, for a list or a table. */
  readonly padding = this.useChange<CardPadding>('md', (value) => this.reflect('padding', value), {
    attribute: 'padding',
    parse: oneOf(CARD_PADDINGS, 'md'),
  });
  /** Can be focused and pressed as a whole: its border turns blue under the pointer, and it fires `press`. */
  readonly interactive = this.useChange(false, () => this.renderInteraction(), { attribute: 'interactive' });
  /** Makes the whole card a link, named by its heading. Actions and the footer stay pressable on their own. */
  readonly href = this.useChange('', () => this.renderInteraction(), { attribute: 'href' });

  private readonly _refs = this.useRefs((ref) => ({
    actions: ref('.actions'),
    actionsSlot: ref<HTMLSlotElement>('slot[name="actions"]'),
    body: ref('.body'),
    bodySlot: ref<HTMLSlotElement>('slot:not([name])'),
    card: ref('.card'),
    description: ref('.description'),
    footer: ref('footer'),
    footerSlot: ref<HTMLSlotElement>('slot[name="footer"]'),
    header: ref('header'),
    heading: ref('h3'),
    link: ref<HTMLAnchorElement>('.link'),
    linkName: ref('.link-name'),
    media: ref('.media'),
    mediaSlot: ref<HTMLSlotElement>('slot[name="media"]'),
  }));

  override focus(options?: FocusOptions): void {
    const target = this.href.get() === '' ? this._refs.card : this._refs.link;
    target.focus(options);
  }

  templateHtml(): Node {
    return (
      <article class="card" attrs={{ part: 'base' }}>
        {/* biome-ignore lint/a11y/useValidAnchor: the href is an input, set when the page gives one */}
        <a class="link" aria-describedby="description" hidden>
          <span class="link-name sr-only" />
        </a>
        <div class="media" hidden>
          <slot name="media" />
        </div>
        <header hidden>
          <div class="titles">
            {/* biome-ignore lint/a11y/useHeadingContent: the heading is an input, written when it is set */}
            <h3 id="heading" hidden />
            <p class="description" id="description" hidden />
          </div>
          <div class="actions">
            <slot name="actions" />
          </div>
        </header>
        <div class="body" hidden>
          <slot />
        </div>
        <footer hidden>
          <slot name="footer" />
        </footer>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const card = this._refs.card;
    // The first slotchange can come before onConnect: draw the sections now, then follow the changes.
    this.renderSections();
    const refs = this._refs;
    for (const slot of [refs.mediaSlot, refs.actionsSlot, refs.bodySlot, refs.footerSlot]) {
      this.on(slot, 'slotchange', () => this.renderSections());
    }
    this.on(card, 'click', (event) => {
      if (this.pressable() && !startedOnControl(event, card)) {
        this.events.emit('press');
      }
    });
    this.on(card, 'keydown', (event) => {
      if (this.pressable() && event.composedPath()[0] === card && isActivationKey(event)) {
        event.preventDefault();
        this.events.emit('press');
      }
    });
  }

  /** An interactive card without a link fires `press`; a link card leaves the press to the link. */
  private pressable(): boolean {
    return this.interactive.get() && this.href.get() === '';
  }

  private renderInteraction(): void {
    const href = this.href.get();
    const card = this._refs.card;
    const link = this._refs.link;
    const pressable = this.pressable();
    setOrRemove(link, 'href', href);
    link.hidden = href === '';
    this.reflect('clickable', this.interactive.get() || href !== '');
    this.reflect('linked', href !== '');
    if (!pressable) {
      card.removeAttribute('tabindex');
      card.removeAttribute('role');
      card.removeAttribute('aria-labelledby');
      return;
    }
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-labelledby', 'heading');
  }

  /** Shows only the parts that have something in them, so an empty one leaves no gap. */
  private renderSections(): void {
    const refs = this._refs;
    const hasActions = hasSlotted(refs.actionsSlot);
    const hasTitles = this.heading.get() !== '' || this.description.get() !== '';
    const hasBody = hasSlotted(refs.bodySlot);
    refs.header.hidden = !(hasTitles || hasActions);
    refs.actions.hidden = !hasActions;
    refs.media.hidden = !hasSlotted(refs.mediaSlot);
    refs.body.hidden = !hasBody;
    refs.footer.hidden = !hasSlotted(refs.footerSlot);
    this.reflect('has-header', hasTitles);
    this.reflect('floating-actions', hasActions && !hasTitles);
    this.reflect('has-body', hasBody);
  }
}

JlCard.register();
