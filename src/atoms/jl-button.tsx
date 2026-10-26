import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
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
const NEW_TAB = '_blank';
/** A page opened in a new tab gets no handle on this one. */
const SAFE_REL = 'noopener noreferrer';

/**
 * A button. Its text is the `label` (or the slotted content); with only an `icon`, its `hint` names it.
 * Listen to `press`: it fires only while the button can be pressed. `type="submit"` submits the surrounding form.
 * With an `href` it is a link that looks the same: it opens the address, and `press` still fires.
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
      this.renderLink();
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
      this._refs.link.toggleAttribute('aria-busy', value);
      this.reflect('loading', value);
    },
    { attribute: 'loading' }
  );
  /** The tooltip; also the button's name for screen readers when it only has an icon. */
  readonly hint = this.useChange('', () => this.renderLabel(), { attribute: 'hint' });
  /** Takes the whole width of its container. */
  readonly block = this.useChange(false, (value) => this.reflect('block', value), { attribute: 'block' });
  /** An address to open: the button becomes a link, for navigation that should open in a new tab when asked. */
  readonly href = this.useChange('', () => this.renderLink(), { attribute: 'href' });
  /** Where the link opens (`_blank` for a new tab), with an `href`. */
  readonly target = this.useChange('', () => this.renderLink(), { attribute: 'target' });

  private readonly _internals = this.attachInternals();

  private readonly _refs = this.useRefs((ref) => ({
    button: ref('button'),
    content: ref('.content'),
    end: ref<JlIcon>('.end'),
    label: ref('.text'),
    link: ref<HTMLAnchorElement>('a'),
    slot: ref('slot'),
    spinner: ref<JlSpinner>('jl-spinner'),
    start: ref<JlIcon>('.start'),
  }));

  override focus(options?: FocusOptions): void {
    this.control().focus(options);
  }

  templateHtml(): Node {
    return (
      <>
        <button class="base" type="button" attrs={{ part: 'base' }}>
          <span class="content">
            <JlSpinner hidden />
            <JlIcon class="start" hidden />
            <span class="text" />
            <slot />
            <JlIcon class="end" hidden />
          </span>
        </button>
        {/* biome-ignore lint/a11y/useValidAnchor lint/a11y/useAnchorContent: the href and the content arrive with the href input */}
        <a class="base" hidden attrs={{ part: 'base' }} />
      </>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.slot, 'slotchange', () => this.renderLabel());
    this.on(this._refs.button, 'click', () => {
      if (!this.canPress()) {
        return;
      }
      this.events.emit('press');
      this.actOnForm();
    });
    this.on(this._refs.link, 'click', (event) => {
      if (!this.canPress()) {
        event.preventDefault();
        return;
      }
      this.events.emit('press');
    });
  }

  private canPress(): boolean {
    return !(this.disabled.get() || this.loading.get());
  }

  /** The element that takes focus and clicks: the link with an `href`, the button otherwise. */
  private control(): HTMLElement {
    return this.href.get() === '' ? this._refs.button : this._refs.link;
  }

  /**
   * Moves the content into the link or back into the button. A disabled link loses its address, so it can be
   * neither followed nor focused, and says it is disabled.
   */
  private renderLink(): void {
    const { button, content, link } = this._refs;
    const href = this.href.get();
    const isLink = href !== '';
    const target = this.target.get();
    const off = isLink && this.disabled.get();
    this.control().append(content);
    button.hidden = isLink;
    link.hidden = !isLink;
    setOrRemove(link, 'href', isLink && !off ? href : '');
    setOrRemove(link, 'target', target);
    setOrRemove(link, 'rel', target === NEW_TAB ? SAFE_REL : '');
    setOrRemove(link, 'role', off ? 'link' : '');
    setOrRemove(link, 'aria-disabled', off ? 'true' : '');
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
    this.reflect('icon-only', iconOnly);
    for (const control of [this._refs.button, this._refs.link]) {
      setOrRemove(control, 'title', hint);
      setOrRemove(control, 'aria-label', iconOnly ? hint : '');
    }
  }
}

JlButton.register();
