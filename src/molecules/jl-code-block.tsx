import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { cssLength } from '../lib/css-length';
import { highlightedNodes } from '../lib/highlight';
import { dedent } from '../lib/text';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-code-block.css?inline';
import { JlCopyButton } from './jl-copy-button';

import type { CodeLanguage } from '../types/highlight.types';

export const CODE_LANGUAGES: readonly CodeLanguage[] = ['text', 'html', 'css', 'ts', 'bash'];

const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  bash: 'Shell',
  css: 'CSS',
  html: 'HTML',
  text: '',
  ts: 'TypeScript',
};

/**
 * Source code, coloured, with a button to copy it. The code is the `code` property, or the element's own text
 * (a `<template>` inside keeps HTML as text): `<jl-code-block language="ts">const a = 1;</jl-code-block>`.
 */
export class JlCodeBlock extends JlElement {
  static readonly selector = 'jl-code-block';

  // Before `code`: as the block connects, each input calls back in this order, so the code is coloured once.
  readonly language = this.useChange<CodeLanguage>('text', () => this.render(), {
    attribute: 'language',
    parse: oneOf(CODE_LANGUAGES, 'text'),
  });
  readonly code = this.useChange('', () => this.render(), { attribute: 'code' });
  /** A file name or a title over the code. */
  readonly heading = this.useChange(
    '',
    (value) => {
      this._refs.heading.textContent = value;
      this.reflect('has-header', value !== '');
    },
    { attribute: 'heading' }
  );
  readonly lineNumbers = this.useChange(false, (value) => this.reflect('line-numbers', value), {
    attribute: 'line-numbers',
  });
  readonly hideCopy = this.useChange(
    false,
    (value) => {
      this._refs.copy.hidden = value;
    },
    { attribute: 'hide-copy' }
  );
  /** Wraps long lines instead of scrolling sideways. */
  readonly wrap = this.useChange(false, (value) => this.reflect('wrap', value), { attribute: 'wrap' });
  /** A CSS height past which the code scrolls under its header: `320px`, `50vh`; a number is pixels. */
  readonly maxHeight = this.useChange(
    '',
    (value) => this.style.setProperty('--max-height', value.trim() === '' ? 'none' : cssLength(value)),
    { attribute: 'max-height' }
  );

  /** What the code was coloured from: the inputs call back with what they hold as the block connects. */
  private readonly _drawn = { language: '', source: '' };

  private readonly _refs = this.useRefs((ref) => ({
    code: ref('code'),
    copy: ref(JlCopyButton),
    gutter: ref('.gutter'),
    heading: ref('.heading'),
    language: ref('.language'),
  }));

  templateHtml(): Node {
    return (
      <figure attrs={{ part: 'base' }}>
        <header>
          <span class="heading" />
          <span class="language" />
        </header>
        <div class="body">
          <div class="gutter" aria-hidden="true" />
          <pre>
            <code />
          </pre>
          <JlCopyButton class="copy" />
        </div>
      </figure>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  /** The code shown: the `code` input, or else the text the page wrote inside the element. */
  private source(): string {
    const code = this.code.get();
    if (code !== '') {
      return code;
    }
    const template = this.querySelector('template');
    return dedent(template === null ? (this.textContent ?? '') : template.innerHTML);
  }

  private render(): void {
    const source = this.source();
    const language = this.language.get();
    if (source === this._drawn.source && language === this._drawn.language) {
      return;
    }
    this._drawn.source = source;
    this._drawn.language = language;
    this._refs.code.replaceChildren(...highlightedNodes(source, language));
    this._refs.copy.value.set(source);
    this._refs.language.textContent = LANGUAGE_LABELS[language];
    this.renderGutter(source);
  }

  /** The line numbers, which the CSS shows with `line-numbers`. */
  private renderGutter(source: string): void {
    const count = source.split('\n').length;
    this._refs.gutter.textContent = Array.from({ length: count }, (_, index) => String(index + 1)).join('\n');
  }
}

JlCodeBlock.register();
