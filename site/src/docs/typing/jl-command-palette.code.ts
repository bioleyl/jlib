import type { JlCommandPalette } from '@syware/jlib';

type Command = 'new-order' | 'theme' | 'logout';

declare function newOrder(): void; // (not shown)
declare function switchTheme(): void; // (not shown)
declare function logOut(): void; // (not shown)

// One handler per command: TypeScript refuses this record while a command is missing.
const RUN: Record<Command, () => void> = { logout: logOut, 'new-order': newOrder, theme: switchTheme };

const palette = document.querySelector<JlCommandPalette<Command>>('jl-command-palette');
palette?.commands.set([
  { group: 'Orders', icon: 'plus', id: 'new-order', label: 'New order' },
  { group: 'Settings', icon: 'moon', id: 'theme', label: 'Switch the theme' },
  { group: 'Account', icon: 'log-out', id: 'logout', label: 'Log out' },
]);
// @ts-expect-error: 'quit' is not a command
palette?.commands.set([{ id: 'quit', label: 'Quit' }]);
palette?.events.register('select', (id) => RUN[id]());
