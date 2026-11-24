import type { TextMatch, TextMatchPart } from '../types/option-filter.types';

/** How well a label matches: at its start, at the start of one of its words, or anywhere inside. */
const RANK = { anywhere: 2, labelStart: 0, wordStart: 1 } as const;

const DIACRITICS = /\p{Diacritic}/gu;
const WORD_CHARACTER = /[\p{L}\p{N}]/u;
const SPACES = /\s+/u;

/** One character as matching sees it: lower case, without its accents ("É" gives "e"). */
export const foldCharacter = (character: string): string =>
  character.normalize('NFD').replace(DIACRITICS, '').toLowerCase();

/** A text as matching sees it: "Crème Brûlée" gives "creme brulee". */
export const foldText = (text: string): string => Array.from(text, foldCharacter).join('');

/** Each character of a text, with where it sits in the text and in its folded form. */
type FoldedPiece = { start: number; end: number; foldedStart: number; foldedEnd: number };

function foldPieces(text: string): FoldedPiece[] {
  const pieces: FoldedPiece[] = [];
  const offsets = { folded: 0, original: 0 };
  for (const character of text) {
    const folded = foldCharacter(character);
    pieces.push({
      end: offsets.original + character.length,
      foldedEnd: offsets.folded + folded.length,
      foldedStart: offsets.folded,
      start: offsets.original,
    });
    offsets.original += character.length;
    offsets.folded += folded.length;
  }
  return pieces;
}

/** The search's words as matching sees them: what was typed, folded, cut at its spaces. */
const searchWords = (query: string): string[] =>
  foldText(query)
    .split(SPACES)
    .filter((word) => word !== '');

/** A range of a text's folded form in the text's own indexes; an accent written as a mark goes with its letter. */
function originalRange(pieces: readonly FoldedPiece[], foldedStart: number, foldedEnd: number): TextMatch | null {
  const first = pieces.find((piece) => piece.foldedEnd > foldedStart);
  const last = pieces.findLast((piece) => piece.foldedStart < foldedEnd || piece.foldedEnd === foldedEnd);
  if (first === undefined || last === undefined) {
    return null;
  }
  return { end: last.end, start: first.start };
}

/** Ranges in order, those that overlap or touch made one. */
function mergedRanges(ranges: readonly TextMatch[]): TextMatch[] {
  const merged: TextMatch[] = [];
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1);
    if (last !== undefined && range.start <= last.end) {
      merged[merged.length - 1] = { end: Math.max(last.end, range.end), start: last.start };
      continue;
    }
    merged.push(range);
  }
  return merged;
}

/**
 * Where each word of a search occurs in a text, ignoring case and accents, in the text's own indexes: at the start of
 * one of the text's words when it is there, else where it first occurs. In order, those that overlap or touch made
 * one; empty when no word occurs, or the search has none. A page that finds options by words (`filter="none"`) gets
 * each of them marked, wherever they are in the label.
 */
export function findMatches(text: string, query: string): TextMatch[] {
  const folded = foldText(text);
  const pieces = foldPieces(text);
  const ranges = searchWords(query).flatMap((word) => {
    const at = wordIndex(folded, word);
    const range = at < 0 ? null : originalRange(pieces, at, at + word.length);
    return range === null ? [] : [range];
  });
  return mergedRanges(ranges);
}

/** A text cut around the words of a search it holds, so that they can be drawn highlighted. */
export function matchParts(text: string, query: string): TextMatchPart[] {
  const matches = findMatches(text, query);
  const parts = matches.flatMap((match, index) => [
    { matched: false, text: text.slice(matches[index - 1]?.end ?? 0, match.start) },
    { matched: true, text: text.slice(match.start, match.end) },
  ]);
  const rest = { matched: false, text: text.slice(matches.at(-1)?.end ?? 0) };
  return [...parts, rest].filter((part) => part.text !== '');
}

const startsAWord = (folded: string, index: number): boolean =>
  index === 0 || !WORD_CHARACTER.test(folded.charAt(index - 1));

/** Every place a folded word occurs in a folded text, in order. */
function occurrences(folded: string, word: string): number[] {
  const found: number[] = [];
  for (let at = folded.indexOf(word); at >= 0; at = folded.indexOf(word, at + 1)) {
    found.push(at);
  }
  return found;
}

/** Where a folded word occurs in a folded text: at the start of one of its words if it can, else first; -1 if not. */
function wordIndex(folded: string, word: string): number {
  const found = occurrences(folded, word);
  return found.find((index) => startsAWord(folded, index)) ?? found[0] ?? -1;
}

/** How well a label matches a folded search, or null when it does not contain it. */
function rankOf(label: string, needle: string): number | null {
  const folded = foldText(label);
  const first = folded.indexOf(needle);
  if (first < 0) {
    return null;
  }
  if (first === 0) {
    return RANK.labelStart;
  }
  const indexes = Array.from(folded, (_, index) => index).filter((index) => folded.startsWith(needle, index));
  return indexes.some((index) => startsAWord(folded, index)) ? RANK.wordStart : RANK.anywhere;
}

/**
 * The options whose label contains the search, ignoring case and accents: those that start with it first, then
 * those with a word that starts with it, then the rest, each group in its original order. An empty search keeps
 * every option.
 */
export function filterOptions<Option extends { label: string }>(
  options: readonly Option[],
  query: string
): Option[] {
  const needle = foldText(query.trim());
  if (needle === '') {
    return [...options];
  }
  return options
    .map((option, index) => ({ index, option, rank: rankOf(option.label, needle) }))
    .filter((entry): entry is { index: number; option: Option; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.option);
}

/**
 * The index of the next option that can be chosen, going down (1) or up (-1) from the current one and wrapping
 * around the ends; from -1 (none active) it starts at the first or the last. -1 when none can be chosen.
 */
export function nextEnabledIndex(
  options: readonly { disabled?: boolean }[],
  current: number,
  direction: 1 | -1
): number {
  const count = options.length;
  const start = current < 0 && direction < 0 ? count : current;
  const steps = Array.from(
    { length: count },
    (_, step) => (((start + direction * (step + 1)) % count) + count) % count
  );
  return steps.find((index) => options[index]?.disabled !== true) ?? -1;
}

/** The first (1) or last (-1) option that can be chosen; -1 when none can. */
export const edgeEnabledIndex = (options: readonly { disabled?: boolean }[], from: 1 | -1): number =>
  nextEnabledIndex(options, -1, from);
