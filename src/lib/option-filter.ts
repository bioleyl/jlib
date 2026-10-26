import type { TextMatch, TextMatchPart } from '../types/option-filter.types';

/** How well a label matches: at its start, at the start of one of its words, or anywhere inside. */
const RANK = { anywhere: 2, labelStart: 0, wordStart: 1 } as const;

const DIACRITICS = /\p{Diacritic}/gu;
const WORD_CHARACTER = /[\p{L}\p{N}]/u;

/** One character as matching sees it: lower case, without its accents ("É" gives "e"). */
const foldCharacter = (character: string): string =>
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

/**
 * Where a search first occurs in a text, ignoring case and accents, in the text's own indexes; null when it does
 * not, or when the search is empty.
 */
export function findMatch(text: string, query: string): TextMatch | null {
  const needle = foldText(query.trim());
  if (needle === '') {
    return null;
  }
  const at = foldText(text).indexOf(needle);
  if (at < 0) {
    return null;
  }
  const end = at + needle.length;
  const pieces = foldPieces(text);
  const first = pieces.find((piece) => piece.foldedEnd > at);
  // Accents written as separate marks fold to nothing: they belong to the letter before them.
  const last = pieces.findLast((piece) => piece.foldedStart < end || piece.foldedEnd === end);
  if (first === undefined || last === undefined) {
    return null;
  }
  return { end: last.end, start: first.start };
}

/** A text cut around its match, so the matched piece can be drawn highlighted. */
export function matchParts(text: string, query: string): TextMatchPart[] {
  const match = findMatch(text, query);
  if (match === null) {
    return text === '' ? [] : [{ matched: false, text }];
  }
  const parts: TextMatchPart[] = [
    { matched: false, text: text.slice(0, match.start) },
    { matched: true, text: text.slice(match.start, match.end) },
    { matched: false, text: text.slice(match.end) },
  ];
  return parts.filter((part) => part.text !== '');
}

const startsAWord = (folded: string, index: number): boolean =>
  index === 0 || !WORD_CHARACTER.test(folded.charAt(index - 1));

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
