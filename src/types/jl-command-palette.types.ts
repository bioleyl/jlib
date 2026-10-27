export type PaletteCommand = {
  id: string;
  label: string;
  /** The heading the command is listed under. */
  group?: string;
  icon?: string;
  /** What it is, beside its label and quieter: a record's type, a person's username. Tells apart two of one name. */
  description?: string;
  /** Keys shown beside it, joined by `+`: `mod+shift+p` (`mod` is ⌘ on Apple, Ctrl elsewhere). */
  shortcut?: string;
  /** Other words that find it: `["preferences", "options"]` for "Settings". */
  keywords?: string[];
  /**
   * Found by the page for what was typed (a record, a person, "Open" with the ID pasted): listed whatever the
   * search, since the page chose it already, after the commands the search matches.
   */
  result?: boolean;
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
