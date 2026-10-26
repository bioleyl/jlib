/** The four sizes of an avatar: 24, 32, 40 and 56 pixels. */
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export type AvatarShape = 'circle' | 'square';

/** A person's presence, shown as a dot at the avatar's corner. */
export type AvatarStatus = 'online' | 'busy' | 'away' | 'offline';

/** One person of an avatar group. */
export type AvatarItem = {
  name: string;
  src?: string;
};
