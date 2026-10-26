import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { highlightedNodes } from '../lib/highlight';
import { dedent } from '../lib/text';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-code-block.css?raw';
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

  readonly code = this.useChange('', () => this.render(), { attribute: 'code' });
  readonly language = this.useChange<CodeLanguage>('text', () => this.render(), {
    attribute: 'language',
    parse: oneOf(CODE_LANGUAGES, 'text'),
  });
  /** A file name or a title over the code. */
  readonly heading = this.useChange('', () => this.renderHeader(), { attribute: 'heading' });
  readonly lineNumbers = this.useChange(false, () => this.render(), { attribute: 'line-numbers' });
  readonly hideCopy = this.useChange(
    false,
    (value) => {
      this._refs.copy.hidden = value;
    },
    { attribute: 'hide-copy' }
  );
  /** Wraps long lines instead of scrolling sideways. */
  readonly wrap = this.useChange(false, (value) => this.reflect('wrap', value), { attribute: 'wrap' });

  private readonly _refs = this.useRefs((ref) => ({
    code: ref('code'),
    copy: ref<JlCopyButton>('jl-copy-button'),
    gutter: ref('.gutter'),
    header: ref('header'),
    heading: ref('.heading'),
    language: ref('.language'),
  }));

  templateHtml(): Node {
    return (
      <figure attrs={{ part: 'base' }}>
        <header hidden>
          <span class="heading" />
          <span class="language" />
        </header>
        <div class="body">
          <div class="gutter" aria-hidden="true" hidden />
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
    this._refs.code.replaceChildren(...highlightedNodes(source, language));
    this._refs.copy.value.set(source);
    this.renderGutter(source);
    this.renderHeader();
  }

  private renderGutter(source: string): void {
    const gutter = this._refs.gutter;
    gutter.hidden = !this.lineNumbers.get();
    const count = source.split('\n').length;
    gutter.textContent = Array.from({ length: count }, (_, index) => String(index + 1)).join('\n');
  }

  private renderHeader(): void {
    const heading = this.heading.get();
    const label = LANGUAGE_LABELS[this.language.get()];
    this._refs.heading.textContent = heading;
    this._refs.language.textContent = label;
    this._refs.header.hidden = heading === '';
    this.reflect('has-header', heading !== '');
  }
}

JlCodeBlock.register();
