import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-tab-panel.css?raw';

const ROLE = 'tabpanel';

/**
 * One panel of a `jl-tabs`: its content, and what its tab shows (`label`, `icon`, `badge`). The tabs open one
 * panel at a time and mark it `selected`; outside of `jl-tabs` a panel shows nothing.
 */
export class JlTabPanel extends JlElement {
  static readonly selector = 'jl-tab-panel';

  /** What `jl-tabs`'s `value` names to open this panel; its position in the tabs when empty. */
  readonly name = this.useChange('', (value) => this.reflect('name', value), { attribute: 'name' });
  /** The tab's text, and the panel's name for screen readers. */
  readonly label = this.useChange(
    '',
    (value) => {
      this.reflect('label', value);
      this._internals.ariaLabel = value === '' ? null : value;
    },
    { attribute: 'label' }
  );
  /** An icon before the tab's text. */
  readonly icon = this.useChange('', (value) => this.reflect('icon', value), { attribute: 'icon' });
  /** A short count or word after the tab's text: "3", "New". */
  readonly badge = this.useChange('', (value) => this.reflect('badge', value), { attribute: 'badge' });
  readonly disabled = this.useChange(false, (value) => this.reflect('disabled', value), { attribute: 'disabled' });

  private readonly _internals = Object.assign(this.attachInternals(), { role: ROLE });

  templateHtml(): Node {
    return <slot />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }
}

JlTabPanel.register();
