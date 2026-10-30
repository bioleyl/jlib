import commandPaletteCode from '../typing/jl-command-palette.code.ts?raw';
import commandPaletteJsx from '../typing/jl-command-palette.jsx.tsx?raw';

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

// The records of the live search example, as a server would answer them, after a short wait.
const RECORDS = [
  { kind: 'Series', title: 'Letters to the council, 1902' },
  { kind: 'File', title: 'Minutes of the board, 1911' },
  { kind: 'Series', title: 'Photographs of the harbour' },
  { kind: 'File', title: 'Invoices of the printer, 1898' },
  { kind: 'File', title: 'Letters from Geneva' },
];
const SEARCH_LATENCY_MS = 300;
const RECORD_ID = /^rr_\d+$/;

const recordsFor = (query: string): Promise<PaletteCommand[]> =>
  new Promise((resolve) => {
    const found = RECORDS.filter(({ title }) => query !== '' && title.toLowerCase().includes(query.toLowerCase()));
    const open = RECORD_ID.test(query)
      ? [{ group: 'Records', icon: 'file-text', id: query, label: `Open ${query}`, result: true }]
      : [];
    const records = found.map(({ kind, title }) => ({
      description: kind,
      group: 'Records',
      icon: 'file-text',
      id: title,
      label: title,
      result: true,
    }));
    setTimeout(() => resolve([...open, ...records]), SEARCH_LATENCY_MS);
  });

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
closes the palette, Escape closes it. Shortcuts beside the commands are only shown: running them is the app's job.

It can also search the app's data. Once typing pauses, search tells the page what was typed (and an empty text when
the palette opens); the page looks it up, with loading on meanwhile, and adds what it found to the commands with
result: true. Those are listed as the page gave them, after the commands the text matches: records whose title holds
it, or "Open rr_12" for an ID pasted whole.`,
  events: [
    {
      description: 'A command was chosen; the palette closes first.',
      detail: 'Id (the command id)',
      name: 'select',
    },
    { description: 'The palette opened.', detail: 'undefined', name: 'open' },
    { description: 'The palette closed.', detail: 'undefined', name: 'close' },
    {
      description:
        'What was typed, once typing pauses for debounce milliseconds; an empty text when the palette opens. Answer it with commands marked result.',
      detail: 'string',
      name: 'search',
    },
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
    {
      description:
        'The page searches its records as people type: try "letters", or paste an ID such as rr_42. The commands stay above what was found.',
      html: `
        <div class="row">
          <jl-button class="open-search" icon="search" label="Search records and commands…"></jl-button>
        </div>
        <p class="muted ran">Nothing opened yet.</p>
        <jl-command-palette class="search" hotkey="none" placeholder="Search records, paste an ID, or run a command…"></jl-command-palette>`,
      script: `
        const palette = root.querySelector('jl-command-palette.search');
        const commands = [{ id: 'new', label: 'New record', group: 'Create', icon: 'plus' }];
        palette.commands.set(commands);
        palette.events.register('search', async (text) => {
          palette.loading.set(true);
          const found = await fetch(\`/api/records?q=\${encodeURIComponent(text)}\`).then((answer) => answer.json());
          // What was found for the text: listed whatever it is, after the commands it matches.
          const results = found.map((record) => ({
            id: record.id,
            label: record.title,
            description: record.kind,
            group: 'Records',
            result: true,
          }));
          palette.commands.set([...commands, ...results]);
          palette.loading.set(false);
        });
        root.querySelector('.open-search').events.register('press', () => palette.show());`,
      setup: (root) => {
        const palette = root.querySelector<JlCommandPalette>('jl-command-palette.search');
        const output = root.querySelector('.ran');
        const commands: PaletteCommand[] = [{ group: 'Create', icon: 'plus', id: 'new', label: 'New record' }];
        palette?.commands.set(commands);
        palette?.events.register('search', (text) => {
          palette.loading.set(true);
          void recordsFor(text).then((results) => {
            palette.commands.set([...commands, ...results]);
            palette.loading.set(false);
          });
        });
        palette?.events.register('select', (id) => {
          if (output !== null) {
            output.textContent = `Opened: ${id}`;
          }
        });
        root.querySelector<JlButton>('.open-search')?.events.register('press', () => palette?.show());
      },
      title: 'Searching the app’s data',
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
      description:
        'The commands: id, label, and optionally group, icon, description (what it is, beside the label: the kind of a record), shortcut (mod+shift+p), keywords, and result (found by the page for what was typed: always listed).',
      name: 'commands',
      type: 'PaletteCommand<Id>[]',
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
      default: "''",
      description: "The hint in the empty search box. Empty: jlib's own text, in the language shown.",
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
      default: "''",
      description: "What it says when nothing matches. Empty: jlib's own text, in the language shown.",
      name: 'emptyText',
      type: 'string',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: "The name of the dialog for screen readers. Empty: jlib's own text, in the language shown.",
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'debounce',
      control: { kind: 'number', min: 0, step: 50 },
      default: '250',
      description: 'How long typing pauses, in milliseconds, before search fires.',
      name: 'debounce',
      type: 'number',
    },
    {
      attribute: 'loading',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shows a spinner in place of the search icon, while the page looks for what was typed.',
      name: 'loading',
      type: 'boolean',
    },
  ],
  styling: [{ description: 'The native dialog element.', name: 'base' }],
  summary:
    "A search box over every command of an app, opened by ⌘K or Ctrl+K, with fuzzy matching, and the app's own results for what was typed.",
  tag: 'jl-command-palette',
  typing: {
    code: commandPaletteCode,
    description:
      "Typed by its ids, JlCommandPalette<'new-order' | 'theme'> takes commands of those ids only, and gives select one of them, for a Record of one handler per command. The records a search finds take ids of their own form, open: and the record's id, typed as a template literal that a type guard tells apart.",
    jsx: commandPaletteJsx,
  },
};
