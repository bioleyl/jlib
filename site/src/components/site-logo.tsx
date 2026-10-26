import { css } from '@jadis/core';
import { JlElement, oneOf } from 'jlib';
import { BASE_STYLES } from 'jlib/styles/shared';

import { LOGO_MIN_HEIGHT } from '../lib/syware-logo';
import { isDarkNow, onDarkChange } from '../services/theme';
import styles from './site-logo.css?raw';

import type { LogoVariant } from '../types/site.types';

const VARIANTS: readonly LogoVariant[] = ['mark', 'logo'];

// The files' proportions: width over height, as scripts/logo-png.mjs renders them.
const ASPECTS: Record<LogoVariant, number> = { logo: 647 / 256, mark: 234 / 256 };

/**
 * The SyWare logo or mark, from the large PNGs: shrunk by the browser, their edges stay smooth at small sizes. The
 * version with white ink shows on dark pages.
 */
export class SiteLogo extends JlElement {
  static readonly selector = 'site-logo';

  readonly variant = this.useChange<LogoVariant>('logo', () => this.render(), {
    attribute: 'variant',
    parse: oneOf(VARIANTS, 'logo'),
  });
  readonly height = this.useChange(LOGO_MIN_HEIGHT, () => this.render(), { attribute: 'height' });

  private readonly _refs = this.useRefs((ref) => ({
    dark: ref<HTMLImageElement>('.dark'),
    light: ref<HTMLImageElement>('.light'),
  }));

  templateHtml(): Node {
    return (
      <>
        <img class="light" alt="SyWare" decoding="async" />
        <img class="dark" alt="SyWare" decoding="async" />
      </>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.renderTheme();
    onDarkChange(() => this.renderTheme(), this.killSignal);
  }

  private render(): void {
    const variant = this.variant.get();
    const height = this.height.get();
    const width = Math.round(height * ASPECTS[variant]);
    for (const [image, file] of [
      [this._refs.light, `./syware-${variant}.png`],
      [this._refs.dark, `./syware-${variant}-dark.png`],
    ] as const) {
      image.src = file;
      image.width = width;
      image.height = height;
    }
  }

  private renderTheme(): void {
    this.reflect('dark', isDarkNow());
  }
}

SiteLogo.register();
