import { css } from '@jadis/core';
import { Check, Copy } from 'lucide';

import { JlButton } from '../atoms/jl-button';
import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { CONTROL_SIZES } from '../lib/options';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-copy-button.css?raw';

import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ check: Check, copy: Copy });

// How long the button says "Copied" before it goes back to its copy icon.
const CONFIRM_MS = 1600;
const COPY_ICON = 'copy';
const DONE_ICON = 'check';

/** Copies a text to the clipboard, and says so for a moment. Fires `copy` with the text. */
export class JlCopyButton extends JlElement {
  static readonly selector = 'jl-copy-button';

  readonly events = this.useEvents<{ copy: string }>();

  readonly value = this.useChange('', () => undefined, { attribute: 'value' });
  /** Shown beside the icon; without it the button is an icon with a tooltip. */
  readonly label = this.useChange('', (value) => this._refs.button.label.set(value), { attribute: 'label' });
  readonly size = this.useChange<ControlSize>('sm', (value) => this._refs.button.size.set(value), {
    attribute: 'size',
    parse: oneOf(CONTROL_SIZES, 'sm'),
  });

  private readonly _timer = { id: 0 };

  private readonly _refs = this.useRefs((ref) => ({ button: ref(JlButton) }));

  templateHtml(): Node {
    return <JlButton variant="ghost" icon={COPY_ICON} hint={jlText('copy')} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.button.events.register('press', () => void this.copy());
  }

  onDisconnect(): void {
    window.clearTimeout(this._timer.id);
  }

  /** Copies the value now; resolves once the clipboard has it. */
  async copy(): Promise<void> {
    const text = this.value.get();
    await navigator.clipboard.writeText(text);
    this.events.emit('copy', text);
    this.confirm();
  }

  private confirm(): void {
    const button = this._refs.button;
    button.icon.set(DONE_ICON);
    button.hint.set(jlText('copied'));
    this.reflect('copied', true);
    window.clearTimeout(this._timer.id);
    this._timer.id = window.setTimeout(() => {
      button.icon.set(COPY_ICON);
      button.hint.set(jlText('copy'));
      this.reflect('copied', false);
    }, CONFIRM_MS);
  }
}

JlCopyButton.register();
