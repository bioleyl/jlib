import { css } from '@jadis/core';
import { JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { LOGO_MIN_HEIGHT } from '../lib/syware-logo';
import { pageHref } from '../services/navigation';
import styles from './site-brand.css?raw';
import { SiteLogo } from './site-logo';

/** The SyWare mark and the wordmark: "j" in ink, "lib" in the logo's blue. */
export class SiteBrand extends JlElement {
  static readonly selector = 'site-brand';

  templateHtml(): Node {
    return (
      <a class="brand" href={pageHref('/')} aria-label="jlib, home">
        <SiteLogo variant="mark" height={LOGO_MIN_HEIGHT} />
        <span class="word">
          j<span class="lib">lib</span>
        </span>
      </a>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }
}

SiteBrand.register();
