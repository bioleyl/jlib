import { Jadis } from '@jadis/core';

import { adoptTokens } from '../lib/tokens';

/**
 * The base of every component. Inputs are `useChange` fields: bound to an attribute for text, numbers, flags and
 * JSON lists (`{ attribute: 'label' }`), so they work from HTML, from JSX and from code alike.
 */
export abstract class JlElement extends Jadis {
  /** Defines the element, and gives the document the design tokens the first time. */
  static override register(): void {
    adoptTokens();
    // biome-ignore lint/complexity/noThisInStatic: super keeps the subclass as `this`, which Jadis defines
    super.register();
  }

  /** Runs now when the template exists, otherwise as soon as the component connects. */
  protected whenRendered(action: () => void): void {
    if (this.isConnected) {
      action();
      return;
    }
    this.onConnectActions.push(action);
  }

  /**
   * Mirrors a value on the host as an attribute, so the styles can use `:host([name])` and `:host([name="x"])`.
   * `false` and `''` remove the attribute, `true` sets it empty.
   */
  protected reflect(name: string, value: string | boolean): void {
    if (value === false || value === '') {
      this.removeAttribute(name);
      return;
    }
    const text = value === true ? '' : value;
    if (this.getAttribute(name) !== text) {
      this.setAttribute(name, text);
    }
  }
}
