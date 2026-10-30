import { fuzzyMatch } from './fuzzy';

import type { PaletteCommand, PaletteGroup, PaletteMatch } from '../types/jl-command-palette.types';

/** A match on a keyword counts less than one on the label people read. */
const KEYWORD_WEIGHT = 0.5;
const NO_GROUP = '';
// The page's results come after the commands the search matches, in the page's order.
const RESULT_SCORE = 0;

function keywordScore(query: string, keywords: readonly string[]): number | null {
  const scores = keywords
    .map((keyword) => fuzzyMatch(query, keyword)?.score)
    .filter((score): score is number => score !== undefined);
  return scores.length === 0 ? null : Math.max(...scores) * KEYWORD_WEIGHT;
}

function matchCommand<Id extends string>(query: string, command: PaletteCommand<Id>): PaletteMatch<Id> | null {
  const label = fuzzyMatch(query, command.label);
  if (command.result === true) {
    return { command, positions: label?.positions ?? [], score: RESULT_SCORE };
  }
  const keyword = keywordScore(query, command.keywords ?? []);
  if (label === null && keyword === null) {
    return null;
  }
  if (label === null) {
    return { command, positions: [], score: keyword ?? 0 };
  }
  return { command, positions: label.positions, score: Math.max(label.score, keyword ?? label.score) };
}

/**
 * The commands that match the search, best first; an empty search keeps them all in their order. The label's
 * matched letters come with each, for highlighting; a command found by a keyword only has none.
 */
export function matchCommands<Id extends string>(
  commands: readonly PaletteCommand<Id>[],
  query: string
): PaletteMatch<Id>[] {
  const matches = commands
    .map((command) => matchCommand(query, command))
    .filter((match): match is PaletteMatch<Id> => match !== null);
  if (query.trim() === '') {
    return matches;
  }
  // Array sort is stable: equal scores keep the order the page gave.
  return matches.sort((a, b) => b.score - a.score);
}

/** The matches under their group headings, groups in the order their first command comes. */
export function groupMatches<Id extends string>(matches: readonly PaletteMatch<Id>[]): PaletteGroup<Id>[] {
  const groups = new Map<string, PaletteMatch<Id>[]>();
  for (const match of matches) {
    const label = match.command.group ?? NO_GROUP;
    groups.set(label, [...(groups.get(label) ?? []), match]);
  }
  return [...groups].map(([label, grouped]) => ({ label, matches: grouped }));
}
