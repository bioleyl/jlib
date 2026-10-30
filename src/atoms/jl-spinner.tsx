import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-spinner.css?raw';

const DEFAULT_SIZE = 16;

/** A turning ring for work in progress. It follows the text colour; `label` is what screen readers say. */
export class JlSpinner extends JlElement {
  static readonly selector = 'jl-spinner';

  readonly size = this.useChange(DEFAULT_SIZE, (value) => this.style.setProperty('--size', `${value}px`), {
    attribute: 'size',
  });
  /** What screen readers say; jlib's own text when empty. */
  readonly label = this.useChange('', () => this.drawTexts(), { attribute: 'label' });

  private readonly _refs = this.useRefs((ref) => ({ ring: ref('.ring') }));

  templateHtml(): Node {
    return <span class="ring" role="status" />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  protected drawTexts(): void {
    this._refs.ring.setAttribute('aria-label', this.label.get() || jlText('loading'));
  }
}

JlSpinner.register();
