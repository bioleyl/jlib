import { css } from '@jadis/core';
import { JlCodeBlock, JlElement, JlSegmented } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { shownSnippet } from '../lib/snippets';
import styles from './site-typing.css?raw';

import type { SegmentedOption } from '@syware/jlib';
import type { TypingDoc } from '../types/docs.types';

const TYPING_TABS: SegmentedOption[] = [
  { label: 'Code', value: 'code' },
  { label: 'JSX', value: 'jsx' },
];

/** How a component typed by what it holds is written: what the type checks, then the code, in code or in JSX. */
export class SiteTyping extends JlElement {
  static readonly selector = 'site-typing';

  /** The component's typing, set as a property. */
  readonly typing = this.useChange<TypingDoc | null>(null, () => this.build());

  private readonly _refs = this.useRefs((ref) => ({
    code: ref<JlCodeBlock>('.code-snippet'),
    description: ref('.description'),
    jsx: ref<JlCodeBlock>('.jsx-snippet'),
    tabs: ref<JlSegmented>('.tabs'),
  }));

  templateHtml(): Node {
    return (
      <section class="typing">
        <p class="description" />
        <JlSegmented class="tabs" size="sm" label="Written" options={TYPING_TABS} value="code" />
        <JlCodeBlock class="code-snippet" language="ts" />
        <JlCodeBlock class="jsx-snippet" language="ts" hidden />
      </section>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.tabs.events.register('change', (tab) => this.showTab(tab));
  }

  private build(): void {
    const typing = this.typing.get();
    if (typing === null) {
      return;
    }
    this._refs.description.textContent = typing.description;
    this._refs.code.code.set(shownSnippet(typing.code));
    this._refs.jsx.code.set(shownSnippet(typing.jsx));
  }

  private showTab(tab: string): void {
    this._refs.code.hidden = tab !== 'code';
    this._refs.jsx.hidden = tab !== 'jsx';
  }
}

SiteTyping.register();
