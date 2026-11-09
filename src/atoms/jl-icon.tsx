import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { hasIcon, iconElement } from '../lib/icons';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-icon.css?inline';

const DEFAULT_SIZE = 16;

/**
 * A lucide icon by name: `<jl-icon name="search">`. Decorative unless it has a `label`, which screen readers
 * read instead. More icons: `registerIcons({ rocket: Rocket })`. `filled` draws a sign in a shape (`circle-check`,
 * `triangle-alert`) as a solid badge.
 */
export class JlIcon extends JlElement {
  static readonly selector = 'jl-icon';

  readonly name = this.useChange('', () => this.draw(), { attribute: 'name' });
  /** Its width and height in pixels, which the CSS gives the SVG: a new size draws nothing again. */
  readonly size = this.useChange(
    DEFAULT_SIZE,
    (value) => this._refs.icon.style.setProperty('--size', `${value}px`),
    {
      attribute: 'size',
    }
  );
  readonly label = this.useChange('', (value) => this.setAccessibleName(value), { attribute: 'label' });
  /** The icon's first shape (the circle or triangle around a sign) in solid colour, the sign cut out of it. */
  readonly filled = this.useChange(false, (value) => this.reflect('filled', value), { attribute: 'filled' });

  // The name of the SVG drawn: set() calls draw() even with the same name, and a page sets names over many rows.
  private readonly _drawn = { name: '' };

  private readonly _refs = this.useRefs((ref) => ({ icon: ref('.icon') }));

  templateHtml(): Node {
    return <span class="icon" />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private draw(): void {
    const name = this.name.get();
    if (name === this._drawn.name) {
      return;
    }
    if (name !== '' && !hasIcon(name)) {
      // A page registers its icons after its imports, which define the components: icons a server wrote in the page
      // upgrade before that. One not known yet is drawn at the end of the task, before the browser paints.
      this._refs.icon.replaceChildren();
      queueMicrotask(() => this.drawNow());
      return;
    }
    this.drawNow();
  }

  private drawNow(): void {
    const name = this.name.get();
    this._refs.icon.replaceChildren(...(name === '' ? [] : [iconElement(name, this.size.get())]));
    // A name not registered yet draws a neutral mark: setting it again, once registered, draws the icon.
    this._drawn.name = name === '' || hasIcon(name) ? name : '';
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
