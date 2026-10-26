import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { iconElement } from '../lib/icons';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-icon.css?raw';

const DEFAULT_SIZE = 16;

/**
 * A lucide icon by name: `<jl-icon name="search">`. Decorative unless it has a `label`, which screen readers
 * read instead. More icons: `registerIcons({ rocket: Rocket })`. `filled` draws a sign in a shape (`circle-check`,
 * `triangle-alert`) as a solid badge.
 */
export class JlIcon extends JlElement {
  static readonly selector = 'jl-icon';

  readonly name = this.useChange('', () => this.draw(), { attribute: 'name' });
  readonly size = this.useChange(DEFAULT_SIZE, () => this.draw(), { attribute: 'size' });
  readonly label = this.useChange('', (value) => this.setAccessibleName(value), { attribute: 'label' });
  /** The icon's first shape (the circle or triangle around a sign) in solid colour, the sign cut out of it. */
  readonly filled = this.useChange(false, (value) => this.reflect('filled', value), { attribute: 'filled' });

  private readonly _refs = this.useRefs((ref) => ({ icon: ref('.icon') }));

  templateHtml(): Node {
    return <span class="icon" />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private draw(): void {
    const name = this.name.get();
    this._refs.icon.replaceChildren(...(name === '' ? [] : [iconElement(name, this.size.get())]));
  }

  private setAccessibleName(label: string): void {
    const icon = this._refs.icon;
    if (label === '') {
      icon.removeAttribute('role');
      icon.removeAttribute('aria-label');
      return;
    }
    icon.setAttribute('role', 'img');
    icon.setAttribute('aria-label', label);
  }
}

JlIcon.register();
