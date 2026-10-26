import type { FuzzyMatch, TextSegment } from '../types/fuzzy.types';

/**
 * What a matched letter is worth. Letters next to each other and letters that start a word count most, so "ofi"
 * finds "Open file" before "Profile", and "set" puts "Settings" before "Reset".
 */
export const FUZZY_SCORE = {
  /** A letter right after the previous matched one. */
  contiguous: 6,
  /** Taken off for each letter skipped between two matched ones. */
  gap: 1,
  /** Each matched letter. */
  match: 1,
  /** The text's very first letter, on top of the word start. */
  textStart: 4,
  /** A letter that starts a word: after a space, a dash, a slash…, or a capital in camelCase. */
  wordStart: 8,
} as const;

const NO_MATCH = Number.NEGATIVE_INFINITY;
const NO_INDEX = -1;
const WHITESPACE = /\s+/g;
const SEPARATORS = new Set([' ', '-', '_', '/', '.', ':', '(', '[', '\\']);

const isLower = (char: string): boolean => char !== char.toUpperCase() && char === char.toLowerCase();
const isUpper = (char: string): boolean => char !== char.toLowerCase() && char === char.toUpperCase();

/** Whether the letter at `index` starts a word of the text. */
export function isWordStart(text: string, index: number): boolean {
  if (index === 0) {
    return true;
  }
  const previous = text[index - 1] ?? '';
  const current = text[index] ?? '';
  return SEPARATORS.has(previous) || (isLower(previous) && isUpper(current));
}

function positionBonus(text: string, index: number): number {
  const wordStart = isWordStart(text, index) ? FUZZY_SCORE.wordStart : 0;
  const textStart = index === 0 ? FUZZY_SCORE.textStart : 0;
  return FUZZY_SCORE.match + wordStart + textStart;
}

type Row = { scores: Float64Array; from: Int32Array };

function firstRow(letter: string, haystack: readonly string[], text: string): Row {
  const scores = new Float64Array(haystack.length).fill(NO_MATCH);
  for (const [index, char] of haystack.entries()) {
    if (char === letter) {
      scores[index] = positionBonus(text, index);
    }
  }
  return { from: new Int32Array(haystack.length).fill(NO_INDEX), scores };
}

/**
 * The best score of each place for the next letter, knowing the previous row. A gapped step costs `gap` per
 * skipped letter: the best gapped predecessor is kept as a running maximum, so a row costs one pass.
 */
function nextRow(previous: Row, letter: string, haystack: readonly string[], text: string): Row {
  const scores = new Float64Array(haystack.length).fill(NO_MATCH);
  const from = new Int32Array(haystack.length).fill(NO_INDEX);
  const gapped = { index: NO_INDEX, value: NO_MATCH };
  for (const [index, char] of haystack.entries()) {
    const candidate = index - 2;
    const candidateValue =
      candidate >= 0 ? (previous.scores[candidate] ?? NO_MATCH) + FUZZY_SCORE.gap * candidate : NO_MATCH;
    if (candidateValue > gapped.value) {
      gapped.value = candidateValue;
      gapped.index = candidate;
    }
    if (char !== letter) {
      continue;
    }
    const contiguous = index >= 1 ? (previous.scores[index - 1] ?? NO_MATCH) + FUZZY_SCORE.contiguous : NO_MATCH;
    const afterGap = gapped.value - FUZZY_SCORE.gap * (index - 1);
    const best = Math.max(contiguous, afterGap);
    if (best === NO_MATCH) {
      continue;
    }
    scores[index] = best + positionBonus(text, index);
    from[index] = contiguous >= afterGap ? index - 1 : gapped.index;
  }
  return { from, scores };
}

function bestEnd(row: Row): number {
  const best = { index: NO_INDEX, value: NO_MATCH };
  for (const [index, value] of row.scores.entries()) {
    if (value > best.value) {
      best.value = value;
      best.index = index;
    }
  }
  return best.index;
}

function backtrack(rows: readonly Row[], end: number): number[] {
  const positions: number[] = [];
  const cursor = { index: end };
  for (const row of [...rows].reverse()) {
    positions.unshift(cursor.index);
    cursor.index = row.from[cursor.index] ?? NO_INDEX;
  }
  return positions;
}

/**
 * Whether the letters of the query appear in the text in order (spaces ignored, any case), and how well: the
 * best placement by contiguity and word starts. `null` when they do not; an empty query matches with 0.
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const needle = query.replace(WHITESPACE, '').toLowerCase().split('');
  const haystack = text.split('').map((char) => char.toLowerCase());
  const [first, ...rest] = needle;
  if (first === undefined) {
    return { positions: [], score: 0 };
  }
  if (needle.length > haystack.length) {
    return null;
  }
  const rows = [firstRow(first, haystack, text)];
  for (const letter of rest) {
    const previous = rows[rows.length - 1] as Row;
    rows.push(nextRow(previous, letter, haystack, text));
  }
  const last = rows[rows.length - 1] as Row;
  const end = bestEnd(last);
  if (end === NO_INDEX) {
    return null;
  }
  return { positions: backtrack(rows, end), score: last.scores[end] ?? 0 };
}

/** The text cut into runs of matched and unmatched letters, for drawing the matches in `<mark>`. */
export function highlightSegments(text: string, positions: readonly number[]): TextSegment[] {
  const matched = new Set(positions);
  const segments: TextSegment[] = [];
  for (const [index, char] of text.split('').entries()) {
    const marked = matched.has(index);
    const last = segments[segments.length - 1];
    if (last !== undefined && last.marked === marked) {
      last.text += char;
      continue;
    }
    segments.push({ marked, text: char });
  }
  return segments;
}
