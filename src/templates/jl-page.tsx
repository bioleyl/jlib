import { css } from '@jadis/core';
import { ArrowLeft } from 'lucide';

import { JlButton } from '../atoms/jl-button';
import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { define } from '../lib/define';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { JlPageHeader } from '../organisms/jl-page-header';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-page.css?raw';

import type { PageWidth } from '../types/jl-page.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'arrow-left': ArrowLeft });

// The template writes <jl-page-header> as a tag, for the slots it passes on: naming the class keeps it in the bundle.
define(JlPageHeader);

export const PAGE_WIDTHS: readonly PageWidth[] = ['standard', 'form', 'wide', 'full'];

const BREADCRUMB_SLOT = 'breadcrumb';
const DEFAULT_BACK_LABEL = 'Back';
const TITLE_SEPARATOR = ' · ';

/**
 * A page of an app: its header (a back link named after the page it leads to, the heading, a sentence on what the
 * page is for or the facts that identify its subject, the status, the actions), then the content, centred at one of
 * four widths. With `app-name`, it also names the browser tab after its heading: "Order #3 · swstock".
 */
export class JlPage extends JlElement {
  static readonly selector = 'jl-page';

  readonly events = this.useEvents<{ back: undefined }>();

  readonly heading = this.useChange(
    '',
    (value) => {
      this._refs.header.heading.set(value);
      this.renderTitle();
    },
    { attribute: 'heading' }
  );
  readonly description = this.useChange('', (value) => this._refs.header.description.set(value), {
    attribute: 'description',
  });
  /** `form` for one column of fields, `standard` for most pages, `wide` for tables and grids, `full` for the rest. */
  readonly width = this.useChange<PageWidth>('standard', (value) => this.reflect('width', value), {
    attribute: 'width',
    parse: oneOf(PAGE_WIDTHS, 'standard'),
  });
  /** Where the back link leads; no back link without it. */
  readonly back = this.useChange('', () => this.renderBack(), { attribute: 'back' });
  /** The name of the page the back link leads to: "Orders". */
  readonly backLabel = this.useChange('', () => this.renderBack(), { attribute: 'back-label' });
  /** The app's name, after the heading in the browser tab. Without it, the page leaves the tab's title alone. */
  readonly appName = this.useChange('', () => this.renderTitle(), { attribute: 'app-name' });

  private readonly _refs = this.useRefs((ref) => ({
    back: ref<JlButton>('.back'),
    header: ref(JlPageHeader),
  }));

  templateHtml(): Node {
    return (
      <div class="page" attrs={{ part: 'base' }}>
        <jl-page-header>
          <JlButton class="back" variant="ghost" size="sm" icon="arrow-left" />
          <slot name="breadcrumb" slot="breadcrumb" />
          <slot name="actions" slot="actions" />
          <slot name="meta" slot="meta" />
        </jl-page-header>
        <slot />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.renderTitle();
    this._refs.back.events.register('press', () => this.events.emit('back'));
  }

  /** The back link stays out of the header's breadcrumb slot without an address, so the header takes no room for it. */
  private renderBack(): void {
    const back = this._refs.back;
    const href = this.back.get();
    back.href.set(href);
    back.label.set(this.backLabel.get() || DEFAULT_BACK_LABEL);
    setOrRemove(back, 'slot', href === '' ? '' : BREADCRUMB_SLOT);
  }

  private renderTitle(): void {
    const app = this.appName.get();
    if (app === '' || !this.isConnected) {
      return;
    }
    const heading = this.heading.get();
    document.title = heading === '' ? app : `${heading}${TITLE_SEPARATOR}${app}`;
  }
}

JlPage.register();
