import { css } from '@jadis/core';
import { User } from 'lucide';

import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { initialsOf, pickStable } from '../lib/avatar';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { hasSlotted } from '../lib/slots';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-avatar.css?raw';
import { JlIcon } from './jl-icon';

import type { AvatarShape, AvatarSize, AvatarStatus } from '../types/jl-avatar.types';
import type { Tone } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ user: User });

export const AVATAR_SIZES: readonly AvatarSize[] = ['md', 'sm', 'lg', 'xl'];
export const AVATAR_SHAPES: readonly AvatarShape[] = ['circle', 'square'];
export const AVATAR_STATUSES: readonly AvatarStatus[] = ['online', 'busy', 'away', 'offline'];

/** The soft tones a name picks its background from; an avatar without a name is neutral. */
const NAME_TONES: readonly [Tone, ...Tone[]] = ['accent', 'ok', 'warn', 'danger', 'neutral'];
const NO_NAME_TONE: Tone = 'neutral';

const STATUS_LABELS: Record<AvatarStatus, string> = {
  away: 'away',
  busy: 'busy',
  offline: 'offline',
  online: 'online',
};

const ICON_SIZES: Record<AvatarSize, number> = { lg: 20, md: 16, sm: 13, xl: 28 };
const FALLBACK_ICON = 'user';

/**
 * A person or a team: their picture, or their initials on a colour the name always picks. A `status` dot tells
 * their presence. Slotted content (an icon, a count) replaces the initials.
 */
export class JlAvatar extends JlElement {
  static readonly selector = 'jl-avatar';

  /** The person's name: their initials, the background colour, and what screen readers say. */
  readonly name = this.useChange('', () => this.renderName(), { attribute: 'name' });
  /** A picture; the initials show while it loads and when it cannot. */
  readonly src = this.useChange('', (value) => this.loadImage(value), { attribute: 'src' });
  readonly size = this.useChange<AvatarSize>('md', (value) => this.renderSize(value), {
    attribute: 'size',
    parse: oneOf(AVATAR_SIZES, 'md'),
  });
  readonly shape = this.useChange<AvatarShape>('circle', (value) => this.reflect('shape', value), {
    attribute: 'shape',
    parse: oneOf(AVATAR_SHAPES, 'circle'),
  });
  readonly status = this.useChange<AvatarStatus | ''>('', (value) => this.renderStatus(value), {
    attribute: 'status',
    parse: oneOf<AvatarStatus | ''>(['', ...AVATAR_STATUSES], ''),
  });
  /** What screen readers say, when it should differ from the name. */
  readonly label = this.useChange('', () => this.renderLabel(), { attribute: 'label' });

  private readonly _image = { loaded: false };

  private readonly _refs = this.useRefs((ref) => ({
    avatar: ref('.avatar'),
    icon: ref<JlIcon>('.fallback'),
    image: ref('img'),
    initials: ref('.initials'),
    slot: ref('slot'),
    status: ref('.status'),
  }));

  templateHtml(): Node {
    return (
      <span class="avatar" role="img" attrs={{ part: 'base' }}>
        <span class="face">
          <img alt="" hidden onLoad={() => this.settleImage(true)} onError={() => this.settleImage(false)} />
          <span class="initials" aria-hidden="true" />
          <JlIcon class="fallback" name={FALLBACK_ICON} hidden />
          <slot />
        </span>
        <span class="status" hidden />
      </span>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    // The first slotchange can come before onConnect: draw the face now, then follow the changes.
    this.renderFace();
    this.on(this._refs.slot, 'slotchange', () => this.renderFace());
  }

  private loadImage(src: string): void {
    this._image.loaded = false;
    setOrRemove(this._refs.image, 'src', src);
    this.renderFace();
  }

  private settleImage(loaded: boolean): void {
    this._image.loaded = loaded && this.src.get() !== '';
    this.renderFace();
  }

  private renderName(): void {
    const name = this.name.get();
    this._refs.initials.textContent = initialsOf(name);
    this.reflect('tone', name.trim() === '' ? NO_NAME_TONE : pickStable(name.trim(), NAME_TONES));
    this.renderFace();
    this.renderLabel();
  }

  /** The picture once it loaded; otherwise slotted content, the initials, or a person icon, in that order. */
  private renderFace(): void {
    const image = this._image.loaded;
    const custom = hasSlotted(this._refs.slot);
    const hasInitials = this._refs.initials.textContent !== '';
    this._refs.image.hidden = !image;
    this._refs.slot.hidden = image;
    this._refs.initials.hidden = image || custom || !hasInitials;
    this._refs.icon.hidden = image || custom || hasInitials;
    this.reflect('has-image', image);
  }

  private renderSize(size: AvatarSize): void {
    this.reflect('size', size);
    this._refs.icon.size.set(ICON_SIZES[size]);
  }

  private renderStatus(status: AvatarStatus | ''): void {
    this._refs.status.hidden = status === '';
    this.reflect('status', status);
    this.renderLabel();
  }

  private renderLabel(): void {
    const name = this.label.get() || this.name.get().trim();
    const status = this.status.get();
    const spoken = status === '' ? name : [name, STATUS_LABELS[status]].filter((part) => part !== '').join(', ');
    const avatar = this._refs.avatar;
    setOrRemove(avatar, 'aria-label', spoken);
    // Without a name the avatar is decoration: screen readers skip it.
    avatar.setAttribute('role', spoken === '' ? 'presentation' : 'img');
  }
}

JlAvatar.register();
