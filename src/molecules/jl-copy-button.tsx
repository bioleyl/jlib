import { css } from '@jadis/core';
import { Check, Copy, X } from 'lucide';

import { JlButton } from '../atoms/jl-button';
import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { CONTROL_SIZES } from '../lib/options';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-copy-button.css?inline';

import type { ControlSize } from '../types/options.types';
import type { JlTextKey } from '../types/texts.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ check: Check, copy: Copy, x: X });

// How long the button says "Copied", or that it could not, before it goes back to its copy icon.
const CONFIRM_MS = 1600;

/** What the last press came to: nothing to say, the text copied, or the clipboard refusing it. */
type CopyOutcome = 'idle' | 'copied' | 'failed';

const OUTCOME_LOOKS: Record<CopyOutcome, { icon: string; text: JlTextKey }> = {
  copied: { icon: 'check', text: 'copied' },
  failed: { icon: 'x', text: 'copyFailed' },
  idle: { icon: 'copy', text: 'copy' },
};

/**
 * Copies a text to the clipboard, and says so for a moment. Fires `copy` with the text. Where the clipboard refuses
 * (a page served without https has none, a permission denied), the button says that it could not copy.
 */
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

  private readonly _state = { outcome: 'idle' as CopyOutcome, timer: 0 };

  private readonly _refs = this.useRefs((ref) => ({ button: ref(JlButton) }));

  templateHtml(): Node {
    return <JlButton variant="ghost" icon={OUTCOME_LOOKS.idle.icon} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.button.events.register('press', () => void this.copyOnPress());
  }

  /** The timer goes, and what it would have taken back with it: the button returns as a copy button. */
  onDisconnect(): void {
    this.say('idle');
  }

  /** Copies the value now; resolves once the clipboard has it, and rejects when the clipboard refuses. */
  async copy(): Promise<void> {
    const text = this.value.get();
    await navigator.clipboard.writeText(text);
    this.events.emit('copy', text);
    this.say('copied');
  }

  protected drawTexts(): void {
    this._refs.button.hint.set(jlText(OUTCOME_LOOKS[this._state.outcome].text));
  }

  /** A press has no caller to tell of a refusal: the button says it, where `copy()` rejects. */
  private async copyOnPress(): Promise<void> {
    try {
      await this.copy();
    } catch {
      this.say('failed');
    }
  }

  /** Shows what the press came to, for a moment when there is something to say. */
  private say(outcome: CopyOutcome): void {
    this._state.outcome = outcome;
    this._refs.button.icon.set(OUTCOME_LOOKS[outcome].icon);
    this.reflect('copied', outcome === 'copied');
    this.reflect('failed', outcome === 'failed');
    this.drawTexts();
    window.clearTimeout(this._state.timer);
    if (outcome !== 'idle') {
      this._state.timer = window.setTimeout(() => this.say('idle'), CONFIRM_MS);
    }
  }
}

JlCopyButton.register();
