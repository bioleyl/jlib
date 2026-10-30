import { Jadis } from '@jadis/core';
import { JlCommandPalette } from '@syware/jlib';

import type { PaletteCommand } from '@syware/jlib';

// The records a search finds take an id of their own form.
type Command = 'new-order' | 'theme' | `open:${string}`;

declare function run(command: 'new-order' | 'theme'): void; // (not shown)
declare function openRecord(id: string): void; // (not shown)

const OPEN = 'open:';

const COMMANDS: PaletteCommand<Command>[] = [
  { group: 'Orders', icon: 'plus', id: 'new-order', label: 'New order' },
  { group: 'Settings', icon: 'moon', id: 'theme', label: 'Switch the theme' },
];

const isRecord = (id: Command): id is `open:${string}` => id.startsWith(OPEN);

export class AppPalette extends Jadis {
  static readonly selector = 'app-palette';

  private readonly _refs = this.useRefs((ref) => ({ palette: ref<JlCommandPalette<Command>>('.palette') }));

  templateHtml(): Node {
    return <JlCommandPalette<Command> class="palette" commands={COMMANDS} hotkey="mod+k" />;
  }

  onConnect(): void {
    this._refs.palette.events.register('select', (id) =>
      isRecord(id) ? openRecord(id.slice(OPEN.length)) : run(id)
    );
  }
}

AppPalette.register();
