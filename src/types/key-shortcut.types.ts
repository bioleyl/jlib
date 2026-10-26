/** A keyboard shortcut read from text such as "/" or "mod+k": `mod` is ⌘ on a Mac and Ctrl elsewhere. */
export type KeyShortcut = {
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
};
