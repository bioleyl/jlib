/** Where a search was found in a text: from `start` (included) to `end` (excluded), in UTF-16 indexes. */
export type TextMatch = { start: number; end: number };

/** A piece of a text, matched by the search or not: the text drawn with its match highlighted. */
export type TextMatchPart = { text: string; matched: boolean };
