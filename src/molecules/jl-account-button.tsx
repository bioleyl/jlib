import { css } from '@jadis/core';

import { JlAvatar } from '../atoms/jl-avatar';
import { JlElement } from '../base/jl-element';
import { setOrRemove } from '../lib/dom';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-account-button.css?raw';

/**
 * The person signed in, where the frame of an app shows them (the foot of the side nav, a phone's top bar): their
 * avatar, their name, and a line under it such as their role. With an `href` it is a link to their account, else a
 * button that fires `press` (to open a menu). `compact` keeps the avatar alone, the name as its tooltip; `current`
 * marks it while their account page is the one shown.
 */
export class JlAccountButton extends JlElement {
  static readonly selector = 'jl-account-button';

  readonly events = this.useEvents<{ press: undefined }>();

  readonly name = this.useChange(
    '',
    (value) => {
      this._refs.avatar.name.set(value);
      this._refs.name.textContent = value;
      this.renderLabel();
    },
    { attribute: 'name' }
  );
  /** The line under the name: their role, their company. */
  readonly description = this.useChange(
    '',
    (value) => {
      this._refs.description.textContent = value;
      this._refs.description.hidden = value === '';
      this.renderLabel();
    },
    { attribute: 'description' }
  );
  /** Their picture; their initials without it. */
  readonly src = this.useChange('', (value) => this._refs.avatar.src.set(value), { attribute: 'src' });
  /** Their account's address: the button becomes a link. */
  readonly href = this.useChange('', () => this.renderLink(), { attribute: 'href' });
  /** The avatar alone. */
  readonly compact = this.useChange(false, (value) => this.reflect('compact', value), { attribute: 'compact' });
  /** Their account page is the one shown: marked as the side nav marks its current place. */
  readonly current = this.useChange(false, (value) => this.renderCurrent(value), { attribute: 'current' });

  private readonly _refs = this.useRefs((ref) => ({
    avatar: ref<JlAvatar>('jl-avatar'),
    button: ref('button'),
    content: ref('.content'),
    description: ref('.description'),
    link: ref<HTMLAnchorElement>('a'),
    name: ref('.name'),
  }));

  override focus(options?: FocusOptions): void {
    this.control().focus(options);
  }

  templateHtml(): Node {
    // The name is written beside it: the avatar says nothing more to screen readers.
    const avatar = <JlAvatar size="md" />;
    (avatar as HTMLElement).setAttribute('aria-hidden', 'true');
    return (
      <>
        <button type="button" class="base" attrs={{ part: 'base' }}>
          <span class="content">
            {avatar}
            <span class="text">
              <span class="name" />
              <span class="description" hidden />
            </span>
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
    this.on(this._refs.button, 'click', () => this.events.emit('press'));
    this.on(this._refs.link, 'click', () => this.events.emit('press'));
  }

  private control(): HTMLElement {
    return this.href.get() === '' ? this._refs.button : this._refs.link;
  }

  /** Moves the content into the link or back into the button. */
  private renderLink(): void {
    const { button, content, link } = this._refs;
    const href = this.href.get();
    this.control().append(content);
    button.hidden = href !== '';
    link.hidden = href === '';
    setOrRemove(link, 'href', href);
  }

  private renderCurrent(current: boolean): void {
    this.reflect('current', current);
    for (const control of [this._refs.button, this._refs.link]) {
      setOrRemove(control, 'aria-current', current ? 'page' : '');
    }
  }

  /** Its name for screen readers and its tooltip: the name, then the line under it. */
  private renderLabel(): void {
    const label = [this.name.get(), this.description.get()].filter((part) => part !== '').join(', ');
    for (const control of [this._refs.button, this._refs.link]) {
      setOrRemove(control, 'title', this.name.get());
      setOrRemove(control, 'aria-label', label);
    }
  }
}

JlAccountButton.register();
