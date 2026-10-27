import type { JlButton, JlTree, TreeItem, TreePage } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const PROJECT: TreeItem[] = [
  {
    children: [
      {
        children: [
          { id: 'src/atoms/jl-button.tsx', label: 'jl-button.tsx' },
          { id: 'src/atoms/jl-icon.tsx', label: 'jl-icon.tsx' },
        ],
        id: 'src/atoms',
        label: 'atoms',
      },
      {
        children: [
          { id: 'src/organisms/jl-dialog.tsx', label: 'jl-dialog.tsx' },
          { id: 'src/organisms/jl-tree.tsx', label: 'jl-tree.tsx' },
        ],
        id: 'src/organisms',
        label: 'organisms',
      },
      { icon: 'code', id: 'src/index.ts', label: 'index.ts' },
    ],
    id: 'src',
    label: 'src',
  },
  { children: [{ id: 'tests/tree.test.ts', label: 'tree.test.ts' }], id: 'tests', label: 'tests' },
  { icon: 'package', id: 'package.json', label: 'package.json' },
  { icon: 'file-text', id: 'README.md', label: 'README.md' },
];

const FOLDERS = ['src', 'src/atoms', 'src/organisms', 'tests'];

// The archive of the loader example: 120 boxes of 3 files, served 25 at a time, each page after a short wait.
const BOXES = 120;
const FILES_PER_BOX = 3;
const PAGE_SIZE = 25;
const LATENCY_MS = 400;

const archivePage = (parent: string | null, offset: number): TreePage => {
  if (parent === null) {
    const count = Math.min(PAGE_SIZE, BOXES - offset);
    const items = Array.from({ length: count }, (_, index) => {
      const box = String(offset + index + 1).padStart(3, '0');
      return { icon: 'package', id: `box-${box}`, label: `Box ${box}`, lazy: true };
    });
    return { items, total: BOXES };
  }
  const items = Array.from({ length: FILES_PER_BOX }, (_, index) => ({
    hint: `${parent}/scan-${index + 1}.tif`,
    id: `${parent}/scan-${index + 1}`,
    label: `scan-${index + 1}.tif`,
  }));
  return { items, total: FILES_PER_BOX };
};

const loadArchive = (parent: string | null, offset: number): Promise<TreePage> =>
  new Promise((resolve) => setTimeout(() => resolve(archivePage(parent, offset)), LATENCY_MS));

