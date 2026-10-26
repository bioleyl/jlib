import type { JlButton, JlTree, TreeItem } from '@syware/jlib';
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

export const doc: ComponentDoc = {
  className: 'JlTree',
  description: `Nested items that open and close: files in folders, sections of settings, the parts of a document. Give
the items as nested objects (an item with children, even none, is a folder), the open folders in expanded, and the
selected item in value. Folders get a folder icon that opens with them, and the other items a file icon, unless an
item names its own.

The keyboard follows the tree pattern: Up and Down move, Right opens a folder then enters it, Left closes it or goes
to the parent, Home and End jump to the first and last items, Enter or Space selects. A press on a row selects it
and opens or closes a folder; a press on the chevron only opens or closes. Tab enters and leaves the tree as one
stop.`,
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
  ],
  level: 'organism',
  methods: [
    {
      description: 'Opens or closes a folder, and emits toggle.',
      name: 'toggle',
      signature: 'toggle(id: string, open: boolean): void',
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
      description: 'The items: id, label, and optionally icon and children (which makes a folder).',
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
  ],
  styling: [
    { description: 'The tree element.', name: 'base' },
    { description: 'The indent of each level: 16px.', name: '--indent' },
    { description: 'The height of a row: 30px.', name: '--row-height' },
  ],
  summary: 'Nested items that open and close, as files in folders, with the keyboard of a tree.',
  tag: 'jl-tree',
};
