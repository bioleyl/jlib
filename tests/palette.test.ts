import { describe, expect, it } from 'vitest';

import { matchCommands } from '../src/lib/palette';

import type { PaletteCommand } from '../src/types/jl-command-palette.types';

const COMMANDS: PaletteCommand[] = [
  { id: 'settings', keywords: ['preferences'], label: 'Settings' },
  { id: 'sync', label: 'Run the sync' },
];

const ids = (commands: readonly PaletteCommand[], query: string): string[] =>
  matchCommands(commands, query).map((match) => match.command.id);

describe('matchCommands', () => {
  it('keeps every command for an empty search, and those the search finds, best first', () => {
    expect(ids(COMMANDS, '')).toEqual(['settings', 'sync']);
    expect(ids(COMMANDS, 'sync')).toEqual(['sync']);
    expect(ids(COMMANDS, 'prefer')).toEqual(['settings']);
  });

  it("lists the page's results whatever the search, after the commands it matches, in the page's order", () => {
    const results: PaletteCommand[] = [
      { id: 'open', label: 'Open info:fedora/dev/rr_1', result: true },
      { id: 'invoices', keywords: ['rr_0b79'], label: 'Invoices', result: true },
    ];
    expect(ids([...COMMANDS, ...results], 'rr_')).toEqual(['open', 'invoices']);
    expect(ids([...results, ...COMMANDS], 'sync')).toEqual(['sync', 'open', 'invoices']);
  });

  it("marks the letters of a result's label that the search matches", () => {
    const [match] = matchCommands([{ id: 'open', label: 'Open rr_1', result: true }], 'rr');
    expect(match?.positions).toEqual([5, 6]);
  });
});
