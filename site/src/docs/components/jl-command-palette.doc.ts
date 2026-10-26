import type { JlButton, JlCommandPalette, PaletteCommand } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const APP_COMMANDS: PaletteCommand[] = [
  { group: 'Go to', icon: 'house', id: 'home', label: 'Dashboard', shortcut: 'g' },
  { group: 'Go to', icon: 'inbox', id: 'inbox', label: 'Inbox', shortcut: 'i' },
  { group: 'Go to', icon: 'layers', id: 'projects', keywords: ['boards', 'work'], label: 'Projects' },
  { group: 'Go to', icon: 'chart', id: 'reports', keywords: ['analytics', 'stats'], label: 'Reports' },
  { group: 'Create', icon: 'plus', id: 'new-project', label: 'New project', shortcut: 'mod+shift+p' },
  { group: 'Create', icon: 'file-text', id: 'new-doc', label: 'New document', shortcut: 'mod+alt+n' },
  { group: 'Create', icon: 'users', id: 'invite', keywords: ['member', 'add', 'team'], label: 'Invite people' },
  {
    group: 'Settings',
    icon: 'settings',
    id: 'settings',
    keywords: ['preferences', 'options'],
    label: 'Open settings',
    shortcut: 'mod+,',
  },
  {
    group: 'Settings',
    icon: 'moon',
    id: 'theme',
    keywords: ['dark', 'light', 'appearance'],
    label: 'Toggle theme',
  },
  {
    group: 'Settings',
    icon: 'credit-card',
    id: 'billing',
    keywords: ['plan', 'invoice', 'payment'],
    label: 'Billing and plan',
  },
  { group: 'Settings', icon: 'log-out', id: 'sign-out', label: 'Sign out' },
];

const SIMPLE_COMMANDS: PaletteCommand[] = [
  { id: 'copy', label: 'Copy link to this page' },
  { id: 'duplicate', label: 'Duplicate document' },
  { id: 'export-pdf', label: 'Export as PDF' },
  { id: 'export-md', label: 'Export as Markdown' },
  { id: 'history', label: 'Show version history' },
];

/** Opens the palette of an example from its button, and writes the chosen command's label. */
function wire(
  root: HTMLElement,
  paletteSelector: string,
  buttonSelector: string,
  commands: PaletteCommand[]
): void {
  const palette = root.querySelector<JlCommandPalette>(paletteSelector);
  const output = root.querySelector('.ran');
  palette?.commands.set(commands);
  root.querySelector<JlButton>(buttonSelector)?.events.register('press', () => palette?.show());
  palette?.events.register('select', (id) => {
    const command = commands.find((candidate) => candidate.id === id);
    if (output !== null) {
      output.textContent = `Ran: ${command?.label ?? id}`;
    }
  });
}

