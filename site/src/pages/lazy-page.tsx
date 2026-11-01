import { css } from '@jadis/core';
import { JlElement, JlLoadState } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import styles from './lazy-page.css?inline';

import type { PageLoader } from '../types/site.types';

/**
 * A page whose module loads the first time it opens. The router takes a page's class, so this one stands for it in
 * the routes: it loads the module, then draws the page inside itself, in a load state the page outlet waits for.
 */
export function lazyPage(selector: `site-${string}`, load: PageLoader) {
  class LazyPage extends JlElement {
    static readonly selector = selector;

    private readonly _refs = this.useRefs((ref) => ({ state: ref(JlLoadState) }));

    templateHtml(): Node {
      return (
        <JlLoadState skeleton="lines">
          <slot />
        </JlLoadState>
      );
    }

    templateCss(): string {
      return css`${BASE_STYLES}${styles}`;
    }

    onConnect(): void {
      if (this.childElementCount > 0) {
        return;
      }
      void this._refs.state.load({ draw: (Page) => this.append(new Page()), fetch: load });
    }
  }

  LazyPage.register();
  return LazyPage;
}
