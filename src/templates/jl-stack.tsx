import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-stack.css?inline';

import type { StackGap } from '../types/jl-stack.types';

export const STACK_GAPS: readonly StackGap[] = ['sm', 'md', 'lg'];

/**
 * Puts its children one under the other, as wide as the stack, with the same space between them: the fields of a
 * form, in a dialog or on a page, or the cards of a column.
 */
export class JlStack extends JlElement {
  static readonly selector = 'jl-stack';

  /** The space between the items. */
  readonly gap = this.useChange<StackGap>('md', (value) => this.reflect('gap', value), {
    attribute: 'gap',
    parse: oneOf(STACK_GAPS, 'md'),
  });

  templateHtml(): Node {
    return (
      <div class="stack" attrs={{ part: 'base' }}>
        <slot />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }
}

JlStack.register();