export const doc: ComponentDoc = {
  className: 'JlTree',
  description: `Nested items that open and close: files in folders, sections of settings, the parts of a document. Give
the items as nested objects (an item with children, even none, is a folder), the open folders in expanded, and the
selected item in value. Folders get a folder icon that opens with them, and the other items a file icon, unless an
item names its own.

A large tree loads itself instead: give it a loader, a function that answers a page of a level (the roots when the
parent is null) with its items and how many the level has in all. It loads the roots, the children of a lazy folder
when it first opens, and the next page of a level when its "Show 75 more" row is pressed; a level that failed ends
with a row that loads it again. reveal() opens the folders down to an item, loading what it needs on the way, and
selects it: a page calls it with the item in its address. Every text the tree shows can be set, for pages in other
languages.

An item with an href is a link: the address follows it, and a middle click opens it in a new tab. Its row selects it
without firing select, since the page that follows the address shows it.

The keyboard follows the tree pattern: Up and Down move, Right opens a folder then enters it, Left closes it or goes
to the parent, Home and End jump to the first and last items, Enter or Space selects (or follows the link, or loads
the next page). A press on a row selects it and opens or closes a folder; a press on the chevron only opens or
closes. Tab enters and leaves the tree as one stop.`,
  events: [
    { description: 'An item was selected: its id.', detail: 'string', name: 'select' },
    { description: 'A folder opened or closed.', detail: '{ id: string; open: boolean }', name: 'toggle' },
  ],
  examples: [
    {
      description:
        'A project beside the file it shows. Click a file, or use the arrows once the tree has the focus.',
      html: `
        <div class="row" style="align-items: start">
          <jl-tree class="files" label="Project files" value="src/organisms/jl-tree.tsx"
            expanded='["src","src/organisms"]' style="width: 260px"></jl-tree>
          <div class="stack">
            <strong class="file-name">jl-tree.tsx</strong>
            <span class="muted file-path">src/organisms/jl-tree.tsx</span>
          </div>
        </div>`,
      script: `
        const tree = root.querySelector('jl-tree.files');
        tree.items.set(project);
        tree.events.register('select', (id) => {
          root.querySelector('.file-name').textContent = id.split('/').at(-1);
          root.querySelector('.file-path').textContent = id;
        });`,
      setup: (root) => {
        const tree = root.querySelector<JlTree>('jl-tree.files');
        const name = root.querySelector('.file-name');
        const path = root.querySelector('.file-path');
        tree?.items.set(PROJECT);
        tree?.events.register('select', (id) => {
          if (name !== null && path !== null) {
            name.textContent = id.split('/').at(-1) ?? id;
            path.textContent = id;
          }
        });
      },
      title: 'Project files',
    },
    {
      description: 'Items with their own icons: settings sections.',
      html: `
        <jl-tree class="narrow" label="Settings" value="profile" expanded='["account"]'
          items='[{"id":"account","label":"Account","icon":"user","children":[{"id":"profile","label":"Profile","icon":"pencil"},{"id":"security","label":"Security","icon":"shield-check"},{"id":"sessions","label":"Sessions","icon":"monitor"}]},{"id":"workspace","label":"Workspace","icon":"layers","children":[{"id":"members","label":"Members","icon":"users"},{"id":"billing","label":"Billing","icon":"credit-card"}]},{"id":"notifications","label":"Notifications","icon":"bell"}]'></jl-tree>`,
      title: 'With icons',
    },
    {
      description: 'expanded set from code: open or close every folder at once.',
      html: `
        <div class="stack narrow">
          <div class="row">
            <jl-button class="expand-all" size="sm" icon="chevrons-up-down" label="Expand all"></jl-button>
            <jl-button class="collapse-all" size="sm" label="Collapse all"></jl-button>
          </div>
          <jl-tree class="all" label="Project"></jl-tree>
        </div>`,
      script: `
        const tree = root.querySelector('jl-tree.all');
        tree.items.set(project);
        root.querySelector('.expand-all').events.register('press', () =>
          tree.expanded.set(['src', 'src/atoms', 'src/organisms', 'tests'])
        );
        root.querySelector('.collapse-all').events.register('press', () => tree.expanded.set([]));`,
      setup: (root) => {
        const tree = root.querySelector<JlTree>('jl-tree.all');
        tree?.items.set(PROJECT);
        root.querySelector<JlButton>('.expand-all')?.events.register('press', () => tree?.expanded.set(FOLDERS));
        root.querySelector<JlButton>('.collapse-all')?.events.register('press', () => tree?.expanded.set([]));
      },
      title: 'Opened from code',
    },
    {
      description:
        'A loader: 120 boxes come 25 at a time, and each box loads its files when it opens. reveal() finds box 087, loading the pages before it.',
      html: `
        <div class="stack narrow">
          <div class="row">
            <jl-button class="reveal" size="sm" icon="search" label="Show box 087"></jl-button>
            <jl-button class="reload" size="sm" label="Reload"></jl-button>
          </div>
          <jl-tree class="archive" label="Archive" empty-text="The archive holds no box yet."
            style="max-height: 320px; overflow: auto"></jl-tree>
        </div>`,
      script: `
        const tree = root.querySelector('jl-tree.archive');
        // A page of a level: the roots when parent is null. A lazy folder loads its children when it opens.
        tree.loader = async (parent, offset) => {
          const answer = await fetch(\`/api/boxes?parent=\${parent ?? ''}&offset=\${offset}\`);
          return answer.json(); // { items: [{ id, label, icon: 'package', lazy: true }], total: 120 }
        };
        root.querySelector('.reveal').events.register('press', () =>
          tree.reveal(['box-087', 'box-087/scan-2'])
        );
        root.querySelector('.reload').events.register('press', () => tree.reload());`,
      setup: (root) => {
        const tree = root.querySelector<JlTree>('jl-tree.archive');
        if (tree) {
          tree.loader = loadArchive;
        }
        root
          .querySelector<JlButton>('.reveal')
          ?.events.register('press', () => void tree?.reveal(['box-087', 'box-087/scan-2']));
        root.querySelector<JlButton>('.reload')?.events.register('press', () => void tree?.reload());
      },
      title: 'Loaded a page at a time',
    },
    {
      description: 'Items with an href are links: the address follows them, and a middle click opens a new tab.',
      html: `
        <jl-tree class="narrow" label="Documents" expanded='["reports"]'
          items='[{"id":"reports","label":"Reports","children":[{"id":"q3","label":"Q3 report.pdf","href":"#q3","hint":"Reports/Q3 report.pdf"},{"id":"q4","label":"Q4 report.pdf","href":"#q4","hint":"Reports/Q4 report.pdf"}]}]'></jl-tree>`,
      title: 'Links',
    },
  ],
  level: 'organism',
  methods: [
    {
      description: 'Opens or closes a folder, and emits toggle. A lazy folder loads its first page when it opens.',
      name: 'toggle',
      signature: 'toggle(id: string, open: boolean): void',
    },
    {
      description:
        'Opens the folders from the root down to the last id of the path, loading their levels and pages as needed, then selects it without firing select. False when an id is not where the path says.',
      name: 'reveal',
      signature: 'reveal(path: string[]): Promise<boolean>',
    },
    {
      description: 'Forgets what the loader gave and loads the roots again.',
      name: 'reload',
      signature: 'reload(): Promise<void>',
    },
  ],
  name: 'Tree',
  playground: {
    attributes: {
      expanded: '["src"]',
      items:
        '[{"id":"src","label":"src","children":[{"id":"main","label":"main.ts"},{"id":"lib","label":"lib","children":[{"id":"dates","label":"dates.ts"}]}]},{"id":"readme","label":"README.md"}]',
      label: 'Files',
      value: 'main',
    },
    width: 300,
  },
  props: [
    {
      attribute: 'items',
      control: { kind: 'json' },
      default: '[]',
      description:
        'The items: id, label, and optionally icon, children (which makes a folder), lazy (a folder the loader fills when it opens), href (a link), hint (a tooltip) and badge (a count after the label). With a loader, the tree fills them itself.',
      name: 'items',
      type: 'TreeItem[]',
    },
    {
      attribute: 'expanded',
      control: { kind: 'json' },
      default: '[]',
      description: 'The ids of the open folders.',
      name: 'expanded',
      type: 'string[]',
    },
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The id of the selected item.',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The name of the tree for screen readers.',
      name: 'label',
      type: 'string',
    },
    {
      default: 'null',
      description:
        'Loads a page of a level: (parent, offset) => Promise<{ items, total }>, the roots when parent is null. Setting it loads the roots.',
      name: 'loader',
      type: 'TreeLoader | null',
    },
    {
      attribute: 'empty-text',
      control: { kind: 'text' },
      default: "''",
      description: 'What an empty tree says; nothing by default.',
      name: 'emptyText',
      type: 'string',
    },
    {
      attribute: 'loading-text',
      default: "'Loading…'",
      description: 'Said while a page loads.',
      name: 'loadingText',
      type: 'string',
    },
    {
      attribute: 'more-text',
      default: "'Show {count} more'",
      description: 'The row that loads the next page of a level; {count} is how many items are left.',
      name: 'moreText',
      type: 'string',
    },
    {
      attribute: 'error-text',
      default: "'This could not be loaded.'",
      description: "Said where a page could not be loaded; the row's tooltip holds the error.",
      name: 'errorText',
      type: 'string',
    },
    {
      attribute: 'retry-label',
      default: "'Try again'",
      description: 'The action at the end of that row, which loads the page again.',
      name: 'retryLabel',
      type: 'string',
    },
  ],
  styling: [
    { description: 'The tree element.', name: 'base' },
    { description: 'The indent of each level: 16px.', name: '--indent' },
    { description: 'The height of a row: 30px.', name: '--row-height' },
  ],
  summary:
    'Nested items that open and close, as files in folders, with the keyboard of a tree; loaded a page at a time for large ones.',
  tag: 'jl-tree',
};