export const doc: ComponentDoc = {
  className: 'JlCommandPalette',
  description: `One search box for everything an app can do: go to a page, create something, change a setting. People
open it with ⌘K on a Mac or Ctrl+K elsewhere (the hotkey attribute changes the keys), or from a button that calls
show(). It listens to the whole document while it is in the page.

Typing filters the commands by their letters in order, so "nwp" finds "New project": letters next to each other and
letters that start words count most, the matched letters are highlighted, and keywords find a command by other
words. Results stay under their group headings. Up and Down move, Enter runs the command (select, with its id) and
closes the palette, Escape closes it. Shortcuts beside the commands are only shown: running them is the app's job.`,
  events: [
    {
      description: 'A command was chosen; the palette closes first.',
      detail: 'string (the command id)',
      name: 'select',
    },
    { description: 'The palette opened.', detail: 'undefined', name: 'open' },
    { description: 'The palette closed.', detail: 'undefined', name: 'close' },
  ],
  examples: [
    {
      description: 'Opened by the button, or by ⌘K / Ctrl+K anywhere on this page. Try "nwp", "dark" or "bill".',
      html: `
        <div class="row">
          <jl-button class="open-app" icon="search" label="Search or run a command…"></jl-button>
          <span class="muted">or press ⌘K / Ctrl+K</span>
        </div>
        <p class="muted ran">Nothing ran yet.</p>
        <jl-command-palette class="app" placeholder="Search pages, actions and settings…"></jl-command-palette>`,
      script: `
        const palette = root.querySelector('jl-command-palette.app');
        palette.commands.set([
          { id: 'home', label: 'Dashboard', group: 'Go to', icon: 'house', shortcut: 'g' },
          { id: 'new-project', label: 'New project', group: 'Create', icon: 'plus', shortcut: 'mod+shift+p' },
          { id: 'theme', label: 'Toggle theme', group: 'Settings', icon: 'moon', keywords: ['dark', 'light'] },
          // …
        ]);
        root.querySelector('.open-app').events.register('press', () => palette.show());
        palette.events.register('select', (id) => {
          root.querySelector('.ran').textContent = \`Ran: \${id}\`;
        });`,
      setup: (root) => wire(root, 'jl-command-palette.app', '.open-app', APP_COMMANDS),
      title: 'An app’s commands',
    },
    {
      description: 'No groups, no icons, no hotkey (hotkey="none"): opened from its button only.',
      html: `
        <div class="row">
          <jl-button class="open-doc" icon="ellipsis" label="Document actions"></jl-button>
        </div>
        <p class="muted ran">Nothing ran yet.</p>
        <jl-command-palette class="doc" hotkey="none" placeholder="Search actions…" empty-text="No action matches"></jl-command-palette>`,
      setup: (root) => wire(root, 'jl-command-palette.doc', '.open-doc', SIMPLE_COMMANDS),
      title: 'A short list',
    },
    {
      description: 'Commands written as JSON in the attribute, opened by another key: ⌘J / Ctrl+J.',
      html: `
        <div class="row">
          <jl-button class="open-json" label="Open (or press ⌘J / Ctrl+J)"></jl-button>
        </div>
        <jl-command-palette class="json" hotkey="mod+j"
          commands='[{"id":"bold","label":"Bold","icon":"pencil","shortcut":"mod+b"},{"id":"link","label":"Insert link","icon":"link","shortcut":"mod+k"},{"id":"image","label":"Insert image","icon":"image"}]'></jl-command-palette>`,
      script: `
        const palette = root.querySelector('jl-command-palette.json');
        root.querySelector('.open-json').events.register('press', () => palette.show());`,
      setup: (root) => {
        const palette = root.querySelector<JlCommandPalette>('jl-command-palette.json');
        root.querySelector<JlButton>('.open-json')?.events.register('press', () => palette?.show());
      },
      title: 'In HTML',
    },
  ],
  level: 'organism',
  methods: [
    { description: 'Opens the palette, with an empty search.', name: 'show', signature: 'show(): void' },
    { description: 'Closes the palette.', name: 'close', signature: 'close(): void' },
  ],
  name: 'Command palette',
  playground: {
    attributes: {
      commands:
        '[{"id":"home","label":"Go home","group":"Navigation","icon":"house"},{"id":"settings","label":"Open settings","group":"Navigation","icon":"settings","shortcut":"mod+,"},{"id":"new","label":"New file","group":"Files","icon":"plus","shortcut":"mod+n"},{"id":"theme","label":"Toggle theme","group":"Appearance","icon":"moon","keywords":["dark","light"]}]',
      hotkey: 'none',
    },
    setup: (element) => {
      const palette = element as JlCommandPalette;
      const opener = document.createElement('jl-button') as JlButton;
      opener.setAttribute('label', 'Open the palette');
      opener.setAttribute('variant', 'primary');
      opener.setAttribute('icon', 'search');
      opener.events.register('press', () => palette.show());
      palette.before(opener);
    },
  },
  props: [
    {
      attribute: 'commands',
      control: { kind: 'json' },
      default: '[]',
      description: 'The commands: id, label, and optionally group, icon, shortcut (mod+shift+p) and keywords.',
      name: 'commands',
      type: 'PaletteCommand[]',
    },
    {
      attribute: 'open',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Whether it is open.',
      name: 'open',
      type: 'boolean',
    },
    {
      attribute: 'placeholder',
      control: { kind: 'text' },
      default: "'Type a command or search…'",
      description: 'The hint in the empty search box.',
      name: 'placeholder',
      type: 'string',
    },
    {
      attribute: 'hotkey',
      control: { kind: 'text' },
      default: "'mod+k'",
      description:
        'The keys that open and close it from anywhere; mod is ⌘ on Apple and Ctrl elsewhere; none for no keys.',
      name: 'hotkey',
      type: 'string',
    },
    {
      attribute: 'empty-text',
      control: { kind: 'text' },
      default: "'No matching commands'",
      description: 'What it says when nothing matches.',
      name: 'emptyText',
      type: 'string',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "'Command palette'",
      description: 'The name of the dialog for screen readers.',
      name: 'label',
      type: 'string',
    },
  ],
  styling: [{ description: 'The native dialog element.', name: 'base' }],
  summary: 'A search box over every command of an app, opened by ⌘K or Ctrl+K, with fuzzy matching.',
  tag: 'jl-command-palette',
};
