import type { JlButton, JlTable, TableColumn, TableRow, Tone } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

/** A badge tone per value; the values are labels people read, written as they show. */
const tonesOf = (entries: [string, Tone][]): Record<string, Tone> => Object.fromEntries(entries);

const USER_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  {
    format: 'badge',
    key: 'status',
    label: 'Status',
    sortable: true,
    tones: tonesOf([
      ['Active', 'ok'],
      ['Invited', 'info'],
      ['Suspended', 'danger'],
    ]),
  },
  { format: 'number', key: 'projects', label: 'Projects', sortable: true },
  { format: 'date', key: 'joined', label: 'Joined', sortable: true },
];

const USERS: TableRow[] = [
  {
    email: 'ada@acme.dev',
    id: 1,
    joined: '2023-02-14',
    name: 'Ada Lovelace',
    projects: 12,
    role: 'Owner',
    status: 'Active',
  },
  {
    email: 'ben@acme.dev',
    id: 2,
    joined: '2024-06-03',
    name: 'Ben Okafor',
    projects: 4,
    role: 'Editor',
    status: 'Active',
  },
  {
    email: 'chen@acme.dev',
    id: 3,
    joined: '2024-11-21',
    name: 'Chen Wei',
    projects: 0,
    role: 'Viewer',
    status: 'Invited',
  },
  {
    email: 'dara@acme.dev',
    id: 4,
    joined: '2022-09-30',
    name: 'Dara Byrne',
    projects: 27,
    role: 'Admin',
    status: 'Active',
  },
  {
    email: 'eli@acme.dev',
    id: 5,
    joined: '2023-08-08',
    name: 'Eli Navarro',
    projects: 9,
    role: 'Editor',
    status: 'Suspended',
  },
  {
    email: 'fatou@acme.dev',
    id: 6,
    joined: '2025-01-12',
    name: 'Fatou Diop',
    projects: 2,
    role: 'Editor',
    status: 'Active',
  },
  {
    email: 'gus@acme.dev',
    id: 7,
    joined: '2025-03-02',
    name: 'Gus Lindqvist',
    projects: 0,
    role: 'Viewer',
    status: 'Invited',
  },
  {
    email: 'hana@acme.dev',
    id: 8,
    joined: '2021-12-01',
    name: 'Hana Sato',
    projects: 41,
    role: 'Admin',
    status: 'Active',
  },
];

const DEPLOY_COLUMNS: TableColumn[] = [
  { format: 'code', key: 'commit', label: 'Commit', width: 110 },
  { key: 'branch', label: 'Branch', sortable: true },
  {
    format: 'badge',
    key: 'state',
    label: 'State',
    tones: tonesOf([
      ['Failed', 'danger'],
      ['Live', 'ok'],
      ['Queued', 'neutral'],
    ]),
  },
  { format: 'number', key: 'duration', label: 'Seconds', sortable: true },
  { format: 'date', key: 'at', label: 'Date', sortable: true },
];

const BRANCHES = ['main', 'feat/search', 'fix/login', 'feat/billing', 'chore/deps'];
const STATES = ['Live', 'Live', 'Failed', 'Live', 'Queued'];
const DEPLOY_COUNT = 24;
const BASE_SECONDS = 38;
const SECONDS_SPREAD = 7;
const COMMIT_RADIX = 16;
const COMMIT_SEED = 0x3fa9c1;
const COMMIT_STEP = 0x2b7e5;
const DAY_MS = 86_400_000;
const LAST_DEPLOY = Date.UTC(2025, 4, 30);

const DEPLOYS: TableRow[] = Array.from({ length: DEPLOY_COUNT }, (_, index) => ({
  at: new Date(LAST_DEPLOY - index * DAY_MS).toISOString(),
  branch: BRANCHES[index % BRANCHES.length],
  commit: (COMMIT_SEED + index * COMMIT_STEP).toString(COMMIT_RADIX).slice(0, 7),
  duration: BASE_SECONDS + ((index * SECONDS_SPREAD) % (BASE_SECONDS + 1)),
  id: index,
  state: STATES[index % STATES.length],
}));

/** The users table and its toolbar: the selection count and a button that acts on it. */
function wireUsers(root: HTMLElement): void {
  const table = root.querySelector<JlTable>('jl-table.users');
  const count = root.querySelector('.selection-count');
  const remove = root.querySelector<JlButton>('.remove-selected');
  if (table === null || count === null || remove === null) {
    return;
  }
  table.rows.set(USERS);
  table.events.register('selection', (keys) => {
    count.textContent = keys.length === 0 ? 'No user selected' : `${keys.length} selected`;
    remove.disabled.set(keys.length === 0);
  });
  remove.events.register('press', () => {
    const selected = new Set(table.selected.get());
    table.rows.set(table.rows.get().filter((row) => !selected.has(row.id as number)));
    table.selected.set([]);
    count.textContent = 'No user selected';
    remove.disabled.set(true);
  });
}

