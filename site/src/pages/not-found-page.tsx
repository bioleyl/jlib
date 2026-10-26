import { css } from '@jadis/core';
import { JlElement } from 'jlib';
import { BASE_STYLES } from 'jlib/styles/shared';

import { PROSE_STYLES } from '../styles/site-styles';

/** Any address the site does not know. */
export class NotFoundPage extends JlElement {
  static readonly selector = 'site-not-found-page';

  templateHtml(): Node {
    return (
      <article>
        <p class="label">404</p>
        <h1>This page does not exist</h1>
        <p class="lead">
          It may have moved. <a href="#/">Go to the introduction</a> or{' '}
          <a href="#/components">browse the components</a>.
        </p>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}`;
  }
}

NotFoundPage.register();
