export type PaletteCommand = {
  id: string;
  label: string;
  /** The heading the command is listed under. */
  group?: string;
  icon?: string;
  /** Keys shown beside it, joined by `+`: `mod+shift+p` (`mod` is ⌘ on Apple, Ctrl elsewhere). */
  shortcut?: string;
  /** Other words that find it: `["preferences", "options"]` for "Settings". */
  keywords?: string[];
};

/** A command that matches the search, with the places of the matched letters in its label. */
export type PaletteMatch = {
  command: PaletteCommand;
  score: number;
  positions: number[];
};

/** Commands under one heading, in the order they are listed. */
export type PaletteGroup = {
  label: string;
  matches: PaletteMatch[];
};
