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
  readonly label = this.useChange(
    jlText('loading'),
    (value) => this._refs.ring.setAttribute('aria-label', value),
    {
      attribute: 'label',
    }
  );

  private readonly _refs = this.useRefs((ref) => ({ ring: ref('.ring') }));

  templateHtml(): Node {
    return <span class="ring" role="status" />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }
}

JlSpinner.register();