export const doc: ComponentDoc = {
  className: 'JlTable',
  description: `A table for records: users, invoices, deployments. Describe the columns once (what each shows, its
format, whether it sorts) and give the rows as plain objects; the table formats numbers and dates for the reader's
language, draws badges and code, and right-aligns numbers.

A press on a sortable heading sorts the rows ascending, then descending, then back to their order, and emits sort.
Numbers sort by value, dates by time, text in the language's order; empty values stay at the end. selectable adds a
checkbox to each row and one in the header that selects them all (a dash when only some are), and emits selection
with the keys of the selected rows, read from row-key.

The header stays on top while the rows scroll within max-height, and the table scrolls sideways on narrow screens.
For a cell that is more than a value (a person with an avatar, a link, a menu), give the column a renderer.`,
  events: [
    {
      description: 'A heading was pressed: the column and its new order.',
      detail: '{ key: string; direction }',
      name: 'sort',
    },
    {
      description: 'The selection changed: the keys of the selected rows.',
      detail: 'Array<string | number>',
      name: 'selection',
    },
  ],
  examples: [
    {
      description: 'Sorting on every column, a badge for the status, and a selection the toolbar acts on.',
      html: `
        <div class="stack">
          <div class="row">
            <span class="muted selection-count">No user selected</span>
            <jl-button class="remove-selected" size="sm" variant="danger" icon="trash" label="Remove" disabled></jl-button>
          </div>
          <jl-table class="users" label="Workspace members" selectable sort-key="name" sort-direction="asc"
            columns='${JSON.stringify(USER_COLUMNS)}'></jl-table>
        </div>`,
      script: `
        const table = root.querySelector('jl-table.users');
        const count = root.querySelector('.selection-count');
        const remove = root.querySelector('.remove-selected');
        table.rows.set([
          { id: 1, name: 'Ada Lovelace', email: 'ada@acme.dev', role: 'Owner', status: 'Active', projects: 12, joined: '2023-02-14' },
          // …
        ]);
        table.events.register('selection', (keys) => {
          count.textContent = keys.length === 0 ? 'No user selected' : \`\${keys.length} selected\`;
          remove.disabled.set(keys.length === 0);
        });
        remove.events.register('press', () => {
          const selected = new Set(table.selected.get());
          table.rows.set(table.rows.get().filter((row) => !selected.has(row.id)));
          table.selected.set([]);
        });`,
      setup: wireUsers,
      title: 'Workspace members',
    },
    {
      description:
        "A renderer draws the cells of a column by code; here a name with its email under it. The cells live in the table's shadow root, out of reach of the page's styles: style what a renderer draws inline.",
      html: `
        <jl-table class="people" columns='[{"key":"name","label":"Person","sortable":true},{"key":"role","label":"Role"},{"key":"projects","label":"Projects","format":"number"}]'></jl-table>`,
      script: `
        const table = root.querySelector('jl-table.people');
        table.renderers.set({
          name: (row) => {
            const cell = document.createElement('div');
            cell.innerHTML = '<strong></strong><div class="email" style="color: var(--jl-muted); font-size: 13px"></div>';
            cell.querySelector('strong').textContent = row.name;
            cell.querySelector('.email').textContent = row.email;
            return cell;
          },
        });
        table.rows.set(users.slice(0, 4));`,
      setup: (root) => {
        const table = root.querySelector<JlTable>('jl-table.people');
        table?.renderers.set({
          name: (row) => {
            const cell = document.createElement('div');
            cell.innerHTML =
              '<strong></strong><div class="email" style="color: var(--jl-muted); font-size: 13px"></div>';
            const name = cell.querySelector('strong');
            const email = cell.querySelector('.email');
            if (name !== null && email !== null) {
              name.textContent = String(row.name);
              email.textContent = String(row.email);
            }
            return cell;
          },
        });
        table?.rows.set(USERS.slice(0, 4));
      },
      title: 'Custom cells',
    },
    {
      description: 'Dense and striped, the header held on top while the rows scroll within 260 pixels.',
      html: `
        <jl-table class="deploys" dense striped max-height="260" label="Deployments"
          columns='${JSON.stringify(DEPLOY_COLUMNS)}'></jl-table>`,
      script: `
        root.querySelector('jl-table.deploys').rows.set(deployments);`,
      setup: (root) => root.querySelector<JlTable>('jl-table.deploys')?.rows.set(DEPLOYS),
      title: 'Dense, striped, scrolling',
    },
    {
      description: 'Placeholder rows while the data loads, and a sentence when there is none.',
      html: `
        <div class="stack">
          <jl-table loading columns='[{"key":"name","label":"Name"},{"key":"email","label":"Email"},{"key":"amount","label":"Amount","format":"number"}]'></jl-table>
          <jl-table empty-text="No invoices yet" columns='[{"key":"number","label":"Invoice"},{"key":"customer","label":"Customer"},{"key":"total","label":"Total","format":"number"}]'></jl-table>
        </div>`,
      title: 'Loading and empty',
    },
    {
      description: 'Each format, written in HTML: rows can be JSON in the attribute too.',
      html: `
        <jl-table row-key="sku"
          columns='[{"key":"sku","label":"SKU","format":"code"},{"key":"product","label":"Product"},{"key":"stock","label":"Stock","format":"badge","tones":{"In stock":"ok","Low":"warn","Out":"danger"}},{"key":"price","label":"Price","format":"number","sortable":true},{"key":"updated","label":"Updated","format":"date","sortable":true}]'
          rows='[{"sku":"KB-104","product":"Keyboard","stock":"In stock","price":89.5,"updated":"2025-04-02"},{"sku":"MS-220","product":"Mouse","stock":"Low","price":39,"updated":"2025-05-18"},{"sku":"HD-310","product":"Headset","stock":"Out","price":1249,"updated":"2025-01-27"}]'></jl-table>`,
      title: 'Formats',
    },
  ],
  level: 'organism',
  name: 'Table',
  playground: {
    attributes: {
      columns:
        '[{"key":"name","label":"Name","sortable":true},{"key":"status","label":"Status","format":"badge","tones":{"Active":"ok","Invited":"info"}},{"key":"projects","label":"Projects","format":"number","sortable":true}]',
      rows: '[{"id":1,"name":"Ada Lovelace","status":"Active","projects":12},{"id":2,"name":"Ben Okafor","status":"Invited","projects":4},{"id":3,"name":"Chen Wei","status":"Active","projects":27}]',
      selectable: true,
    },
    width: 'full',
  },
  props: [
    {
      attribute: 'columns',
      control: { kind: 'json' },
      default: '[]',
      description:
        'The columns: key (the field shown), label, and optionally align, sortable, width, format (text, number, date, badge, code) and tones (a badge tone per value).',
      name: 'columns',
      type: 'TableColumn[]',
    },
    {
      attribute: 'rows',
      control: { kind: 'json' },
      default: '[]',
      description: 'The rows, as plain objects.',
      name: 'rows',
      type: 'Record<string, unknown>[]',
    },
    {
      attribute: 'row-key',
      control: { kind: 'text' },
      default: "'id'",
      description: 'The field that tells rows apart, for the selection.',
      name: 'rowKey',
      type: 'string',
    },
    {
      attribute: 'sort-key',
      control: { kind: 'text' },
      default: "''",
      description: 'The column the rows are sorted by.',
      name: 'sortKey',
      type: 'string',
    },
    {
      attribute: 'sort-direction',
      control: { kind: 'select', options: ['none', 'asc', 'desc'] },
      default: "'none'",
      description: 'The order of that column.',
      name: 'sortDirection',
      type: "'none' | 'asc' | 'desc'",
    },
    {
      attribute: 'selectable',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Adds a checkbox to each row, and one that selects them all.',
      name: 'selectable',
      type: 'boolean',
    },
    {
      attribute: 'selected',
      control: { kind: 'json' },
      default: '[]',
      description: 'The keys of the selected rows.',
      name: 'selected',
      type: 'Array<string | number>',
    },
    {
      attribute: 'dense',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shorter rows.',
      name: 'dense',
      type: 'boolean',
    },
    {
      attribute: 'striped',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shades every other row.',
      name: 'striped',
      type: 'boolean',
    },
    {
      attribute: 'max-height',
      control: { kind: 'text' },
      default: "''",
      description: 'A height past which the rows scroll under the header: 320px, 50vh; a number is pixels.',
      name: 'maxHeight',
      type: 'string',
    },
    {
      attribute: 'empty-text',
      control: { kind: 'text' },
      default: "'No data'",
      description: 'What the table says when it has no rows.',
      name: 'emptyText',
      type: 'string',
    },
    {
      attribute: 'loading',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shows placeholder rows while the data loads.',
      name: 'loading',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The name of the table for screen readers.',
      name: 'label',
      type: 'string',
    },
    {
      default: '{}',
      description: 'Draws the cells of some columns by code, by column key: (row) => Node.',
      name: 'renderers',
      type: 'Record<string, (row: Record<string, unknown>) => Node>',
    },
  ],
  styling: [{ description: 'The scrolling frame around the table.', name: 'base' }],
  summary: 'Rows of records under column headings, with sorting, selection, formats and a sticky header.',
  tag: 'jl-table',
};
