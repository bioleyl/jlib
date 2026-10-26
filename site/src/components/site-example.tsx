import { css } from '@jadis/core';
import { JlButton, JlCodeBlock, JlElement } from '@syware/jlib';
import { dedent } from '@syware/jlib/lib/text';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import styles from './site-example.css?raw';

import type { Example } from '../types/docs.types';

/**
 * One example of a component: it runs in the page, with its code a press away. Its HTML is rendered in the light
 * DOM, so the classes `row` and `stack` of the page's example styles lay it out.
 */
export class SiteExample extends JlElement {
  static readonly selector = 'site-example';

  /** The example, set as a property. */
  readonly example = this.useChange<Example | null>(null, () => this.build());

  private readonly _refs = this.useRefs((ref) => ({
    code: ref('.code'),
    description: ref('.description'),
    heading: ref('h3'),
    html: ref<JlCodeBlock>('.html-code'),
    script: ref<JlCodeBlock>('.script-code'),
    toggle: ref<JlButton>('.toggle'),
  }));

  templateHtml(): Node {
    return (
      <section class="example">
        <header>
          <div class="titles">
            {/* biome-ignore lint/a11y/useHeadingContent: the title is the example's, set when it arrives */}
            <h3 />
            <p class="description" hidden />
          </div>
          <JlButton class="toggle" variant="ghost" size="sm" icon="code" label="Code" />
        </header>
        <div class="preview">
          <slot />
        </div>
        <div class="code" hidden>
          <JlCodeBlock class="html-code" language="html" />
          <JlCodeBlock class="script-code" language="ts" hidden />
        </div>
      </section>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.toggle.events.register('press', () => {
      const code = this._refs.code;
      code.hidden = !code.hidden;
      this._refs.toggle.label.set(code.hidden ? 'Code' : 'Hide code');
    });
  }

  private build(): void {
    const example = this.example.get();
    if (example === null) {
      return;
    }
    const html = dedent(example.html);
    this._refs.heading.textContent = example.title;
    this._refs.description.textContent = example.description ?? '';
    this._refs.description.hidden = example.description === undefined;
    this._refs.html.code.set(html);
    this._refs.script.code.set(dedent(example.script ?? ''));
    this._refs.script.hidden = example.script === undefined;
    const preview = <div class="example-root" />;
    preview.innerHTML = html;
    this.replaceChildren(preview);
    example.setup?.(preview);
  }
}

SiteExample.register();
