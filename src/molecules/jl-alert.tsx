import { css } from '@jadis/core';
import { CircleCheck, CircleX, Info, Sparkles, TriangleAlert, X } from 'lucide';

import { JlButton } from '../atoms/jl-button';
import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { TONE_ICON_FILLED, TONE_ICONS, TONES } from '../lib/options';
import { hasSlotted } from '../lib/slots';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-alert.css?raw';

import type { Tone } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({
  'circle-check': CircleCheck,
  'circle-x': CircleX,
  info: Info,
  sparkles: Sparkles,
  'triangle-alert': TriangleAlert,
  x: X,
});

const ICON_SIZE = 18;
// `icon="none"` hides the icon the tone would show.
const NO_ICON = 'none';

/** Warnings and failures interrupt a screen reader; the other tones wait for a pause. */
const TONE_ROLES: Record<Tone, 'alert' | 'status'> = {
  accent: 'status',
  danger: 'alert',
  info: 'status',
  neutral: 'status',
  ok: 'status',
  warn: 'alert',
};

/**
 * A message in the flow of the page, coloured by its tone: a tip, a success, a warning, an error. The text is the
 * `description` or goes in the default slot (for links and markup), buttons in `slot="actions"`. A `dismissible`
 * alert has an × that hides it.
 */
export class JlAlert extends JlElement {
  static readonly selector = 'jl-alert';

  readonly events = this.useEvents<{ dismiss: undefined }>();

  readonly tone = this.useChange<Tone>(
    'info',
    (value) => {
      this.reflect('tone', value);
      this._refs.alert.setAttribute('role', TONE_ROLES[value]);
      this.renderIcon();
    },
    { attribute: 'tone', parse: oneOf(TONES, 'info') }
  );
  readonly heading = this.useChange(
    '',
    (value) => {
      this._refs.heading.textContent = value;
      this._refs.heading.hidden = value === '';
    },
    { attribute: 'heading' }
  );
  /** The message as plain text, for pages that set it from code; richer content goes in the default slot. */
  readonly description = this.useChange(
    '',
    (value) => {
      this._refs.description.textContent = value;
      this._refs.description.hidden = value === '';
    },
    { attribute: 'description' }
  );
  /** An icon name in place of the tone's own; `none` shows no icon. */
  readonly icon = this.useChange('', () => this.renderIcon(), { attribute: 'icon' });
  /** Shows an × that hides the alert and fires `dismiss`. */
  readonly dismissible = this.useChange(
    false,
    (value) => {
      this._refs.close.hidden = !value;
      this.reflect('dismissible', value);
    },
    { attribute: 'dismissible' }
  );

  private readonly _refs = this.useRefs((ref) => ({
    actions: ref('.actions'),
    actionsSlot: ref<HTMLSlotElement>('slot[name="actions"]'),
    alert: ref('.alert'),
    close: ref<JlButton>('.close'),
    description: ref('.description'),
    heading: ref('.heading'),
    icon: ref<JlIcon>('.icon'),
    text: ref('.text'),
    textSlot: ref<HTMLSlotElement>('slot:not([name])'),
  }));

  /** Hides the alert as its × does, and fires `dismiss`. */
  dismiss(): void {
    this.hidden = true;
    this.events.emit('dismiss');
  }

  templateHtml(): Node {
    return (
      <div class="alert" role="status" attrs={{ part: 'base' }}>
        <JlIcon class="icon" size={ICON_SIZE} />
        <div class="content">
          <p class="heading" hidden />
          <p class="description" hidden />
          <div class="text" hidden>
            <slot />
          </div>
          <div class="actions" hidden>
            <slot name="actions" />
          </div>
        </div>
        <JlButton class="close" variant="ghost" icon="x" hint={jlText('dismiss')} size="sm" hidden />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.close.events.register('press', () => this.dismiss());
    // The first slotchange can come before onConnect: draw the slots now, then follow the changes.
    this.renderSlots();
    this.on(this._refs.actionsSlot, 'slotchange', () => this.renderSlots());
    this.on(this._refs.textSlot, 'slotchange', () => this.renderSlots());
  }

  /** Empty parts take no room: an alert with only a description has no blank line under it. */
  private renderSlots(): void {
    this._refs.text.hidden = !hasSlotted(this._refs.textSlot);
    this._refs.actions.hidden = !hasSlotted(this._refs.actionsSlot);
  }

  /** The tone's own icon is filled, as a toast's is; an icon of the page's stays as it is drawn. */
  private renderIcon(): void {
    const own = this.icon.get();
    const name = own === '' ? TONE_ICONS[this.tone.get()] : own;
    this._refs.icon.name.set(name === NO_ICON ? '' : name);
    this._refs.icon.filled.set(own === '' && TONE_ICON_FILLED[this.tone.get()]);
    this._refs.icon.hidden = name === NO_ICON;
    this.reflect('has-icon', name !== NO_ICON);
  }
}

JlAlert.register();
