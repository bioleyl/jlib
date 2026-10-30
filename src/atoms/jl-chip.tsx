import { css } from '@jadis/core';
import { Check, X } from 'lucide';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { isActivationKey } from '../lib/surface';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-chip.css?raw';
import { JlIcon } from './jl-icon';

import type { ChipSize } from '../types/jl-chip.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ check: Check, x: X });

export const CHIP_SIZES: readonly ChipSize[] = ['md', 'sm'];

const ICON_SIZES: Record<ChipSize, number> = { md: 14, sm: 12 };
const DISMISS_ICON_SIZES: Record<ChipSize, number> = { md: 13, sm: 12 };
const DISMISS_KEYS = ['Backspace', 'Delete'];
const SELECTED_ICON = 'check';

/**
 * A compact token: a filter people turn on and off (`selectable`), a tag they can take away (`removable`), or a
 * plain label. Fires `change` with the new state when pressed, and `dismiss` when its × is.
 */
export class JlChip extends JlElement {
  static readonly selector = 'jl-chip';

  readonly events = this.useEvents<{ change: boolean; dismiss: undefined }>();

  readonly label = this.useChange('', () => this.renderLabel(), { attribute: 'label' });
  readonly icon = this.useChange('', () => this.renderIcon(), { attribute: 'icon' });
  /** Turns on and off when pressed, like a toggle button. */
  readonly selectable = this.useChange(
    false,
    (value) => {
      this.reflect('selectable', value);
      this.renderInteraction();
      this.renderIcon();
    },
    { attribute: 'selectable' }
  );
  readonly selected = this.useChange(
    false,
    (value) => {
      this.reflect('selected', value);
      this.renderInteraction();
      this.renderIcon();
    },
    { attribute: 'selected' }
  );
  /** Shows an × that fires `dismiss`; the page takes the chip away. */
  readonly removable = this.useChange(
    false,
    (value) => {
      this._refs.dismiss.hidden = !value;
      this.reflect('removable', value);
    },
    { attribute: 'removable' }
  );
  readonly disabled = this.useChange(
    false,
    (value) => {
      this._refs.dismiss.disabled = value;
      this.reflect('disabled', value);
      this.renderInteraction();
    },
    { attribute: 'disabled' }
  );
  readonly size = this.useChange<ChipSize>('md', (value) => this.renderSize(value), {
    attribute: 'size',
    parse: oneOf(CHIP_SIZES, 'md'),
  });

  private readonly _refs = this.useRefs((ref) => ({
    dismiss: ref<HTMLButtonElement>('.dismiss'),
    dismissIcon: ref<JlIcon>('.dismiss jl-icon'),
    icon: ref<JlIcon>('.icon'),
    label: ref('.label'),
    main: ref('.main'),
  }));

  override focus(options?: FocusOptions): void {
    const target = this.selectable.get() ? this._refs.main : this._refs.dismiss;
    target.focus(options);
  }

  /** Turns the chip on or off as a press would, and fires `change`. */
  toggle(): void {
    if (!this.selectable.get() || this.disabled.get()) {
      return;
    }
    this.selected.set(!this.selected.get());
    this.events.emit('change', this.selected.get());
  }

  templateHtml(): Node {
    return (
      <span class="chip" attrs={{ part: 'base' }}>
        <span class="main">
          <JlIcon class="icon" hidden />
          <span class="label" />
          <slot />
        </span>
        <button class="dismiss" type="button" hidden>
          <JlIcon name="x" />
        </button>
      </span>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const main = this._refs.main;
    this.on(main, 'click', () => this.toggle());
    this.on(main, 'keydown', (event) => this.onMainKey(event));
    this.on(this._refs.dismiss, 'click', () => this.dismiss());
  }

  private onMainKey(event: KeyboardEvent): void {
    if (isActivationKey(event)) {
      event.preventDefault();
      this.toggle();
      return;
    }
    if (DISMISS_KEYS.includes(event.key) && this.removable.get()) {
      event.preventDefault();
      this.dismiss();
    }
  }

  private dismiss(): void {
    if (this.disabled.get()) {
      return;
    }
    this.events.emit('dismiss');
  }

  /** A selectable chip is a toggle button; a plain one is only text. */
  private renderInteraction(): void {
    const main = this._refs.main;
    const selectable = this.selectable.get();
    const disabled = this.disabled.get();
    if (!selectable) {
      main.removeAttribute('role');
      main.removeAttribute('tabindex');
      main.removeAttribute('aria-pressed');
      main.removeAttribute('aria-disabled');
      return;
    }
    main.setAttribute('role', 'button');
    main.setAttribute('aria-pressed', String(this.selected.get()));
    main.toggleAttribute('aria-disabled', disabled);
    if (disabled) {
      main.removeAttribute('tabindex');
      return;
    }
    main.tabIndex = 0;
  }

  /** The chip's icon; a selected filter without one shows a check. */
  private renderIcon(): void {
    const icon = this.icon.get();
    const checked = icon === '' && this.selectable.get() && this.selected.get();
    const name = checked ? SELECTED_ICON : icon;
    this._refs.icon.name.set(name);
    this._refs.icon.hidden = name === '';
  }

  protected drawTexts(): void {
    this.renderLabel();
  }

  private renderLabel(): void {
    const label = this.label.get();
    this._refs.label.textContent = label;
    this._refs.dismiss.setAttribute(
      'aria-label',
      label === '' ? jlText('remove') : jlText('removeNamed', { name: label })
    );
  }

  private renderSize(size: ChipSize): void {
    this.reflect('size', size);
    this._refs.icon.size.set(ICON_SIZES[size]);
    this._refs.dismissIcon.size.set(DISMISS_ICON_SIZES[size]);
  }
}

JlChip.register();
