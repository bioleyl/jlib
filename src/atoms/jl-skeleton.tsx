import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { clampedNumber, oneOf } from '../lib/attributes';
import { cssLength } from '../lib/css-length';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-skeleton.css?raw';

import type { SkeletonShape } from '../types/jl-skeleton.types';

export const SKELETON_SHAPES: readonly SkeletonShape[] = ['text', 'rect', 'circle'];

const MIN_LINES = 1;
const MAX_LINES = 20;

/**
 * A placeholder that shimmers where content is loading: lines of `text`, a `rect` for an image or a card, a
 * `circle` for an avatar. Screen readers skip it; mark the region it fills with `aria-busy="true"`.
 */
export class JlSkeleton extends JlElement {
  static readonly selector = 'jl-skeleton';

  readonly shape = this.useChange<SkeletonShape>(
    'text',
    (value) => {
      this.reflect('shape', value);
      this.renderBones();
    },
    { attribute: 'shape', parse: oneOf(SKELETON_SHAPES, 'text') }
  );
  /** A CSS length; a plain number is in pixels. Text and blocks take the whole width by default. */
  readonly width = this.useChange('', (value) => this.setLength('--width', value), { attribute: 'width' });
  /** A CSS length; a plain number is in pixels. A circle takes its width when it has no height. */
  readonly height = this.useChange('', (value) => this.setLength('--height', value), { attribute: 'height' });
  /** For text: how many lines; the last of several is shorter, as a paragraph's is. */
  readonly lines = this.useChange(MIN_LINES, () => this.renderBones(), {
    attribute: 'lines',
    parse: clampedNumber(MIN_LINES, MIN_LINES, MAX_LINES),
  });

  private readonly _refs = this.useRefs((ref) => ({ bones: ref('.bones') }));

  templateHtml(): Node {
    return <span class="bones" aria-hidden="true" attrs={{ part: 'base' }} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private renderBones(): void {
    const count = this.shape.get() === 'text' ? Math.round(this.lines.get()) : 1;
    this._refs.bones.replaceChildren(...Array.from({ length: count }, () => <span class="bone" />));
  }

  private setLength(property: string, value: string): void {
    const length = cssLength(value);
    if (length === '') {
      this.style.removeProperty(property);
      return;
    }
    this.style.setProperty(property, length);
  }
}

JlSkeleton.register();
