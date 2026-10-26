/** How a platform writes modifier keys: Apple's symbols (⌘ ⇧ ⌥) or the names of other systems (Ctrl, Shift). */
export type KeyPlatform = 'apple' | 'other';

/** One key as a keycap draws it (`label`: ⌘) and as a screen reader says it (`name`: Command). */
export type Keycap = {
  label: string;
  name: string;
};
