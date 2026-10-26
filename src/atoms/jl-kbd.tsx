import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { keycapsOf, spokenKeys } from '../lib/keycaps';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-kbd.css?raw';

import type { KeyPlatform } from '../types/keycaps.types';

const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;

type NavigatorWithUserAgentData = Navigator & { userAgentData?: { platform?: string } };

/** Whether this browser runs on an Apple system, where shortcuts use ⌘ rather than Ctrl. */
function currentPlatform(): KeyPlatform {
  if (typeof navigator === 'undefined') {
    return 'other';
  }
  const browser = navigator as NavigatorWithUserAgentData;
  const platform = browser.userAgentData?.platform ?? browser.platform ?? '';
  return APPLE_PLATFORM.test(platform) ? 'apple' : 'other';
}

/**
 * A keyboard shortcut, one keycap per key: `keys="mod+shift+k"` draws ⌘ ⇧ K on a Mac and Ctrl Shift K elsewhere.
 * Without `keys`, the element's text is one keycap: `<jl-kbd>Esc</jl-kbd>`.
 */
export class JlKbd extends JlElement {
  static readonly selector = 'jl-kbd';

  /** Keys joined by "+": modifiers (mod, ctrl, alt, shift), named keys (enter, esc, up…) and characters. */
  readonly keys = this.useChange('', () => this.render(), { attribute: 'keys' });

  private readonly _refs = this.useRefs((ref) => ({
    caps: ref('.caps'),
    own: ref('.own'),
    spoken: ref('.spoken'),
  }));

  templateHtml(): Node {
    return (
      <kbd class="keys" attrs={{ part: 'base' }}>
        <span class="caps" aria-hidden="true" />
        <span class="spoken sr-only" />
        <kbd class="key own">
          <slot />
        </kbd>
      </kbd>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private render(): void {
    const keycaps = keycapsOf(this.keys.get(), currentPlatform());
    const own = keycaps.length === 0;
    this._refs.caps.replaceChildren(...keycaps.map((keycap) => <kbd class="key">{keycap.label}</kbd>));
    this._refs.spoken.textContent = spokenKeys(keycaps);
    this._refs.own.hidden = !own;
    this._refs.caps.hidden = own;
  }
}

JlKbd.register();
