import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { CONTROL_SIZES } from '../lib/options';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-button.css?raw';
import { JlIcon } from './jl-icon';
import { JlSpinner } from './jl-spinner';

import type { ButtonType, ButtonVariant } from '../types/jl-button.types';
import type { ControlSize } from '../types/options.types';

export const BUTTON_VARIANTS: readonly ButtonVariant[] = ['secondary', 'primary', 'ghost', 'danger'];
export const BUTTON_TYPES: readonly ButtonType[] = ['button', 'submit', 'reset'];

const ICON_SIZES: Record<ControlSize, number> = { lg: 18, md: 16, sm: 14 };

/**
 * A button. Its text is the `label` (or the slotted content); with only an `icon`, its `hint` names it.
 * Listen to `press`: it fires only while the button can be pressed. `type="submit"` submits the surrounding form.
 */
export class JlButton extends JlElement {
  static readonly selector = 'jl-button';
  static readonly formAssociated = true;

  readonly events = this.useEvents<{ press: undefined }>();

  readonly label = this.useChange('', () => this.renderLabel(), { attribute: 'label' });
  readonly icon = this.useChange('', (name) => this.renderIcon(this._refs.start, name), { attribute: 'icon' });
  readonly iconEnd = this.useChange('', (name) => this.renderIcon(this._refs.end, name), {
    attribute: 'icon-end',
  });
  readonly variant = this.useChange<ButtonVariant>('secondary', (value) => this.reflect('variant', value), {
    attribute: 'variant',
    parse: oneOf(BUTTON_VARIANTS, 'secondary'),
  });
  readonly size = this.useChange<ControlSize>('md', (value) => this.renderSize(value), {
    attribute: 'size',
    parse: oneOf(CONTROL_SIZES, 'md'),
  });
  readonly type = this.useChange<ButtonType>('button', () => undefined, {
    attribute: 'type',
    parse: oneOf(BUTTON_TYPES, 'button'),
  });
  readonly disabled = this.useChange(
    false,
    (value) => {
      this._refs.button.disabled = value;
      this.reflect('disabled', value);
    },
    { attribute: 'disabled' }
  );
  /** Shows a spinner in place of the icon and ignores presses, while the work it started runs. */
  readonly loading = this.useChange(
    false,
    (value) => {
      this._refs.spinner.hidden = !value;
      this._refs.start.hidden = value || this.icon.get() === '';
      this._refs.button.toggleAttribute('aria-busy', value);
      this.reflect('loading', value);
    },
    { attribute: 'loading' }
  );
  /** The tooltip; also the button's name for screen readers when it only has an icon. */
  readonly hint = this.useChange('', () => this.renderLabel(), { attribute: 'hint' });
  /** Takes the whole width of its container. */
  readonly block = this.useChange(false, (value) => this.reflect('block', value), { attribute: 'block' });

  private readonly _internals = this.attachInternals();

  private readonly _refs = this.useRefs((ref) => ({
    button: ref('button'),
    end: ref<JlIcon>('.end'),
    label: ref('.text'),
    slot: ref('slot'),
    spinner: ref<JlSpinner>('jl-spinner'),
    start: ref<JlIcon>('.start'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.button.focus(options);
  }

  templateHtml(): Node {
    return (
      <button type="button" attrs={{ part: 'base' }}>
        <JlSpinner hidden />
        <JlIcon class="start" hidden />
        <span class="text" />
        <slot />
        <JlIcon class="end" hidden />
      </button>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.slot, 'slotchange', () => this.renderLabel());
    this.on(this._refs.button, 'click', () => {
      if (this.disabled.get() || this.loading.get()) {
        return;
      }
      this.events.emit('press');
      this.actOnForm();
    });
  }

  private actOnForm(): void {
    const form = this._internals.form;
    if (form === null) {
      return;
    }
    const actions: Record<ButtonType, () => void> = {
      button: () => undefined,
      reset: () => form.reset(),
      submit: () => form.requestSubmit(),
    };
    actions[this.type.get()]();
  }

  private renderIcon(icon: JlIcon, name: string): void {
    icon.name.set(name);
    icon.hidden = name === '' || (icon === this._refs.start && this.loading.get());
    this.renderLabel();
  }

  private renderSize(size: ControlSize): void {
    this.reflect('size', size);
    this._refs.start.size.set(ICON_SIZES[size]);
    this._refs.end.size.set(ICON_SIZES[size]);
    this._refs.spinner.size.set(ICON_SIZES[size]);
  }

  private hasSlottedContent(): boolean {
    return this._refs.slot
      .assignedNodes()
      .some((node) => node.textContent?.trim() !== '' || node instanceof Element);
  }

  private renderLabel(): void {
    const label = this.label.get();
    const hint = this.hint.get();
    const iconOnly = label === '' && !this.hasSlottedContent();
    this._refs.label.textContent = label;
    this._refs.label.hidden = label === '';
    this._refs.button.title = hint;
    this.reflect('icon-only', iconOnly);
    if (iconOnly && hint !== '') {
      this._refs.button.setAttribute('aria-label', hint);
      return;
    }
    this._refs.button.removeAttribute('aria-label');
  }
}

JlButton.register();
