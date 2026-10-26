import { css } from '@jadis/core';

import { AVATAR_SIZES, JlAvatar } from '../atoms/jl-avatar';
import { JlElement } from '../base/jl-element';
import { jsonOf, oneOf } from '../lib/attributes';
import { splitVisible } from '../lib/avatar';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-avatar-group.css?raw';

import type { AvatarItem, AvatarSize } from '../types/jl-avatar.types';

const NAME_SEPARATOR = ', ';

/**
 * A few people at a glance: their avatars overlap, each ringed with the surface colour. Past `max`, a last
 * avatar counts the others ("+3") and names them in its tooltip.
 */
export class JlAvatarGroup extends JlElement {
  static readonly selector = 'jl-avatar-group';

  /** The people, in order: `[{ "name": "Ada Lovelace", "src": "/ada.jpg" }]`. */
  readonly items = this.useChange<AvatarItem[]>([], () => this.render(), {
    attribute: 'items',
    parse: jsonOf<AvatarItem[]>([]),
  });
  /** How many avatars show before the count; 0 shows them all. */
  readonly max = this.useChange(0, () => this.render(), { attribute: 'max' });
  readonly size = this.useChange<AvatarSize>(
    'md',
    (value) => {
      this.reflect('size', value);
      this.render();
    },
    { attribute: 'size', parse: oneOf(AVATAR_SIZES, 'md') }
  );

  private readonly _refs = this.useRefs((ref) => ({ group: ref('.group') }));

  templateHtml(): Node {
    // biome-ignore lint/a11y/useSemanticElements: a fieldset groups form controls, not pictures of people
    return <div class="group" role="group" attrs={{ part: 'base' }} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private render(): void {
    const items = this.items.get().filter((item) => typeof item?.name === 'string');
    const { shown, hidden } = splitVisible(items, this.max.get());
    const size = this.size.get();
    const avatars = shown.map((item) => (
      <JlAvatar name={item.name} src={item.src ?? ''} size={size} title={item.name} />
    ));
    const more = hidden.length === 0 ? [] : [this.countAvatar(hidden, size)];
    this._refs.group.replaceChildren(...avatars, ...more);
    this._refs.group.setAttribute('aria-label', `${items.length} ${items.length === 1 ? 'person' : 'people'}`);
  }

  private countAvatar(hidden: readonly AvatarItem[], size: AvatarSize): JlAvatar {
    const names = hidden.map((item) => item.name).join(NAME_SEPARATOR);
    const avatar: JlAvatar = <JlAvatar class="more" size={size} label={`${hidden.length} more: ${names}`} />;
    avatar.title = names;
    avatar.textContent = `+${hidden.length}`;
    return avatar;
  }
}

JlAvatarGroup.register();
