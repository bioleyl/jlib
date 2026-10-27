import { css } from '@jadis/core';
import { ExternalLink } from 'lucide';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { BASE_STYLES } from '../styles/shared';
import { JlIcon } from './jl-icon';
import styles from './jl-link.css?raw';

import type { LinkVariant } from '../types/jl-link.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'external-link': ExternalLink });

export const LINK_VARIANTS: readonly LinkVariant[] = ['default', 'quiet', 'muted'];

const NEW_TAB = '_blank';
// A page opened in a new tab gets no handle on this one, and no referrer.
const SAFE_REL = 'noopener noreferrer';
const ICON_SIZE = 13;

/**
 * A link in text or in a list: the browser's own `<a>`, styled. `external` opens it in a new tab, safely, with an
 * icon that says so. Its text is the `label` or the slotted content.
 */
export class JlLink extends JlElement {
  static readonly selector = 'jl-link';

  readonly href = this.useChange('', (value) => setOrRemove(this._refs.anchor, 'href', value), {
    attribute: 'href',
  });
  readonly label = this.useChange(
    '',
    (value) => {
      this._refs.label.textContent = value;
      this._refs.label.hidden = value === '';
    },
    { attribute: 'label' }
  );
  /** Where it opens, as an `<a>`'s `target`: `_blank` for a new tab. */
  readonly target = this.useChange('', () => this.renderTarget(), { attribute: 'target' });
  /** Leads away from the app: opens in a new tab, with an icon and without sharing the page. */
  readonly external = this.useChange(false, () => this.renderTarget(), { attribute: 'external' });
  readonly variant = this.useChange<LinkVariant>('default', (value) => this.reflect('variant', value), {
    attribute: 'variant',
    parse: oneOf(LINK_VARIANTS, 'default'),
  });

  private readonly _refs = this.useRefs((ref) => ({
    anchor: ref('a'),
    icon: ref(JlIcon),
    label: ref('.label'),
    newTab: ref('.new-tab'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.anchor.focus(options);
  }

  templateHtml(): Node {
    return (
      // biome-ignore lint/a11y/useValidAnchor: the href is an input, set when the page gives one
      <a attrs={{ part: 'base' }}>
        <span class="label" hidden />
        <slot />
        <JlIcon name="external-link" size={ICON_SIZE} hidden />
        <span class="new-tab sr-only" hidden>
          (opens in a new tab)
        </span>
      </a>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private renderTarget(): void {
    const anchor = this._refs.anchor;
    const external = this.external.get();
    const target = this.target.get() || (external ? NEW_TAB : '');
    const newTab = target === NEW_TAB;
    setOrRemove(anchor, 'target', target);
    setOrRemove(anchor, 'rel', external || newTab ? SAFE_REL : '');
    this._refs.icon.hidden = !external;
    this._refs.newTab.hidden = !newTab;
  }
}

JlLink.register();
