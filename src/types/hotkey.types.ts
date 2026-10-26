/** A key combination, as `parseHotkey('mod+shift+k')` reads it. */
export type Hotkey = {
  /** The key itself, lower case: `k`, `enter`, `/`. */
  key: string;
  /** ⌘ on Apple, Ctrl elsewhere. */
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
};

/** The parts of a keyboard event a hotkey looks at. */
export type KeyPress = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};
