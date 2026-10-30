import { oneOf, TABLE_EXPANSIONS } from '@syware/jlib';

import tableCode from '../typing/jl-table.code.ts?raw';
import tableJsx from '../typing/jl-table.jsx.tsx?raw';

import type { JlButton, JlFacts, JlSegmented, JlTable, TableColumn, TableRow, Tone } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';
import type { Member, Order } from '../../types/jl-table.doc.types';

/** A badge tone per value; the values are labels people read, written as they show. */
const tonesOf = (entries: [string, Tone][]): Record<string, Tone> => Object.fromEntries(entries);

const USER_COLUMNS: TableColumn<Member>[] = [
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

const USERS: Member[] = [
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

const ORDER_COLUMNS: TableColumn<Order>[] = [
  { format: 'code', key: 'number', label: 'Order', width: 100 },
  { key: 'customer', label: 'Customer', sortable: true },
  {
    format: 'badge',
    key: 'status',
    label: 'Status',
    tones: tonesOf([
      ['Delivered', 'ok'],
      ['Shipped', 'info'],
      ['Waiting', 'warn'],
    ]),
  },
  { format: 'number', key: 'total', label: 'Total', sortable: true },
  { format: 'date', key: 'placed', label: 'Placed', sortable: true },
];

const ORDERS: Order[] = [
  {
    address: 'Rue du Lac 12, 1800 Vevey',
    customer: 'Rita Keller',
    id: 1041,
    items: '3 × Bornes Wago 221-413, 1 × Câble TT 3×1,5 mm²',
    note: 'Leave it at the reception.',
    number: 'C-1041',
    placed: '2025-05-26',
    status: 'Delivered',
    total: 184.5,
  },
  {
    address: 'Chemin des Vignes 4, 1009 Pully',
    customer: 'Marc Dubois',
    id: 1042,
    items: '2 × Chevilles 6 mm',
    number: 'C-1042',
    placed: '2025-05-28',
    status: 'Shipped',
    total: 23.9,
  },
  {
    address: 'Avenue de la Gare 31, 1950 Sion',
    customer: 'Sara Monnier',
    id: 1043,
    items: '1 × Câble TT 3×1,5 mm², 10 × Bornes Wago 221-413',
    note: 'Call before delivering: the shop closes at noon.',
    number: 'C-1043',
    placed: '2025-05-30',
    status: 'Waiting',
    total: 412,
  },
];

/** An order's detail: where it goes, what it holds and its note. */
function orderDetail(order: Order): Node {
  const facts = document.createElement('jl-facts') as JlFacts;
  facts.items.set([
    { label: 'Deliver to', value: order.address },
    { label: 'Items', value: order.items },
    { label: 'Note', value: order.note ?? null },
  ]);
  return facts;
}

/** A member's detail in the playground: what the columns leave out. */
function memberDetail(member: Member): Node {
  const facts = document.createElement('jl-facts') as JlFacts;
  facts.items.set([
    { label: 'Email', value: member.email },
    { label: 'Joined', value: member.joined },
  ]);
  return facts;
}

/** The orders table, its details, and the control that lets one or any number of rows open. */
function wireOrders(root: HTMLElement): void {
  const table = root.querySelector<JlTable<Order>>('jl-table.orders');
  const mode = root.querySelector<JlSegmented>('.expansion');
  if (table === null || mode === null) {
    return;
  }
  table.detail = orderDetail;
  table.rows.set(ORDERS);
  mode.events.register('change', (value) => table.expandable.set(oneOf(TABLE_EXPANSIONS, 'single')(value)));
}

/** The users table and its toolbar: the selection count and a button that acts on it. */
function wireUsers(root: HTMLElement): void {
  const table = root.querySelector<JlTable<Member>>('jl-table.users');
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
    table.rows.set(table.rows.get().filter((member) => !selected.has(member.id)));
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

expandable lets rows open: a press on a row, or on its chevron, shows its detail under it, and the row stays as it
is. single keeps one row open, opening another closes it; multiple opens any number. detail draws what an open row
shows, from its row; expanded holds the keys of the open rows, and each opening and closing emits toggle.

The header stays on top while the rows scroll within max-height, and the table scrolls sideways on narrow screens.
For a cell that is more than a value (a person with an avatar, a link, a menu), give the column a renderer.`,
  events: [
    {
      description: 'A heading was pressed: the column and its new order.',
      detail: "{ key: keyof Row; direction: 'asc' | 'desc' | 'none' }",
      name: 'sort',
    },
    {
      description: 'The selection changed: the keys of the selected rows.',
      detail: 'Array<string | number>',
      name: 'selection',
    },
    {
      description:
        'A row opened or closed: its key and whether it is open now. When rows open one at a time, opening a row emits the close of the other first.',
      detail: '{ key: string | number; open: boolean }',
      name: 'toggle',
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
        type Member = { id: number; name: string; email: string; role: string; status: string; projects: number; joined: string };

        const table = root.querySelector<JlTable<Member>>('jl-table.users');
        const count = root.querySelector('.selection-count');
        const remove = root.querySelector<JlButton>('.remove-selected');
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
          table.rows.set(table.rows.get().filter((member) => !selected.has(member.id)));
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
        const table = root.querySelector<JlTable<Member>>('jl-table.people');
        table.renderers.set({
          name: (member) => {
            const cell = document.createElement('div');
            cell.innerHTML = '<strong></strong><div class="email" style="color: var(--jl-muted); font-size: 13px"></div>';
            cell.querySelector('strong').textContent = member.name;
            cell.querySelector('.email').textContent = member.email;
            return cell;
          },
        });
        table.rows.set(members.slice(0, 4));`,
      setup: (root) => {
        const table = root.querySelector<JlTable<Member>>('jl-table.people');
        table?.renderers.set({
          name: (member) => {
            const cell = document.createElement('div');
            cell.innerHTML =
              '<strong></strong><div class="email" style="color: var(--jl-muted); font-size: 13px"></div>';
            const name = cell.querySelector('strong');
            const email = cell.querySelector('.email');
            if (name !== null && email !== null) {
              name.textContent = member.name;
              email.textContent = member.email;
            }
            return cell;
          },
        });
        table?.rows.set(USERS.slice(0, 4));
      },
      title: 'Custom cells',
    },
    {
      description:
        "A press on a row, or on its chevron, opens it: its detail comes under it, the row staying as it is. One row at a time opens by default here; the other choice lets any number stay open. The detail lives in the table's shadow root: draw it with jl-* components, or style it inline.",
      html: `
        <div class="stack">
          <jl-segmented class="expansion" label="Rows that open" value="single"
            options='[{"value":"single","label":"One at a time"},{"value":"multiple","label":"Any number"}]'></jl-segmented>
          <jl-table class="orders" expandable="single" label="Orders" columns='${JSON.stringify(ORDER_COLUMNS)}'></jl-table>
        </div>`,
      script: `
        type Order = { id: number; number: string; customer: string; address: string; items: string; note?: string; … };

        const table = root.querySelector<JlTable<Order>>('jl-table.orders');
        table.detail = (order) => {
          const facts = new JlFacts();
          facts.items.set([
            { label: 'Deliver to', value: order.address },
            { label: 'Items', value: order.items },
            { label: 'Note', value: order.note ?? null },
          ]);
          return facts;
        };
        table.rows.set(orders);
        root.querySelector<JlSegmented>('.expansion').events.register('change', (value) =>
          table.expandable.set(oneOf(TABLE_EXPANSIONS, 'single')(value))
        );`,
      setup: wireOrders,
      title: 'Row details',
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
    {
      description:
        'Cells keep to one line and the table scrolls sideways; a column with wrap breaks its long text over lines instead.',
      html: `
        <jl-table row-key="field"
          columns='[{"key":"field","label":"Field","width":"28%"},{"key":"value","label":"Value","wrap":true}]'
          rows='[{"field":"title","value":"Minutes of the town council, 1952 to 1957"},{"field":"description","value":"The council\\u2019s minutes, bound by year, with the indexes of the decisions and the letters received, as the clerk kept them."},{"field":"storedAt","value":"https://archive.example.com/objects/rr_1622818982000013/i_2/content/minutes-1952-1957.pdf"}]'></jl-table>`,
      title: 'Long text',
    },
    {
      description: 'Marked rows, here the properties a search for “title” matches, stand out among the others.',
      html: `
        <jl-table row-key="name" marked='["title","additionalTitle"]'
          columns='[{"key":"name","label":"Property","format":"code"},{"key":"kind","label":"Kind"},{"key":"description","label":"Description","wrap":true}]'
          rows='[{"name":"abstract","kind":"string","description":"Abstract summarizing the resource."},{"name":"additionalTitle","kind":"string","description":"Another title of the resource."},{"name":"extent","kind":"string","description":"How much there is."},{"name":"title","kind":"string","description":"The name of the resource."}]'></jl-table>`,
      title: 'Marked rows',
    },
  ],
  level: 'organism',
  methods: [
    {
      description:
        'Opens or closes a row, as a press on it would, and emits toggle. When rows open one at a time, opening one closes the other.',
      name: 'toggle',
      signature: 'toggle(key: string | number, open: boolean): void',
    },
  ],
  name: 'Table',
  playground: {
    attributes: {
      columns:
        '[{"key":"name","label":"Name","sortable":true},{"key":"status","label":"Status","format":"badge","tones":{"Active":"ok","Invited":"info"}},{"key":"projects","label":"Projects","format":"number","sortable":true}]',
      expandable: 'single',
      rows: '[{"id":1,"name":"Ada Lovelace","status":"Active","projects":12,"email":"ada@acme.dev","joined":"2023-02-14"},{"id":2,"name":"Ben Okafor","status":"Invited","projects":4,"email":"ben@acme.dev","joined":"2024-06-03"},{"id":3,"name":"Chen Wei","status":"Active","projects":27,"email":"chen@acme.dev","joined":"2024-11-21"}]',
      selectable: true,
    },
    setup: (element) => {
      (element as JlTable<Member>).detail = memberDetail;
    },
    width: 'full',
  },
  props: [
    {
      attribute: 'columns',
      control: { kind: 'json' },
      default: '[]',
      description:
        'The columns: key (the field shown), label, and optionally align, sortable, width, format (text, number, date, datetime, badge, code), tones (a badge tone per value), description (a field shown as a quieter line under the value) and wrap (long text breaks over lines instead of widening the table). Typed by the rows, key and description are fields of a row.',
      name: 'columns',
      type: 'TableColumn<Row>[]',
    },
    {
      attribute: 'rows',
      control: { kind: 'json' },
      default: '[]',
      description:
        "The rows, as plain objects of the page's own type: JlTable<Order> takes orders. Untyped, any object.",
      name: 'rows',
      type: 'Row[]',
    },
    {
      attribute: 'row-key',
      control: { kind: 'text' },
      default: "'id'",
      description: 'The field that tells rows apart, for the selection.',
      name: 'rowKey',
      type: "keyof Row | 'id'",
    },
    {
      attribute: 'sort-key',
      control: { kind: 'text' },
      default: "''",
      description: 'The column the rows are sorted by.',
      name: 'sortKey',
      type: "keyof Row | ''",
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
      attribute: 'expandable',
      control: { kind: 'select', options: ['none', 'single', 'multiple'] },
      default: "'none'",
      description:
        'Rows open on a press, on the row or its chevron, to show their detail under them: single one at a time (opening a row closes the other), multiple any number.',
      name: 'expandable',
      type: "'none' | 'single' | 'multiple'",
    },
    {
      attribute: 'expanded',
      control: { kind: 'json' },
      default: '[]',
      description: 'The keys of the open rows. When they open one at a time, the last one is open.',
      name: 'expanded',
      type: 'Array<string | number>',
    },
    {
      default: 'null',
      description:
        'Draws what an open row shows under it, from its row: (order) => Node, the order typed as the table is. Drawn when the row opens.',
      name: 'detail',
      type: '((row: Row) => Node) | null',
    },
    {
      attribute: 'marked',
      control: { kind: 'json' },
      default: '[]',
      description:
        "The keys of rows to draw attention to, such as a search's matches: a bar at their start and a shade. A mark, not a selection: nothing acts on them.",
      name: 'marked',
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
      description:
        "Draws the cells of some columns by code, by column key: (row) => Node, the row typed as the table is. For a table that does not say its type of row, cellOf<Row>((row) => …) writes one for the page's own type.",
      name: 'renderers',
      type: '{ [key in keyof Row]?: (row: Row) => Node }',
    },
  ],
  styling: [{ description: 'The scrolling frame around the table.', name: 'base' }],
  summary:
    'Rows of records under column headings, with sorting, selection, rows that open on their details, formats and a sticky header.',
  tag: 'jl-table',
  typing: {
    code: tableCode,
    description:
      "Typed by its rows, JlTable<Order> takes rows of the page's own type, an interface included. Its columns (TableColumn<Order>) name fields of an order, and so do rowKey and sortKey: the editor completes them and refuses a misspelt one. Its renderers, its detail and its sort event read an order. In JSX, <JlTable rows={orders} /> reads the type from the rows. A column that is not a field, such as one of actions a renderer draws, is named: JlTable<Order, 'actions'>. Rows and columns written as JSON in HTML are not checked.",
    jsx: tableJsx,
  },
};
