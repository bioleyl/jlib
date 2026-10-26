/** How well a search matches a text, and which characters of the text it matched. */
export type FuzzyMatch = {
  score: number;
  positions: number[];
};

/** A run of letters of a text, matched by the search or not. */
export type TextSegment = {
  text: string;
  marked: boolean;
};
