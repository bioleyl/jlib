import { css } from '@jadis/core';

import { JlButton } from '../atoms/jl-button';
import { JlElement } from '../base/jl-element';
import { pageLocale } from '../lib/locale';
import { fillText } from '../lib/text';
import { jlTemplate, jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-load-more.css?raw';

/**
 * The end of a long list read a page at a time: how much of it shows ("30 of 120") and a button that asks for the
 * next page (`more`). It shows the button's spinner while `loading`, and takes no room once the whole list shows.
 */
export class JlLoadMore extends JlElement {
  static readonly selector = 'jl-load-more';

  readonly events = this.useEvents<{ more: undefined }>();

  /** How many items the list shows. */
  readonly shown = this.useChange(0, () => this.render(), { attribute: 'shown' });
  /** How many it has in all. */
  readonly total = this.useChange(0, () => this.render(), { attribute: 'total' });
  /** The next page is on its way: the button shows a spinner and ignores presses. */
  readonly loading = this.useChange(false, (value) => this._refs.button.loading.set(value), {
    attribute: 'loading',
  });
  /** The button's text; jlib's own when empty. */
  readonly label = this.useChange('', () => this.renderLabel(), { attribute: 'label' });
  /** What shows beside it, `{shown}` and `{total}` filled; jlib's own when empty. */
  readonly countText = this.useChange('', () => this.render(), { attribute: 'count-text' });

  private readonly _refs = this.useRefs((ref) => ({ button: ref(JlButton), count: ref('.count') }));

  templateHtml(): Node {
    return (
      <div class="more" attrs={{ part: 'base' }}>
        <span class="count" aria-live="polite" />
        <JlButton size="sm" />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.button.events.register('press', () => {
      if (!this.loading.get()) {
        this.events.emit('more');
      }
    });
  }

  protected drawTexts(): void {
    this.renderLabel();
    this.render();
  }

  private renderLabel(): void {
    this._refs.button.label.set(this.label.get() || jlText('showMore'));
  }

  private render(): void {
    const locale = pageLocale();
    const shown = this.shown.get();
    const total = this.total.get();
    this._refs.count.textContent = fillText(this.countText.get() || jlTemplate('shownOfTotal'), {
      shown: shown.toLocaleString(locale),
      total: total.toLocaleString(locale),
    });
    this.reflect('complete', shown >= total);
  }
}

JlLoadMore.register();
