import { describe, expect, it } from 'vitest';

import { FUZZY_SCORE, fuzzyMatch, highlightSegments, isWordStart } from '../src/lib/fuzzy';
import { groupMatches, matchCommands } from '../src/lib/palette';

import type { PaletteCommand } from '../src/types/jl-command-palette.types';

describe('fuzzyMatch', () => {
  it('matches the letters of the query in order, in any case', () => {
    expect(fuzzyMatch('opf', 'Open file')?.positions).toEqual([0, 1, 5]);
    expect(fuzzyMatch('OPEN', 'open')?.positions).toEqual([0, 1, 2, 3]);
  });

  it('does not match letters out of order or missing', () => {
    expect(fuzzyMatch('fo', 'Open file')).toBeNull();
    expect(fuzzyMatch('xyz', 'Open file')).toBeNull();
    expect(fuzzyMatch('longer than', 'short')).toBeNull();
  });

  it('matches everything with an empty query, and ignores spaces', () => {
    expect(fuzzyMatch('', 'Anything')).toEqual({ positions: [], score: 0 });
    expect(fuzzyMatch('new file', 'New file')?.positions).toEqual([0, 1, 2, 4, 5, 6, 7]);
  });

  it('prefers letters next to each other over scattered ones', () => {
    // The greedy first "a" would scatter; the best placement takes the contiguous "ab".
    expect(fuzzyMatch('ab', 'zaxzab')?.positions).toEqual([4, 5]);
    const contiguous = fuzzyMatch('file', 'Profile')?.score ?? 0;
    const scattered = fuzzyMatch('file', 'Pacific isle')?.score ?? 0;
    expect(contiguous).toBeGreaterThan(scattered);
  });

  it('prefers word starts', () => {
    const wordStart = fuzzyMatch('set', 'Settings')?.score ?? 0;
    const middle = fuzzyMatch('set', 'Reset')?.score ?? 0;
    expect(wordStart).toBeGreaterThan(middle);
    expect(fuzzyMatch('gs', 'Go to settings')?.positions).toEqual([0, 6]);
  });

  it('scores a full contiguous match at the start of the text as the sum of its bonuses', () => {
    const { contiguous, match, textStart, wordStart } = FUZZY_SCORE;
    expect(fuzzyMatch('ab', 'ab')?.score).toBe(match + wordStart + textStart + contiguous + match);
  });

  it('takes the gap off scattered letters', () => {
    const { gap, match, textStart, wordStart } = FUZZY_SCORE;
    expect(fuzzyMatch('ac', 'abc')?.score).toBe(match + wordStart + textStart - gap + match);
  });
});

describe('isWordStart', () => {
  it('finds starts after separators and at camelCase capitals', () => {
    expect(isWordStart('open file', 0)).toBe(true);
    expect(isWordStart('open file', 5)).toBe(true);
    expect(isWordStart('open-file', 5)).toBe(true);
    expect(isWordStart('openFile', 4)).toBe(true);
    expect(isWordStart('openfile', 4)).toBe(false);
  });
});

describe('highlightSegments', () => {
  it('cuts the text into runs of matched and unmatched letters', () => {
    expect(highlightSegments('Open file', [0, 1, 5])).toEqual([
      { marked: true, text: 'Op' },
      { marked: false, text: 'en ' },
      { marked: true, text: 'f' },
      { marked: false, text: 'ile' },
    ]);
    expect(highlightSegments('abc', [])).toEqual([{ marked: false, text: 'abc' }]);
  });
});

const COMMANDS: PaletteCommand[] = [
  { group: 'Navigation', id: 'home', label: 'Go home' },
  { group: 'Navigation', id: 'settings', keywords: ['preferences'], label: 'Open settings' },
  { group: 'Files', id: 'new', label: 'New file' },
  { group: 'Files', id: 'reset', label: 'Reset layout' },
  { id: 'theme', label: 'Toggle theme' },
];

describe('matchCommands', () => {
  it('keeps every command in its order for an empty search', () => {
    expect(matchCommands(COMMANDS, '  ').map((match) => match.command.id)).toEqual([
      'home',
      'settings',
      'new',
      'reset',
      'theme',
    ]);
  });

  it('keeps the matching commands, best first', () => {
    expect(matchCommands(COMMANDS, 'set').map((match) => match.command.id)).toEqual(['settings', 'reset']);
  });

  it('finds a command by a keyword, with nothing to highlight in its label', () => {
    const [match] = matchCommands(COMMANDS, 'prefs');
    expect(match?.command.id).toBe('settings');
    expect(match?.positions).toEqual([]);
  });
});

describe('groupMatches', () => {
  it('lists groups in the order of their first command', () => {
    const groups = groupMatches(matchCommands(COMMANDS, ''));
    expect(groups.map((group) => group.label)).toEqual(['Navigation', 'Files', '']);
    expect(groups[1]?.matches.map((match) => match.command.id)).toEqual(['new', 'reset']);
  });
});
