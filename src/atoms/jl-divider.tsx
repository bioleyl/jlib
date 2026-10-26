import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-divider.css?raw';

import type { DividerAlign } from '../types/jl-divider.types';

export const DIVIDER_ALIGNS: readonly DividerAlign[] = ['center', 'start', 'end'];

/**
 * A line between groups of content, across or (`vertical`) up and down. A `label` sits on the line: "or",
 * "Today", "Advanced".
 */
export class JlDivider extends JlElement {
  static readonly selector = 'jl-divider';

  readonly label = this.useChange(
    '',
    (value) => {
      this._refs.label.textContent = value;
      this._refs.label.hidden = value === '';
      this.reflect('labelled', value !== '');
      setOrRemove(this._refs.divider, 'aria-label', value);
    },
    { attribute: 'label' }
  );
  readonly vertical = this.useChange(
    false,
    (value) => {
      this.reflect('vertical', value);
      this._refs.divider.setAttribute('aria-orientation', value ? 'vertical' : 'horizontal');
    },
    { attribute: 'vertical' }
  );
  /** Where the label sits along the line. */
  readonly align = this.useChange<DividerAlign>('center', (value) => this.reflect('align', value), {
    attribute: 'align',
    parse: oneOf(DIVIDER_ALIGNS, 'center'),
  });

  private readonly _refs = this.useRefs((ref) => ({
    divider: ref('.divider'),
    label: ref('.label'),
  }));

  templateHtml(): Node {
    return (
      // biome-ignore lint/a11y/useSemanticElements: the line holds a label, which an <hr> cannot
      <div class="divider" role="separator" attrs={{ part: 'base' }}>
        <span class="line before" />
        <span class="label" hidden />
        <span class="line after" />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }
}

JlDivider.register();
