import { list, preview, rules, section, table, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

const STOCK_COLUMNS = JSON.stringify([
  { key: 'name', label: 'Article', sortable: true },
  { format: 'code', key: 'reference', label: 'Reference' },
  { format: 'number', key: 'shelf', label: 'On the shelf', sortable: true },
  { format: 'number', key: 'reserved', label: 'Reserved', sortable: true },
  { format: 'number', key: 'available', label: 'Available', sortable: true },
]);

const STOCK_ROWS = JSON.stringify([
  { available: 24, name: 'Bornes Wago 221-413', reference: 'WAG-221-413', reserved: 6, shelf: 30 },
  { available: 42, name: 'Chevilles 6 mm', reference: 'CHV-6', reserved: 3, shelf: 45 },
  { available: 398, name: 'Câble TT 3×1,5 mm²', reference: 'CBL-TT-315', reserved: 2, shelf: 400 },
]);

const STATUS_CHIPS = JSON.stringify([
  { label: 'All', value: 'all' },
  { badge: 3, label: 'Waiting for review', value: 'waiting' },
  { badge: 1, label: 'Failed', value: 'failed' },
  { label: 'Done', value: 'done' },
]);

const STATUS_SEGMENTS = JSON.stringify([
  { label: 'All', value: 'all' },
  { label: 'Waiting for review', value: 'waiting' },
  { label: 'Failed', value: 'failed' },
  { label: 'Done', value: 'done' },
]);

const TOOLBAR = `
  <div class="stack" style="width: 100%">
    <div class="row">
      <jl-search placeholder="Search by job number or employee" label="Search orders" style="flex: 1 1 240px"></jl-search>
      <jl-select label="Employee" value="all" style="flex: 0 1 200px" options='[{"value":"all","label":"All employees"},{"value":"sara","label":"Sara Monnier"}]'></jl-select>
      <jl-select label="Sort" value="new" style="flex: 0 1 180px" options='[{"value":"new","label":"Newest first"},{"value":"old","label":"Oldest first"}]'></jl-select>
    </div>
    <jl-chip-group label="Status" value='["open"]' options='[{"value":"open","label":"Open","badge":12},{"value":"todo","label":"To do","badge":5},{"value":"progress","label":"In progress","badge":4},{"value":"ready","label":"Ready","badge":3},{"value":"all","label":"All"}]'></jl-chip-group>
    <span class="muted">12 orders</span>
  </div>`;

const ROW_FRAME =
  'width: 100%; max-width: 440px; border: 1px solid var(--jl-line); border-radius: var(--jl-radius); background: var(--jl-surface)';

const ROW_GOOD = `
  <div style="${ROW_FRAME}">
    <jl-list-item heading="Rita Keller" description="rita@example.com">
      <jl-avatar slot="start" name="Rita Keller" size="sm"></jl-avatar>
      <jl-badge slot="end" label="Reviewer"></jl-badge>
      <jl-button slot="end" variant="ghost" size="sm" icon="pencil" hint="Edit Rita Keller"></jl-button>
      <jl-button slot="end" variant="ghost" size="sm" icon="ellipsis" hint="More for Rita Keller"></jl-button>
    </jl-list-item>
  </div>`;

const ROW_BAD = `
  <div style="${ROW_FRAME}">
    <jl-list-item heading="Rita Keller" description="rita@example.com">
      <jl-badge slot="end" tone="accent" label="Reviewer"></jl-badge>
      <jl-button slot="end" variant="ghost" size="sm" icon="pencil" label="Edit"></jl-button>
      <jl-button slot="end" variant="ghost" size="sm" icon="trash" hint="Delete"></jl-button>
    </jl-list-item>
  </div>`;

export const collections: PatternDoc = {
  components: ['jl-table', 'jl-list-item', 'jl-card', 'jl-search', 'jl-chip-group', 'jl-select', 'jl-pagination'],
  icon: 'list',
  label: 'Lists and tables',
  lead: 'Most of the work in an app starts by finding something in a collection. A collection looks and behaves the same everywhere: the same toolbar, the same rows, the same way to open an item.',
  path: '/patterns/collections',
  sections: [
    section(
      'Choose the form',
      table(
        ['Form', 'When', 'With'],
        [
          'Table',
          'People compare values between items, or sort by them: stock levels, amounts, dates.',
          '`jl-table`',
        ],
        [
          'Rows',
          'Each item is read on its own, by its name and a line under it: people, runs, notifications, history.',
          '`jl-list-item`',
        ],
        [
          'Cards',
          'Items are recognised by their picture, or are few and each has controls of its own: the articles of a shop, workflows.',
          '`jl-card` in a grid',
        ]
      ),
      text(
        'Numbers repeated in every row under the same small labels are a table in disguise: give them columns, their headings once, and a sort.'
      ),
      preview(
        `<jl-table label="Stock" sort-key="available" sort-direction="asc" style="width: 100%" columns='${STOCK_COLUMNS}' rows='${STOCK_ROWS}'></jl-table>`,
        'Stock levels compare across articles: a table, sorted by what is running out.'
      ),
      text('On a phone, a table becomes rows, each with its main values. One collection keeps one form in an app.')
    ),
    section(
      'The toolbar',
      text('Above the collection, in this order, on one line where it fits:'),
      preview(TOOLBAR),
      list(
        '**Search** first, and widest: `jl-search`, its placeholder saying what it searches ("Search by job number or employee"). It filters as people type.',
        '**Filters** next: chips (`jl-chip-group`) for the few values people switch between often, with their counts; a select for a long list (an employee, a workflow), its first option naming the whole ("All employees").',
        '**Sort** last, as a select ("Newest first"), when more than one order is useful. A table sorts by its headings instead.',
        '**The count** under the toolbar: "12 orders", or "3 of 48 articles" while filtered.'
      )
    ),
    section(
      'Chips filter, segments switch',
      text('Both look like a row of choices. They do different jobs, and an app does not use one for the other.'),
      rules(
        {
          preview: `<jl-chip-group label="Status" value='["failed"]' style="width: 100%" options='${STATUS_CHIPS}'></jl-chip-group>`,
          text: 'Chips narrow one list down: by status, by category. They carry counts, and wrap or scroll sideways on a phone.',
        },
        {
          preview: `<jl-segmented label="Status" value="failed" options='${STATUS_SEGMENTS}'></jl-segmented>`,
          text: 'A segmented control switches between views or modes of the same place (To review / Decided, List / Board), not between filters.',
        }
      ),
      text(
        'Tabs (`jl-tabs`) split one thing into parts that are not the same list: the details of an article, its stock, its history.'
      )
    ),
    section(
      'Defaults',
      list(
        'A list opens on what needs action: open orders, reviews to decide. Everything else is one chip away, **All**.',
        'The sort serves the task: newest first for what arrives, due first for what is planned, by name for what people look up.',
        'Filters live in the address, not in a preference hidden somewhere: a reload or a shared link shows the same list.'
      )
    ),
    section(
      'Rows and cards',
      list(
        'The whole row or card opens the item. It is a link (`href`), with a chevron at the end when it leads to a page.',
        'The name first, in the text colour; a line under it in muted text; the status as a badge; the time at the end ("3 days ago").',
        'Two actions at most on a row, as icon buttons with a hint ("Edit Rita Keller"); the others in a **More** menu (`ellipsis`). The same action looks the same in every list.',
        'Actions are always shown: none appear only on hover, which phones do not have.',
        'A long line ends with an ellipsis; the page of the item shows it whole.'
      ),
      rules(
        { preview: ROW_GOOD, text: 'One kind of action button, a neutral role, the rest under More.' },
        {
          preview: ROW_BAD,
          text: 'A text button beside a lone bin, and a blue badge that marks nothing waiting.',
        }
      )
    ),
    section(
      'Long collections',
      list(
        'Load 30 to 50 items, then a **Show more** button under them, with "30 of 120" beside it. Feeds and histories grow at the bottom this way.',
        'A table of a fixed set, where the position of a row matters, takes `jl-pagination`.',
        'A list never stops at a limit without saying so: "The last 100 runs", and a way to see more.'
      )
    ),
    section(
      'Live collections',
      list(
        'A list others change (a queue, statuses, counts) updates by itself. See [Feedback](/patterns/feedback).',
        'A new item comes in at its place without moving what people are pointing at or reading.',
        'Selection, scroll and an opened item survive an update.'
      )
    ),
  ],
  summary: 'Tables, rows or cards; search, filters, sort and long lists.',
  title: 'Lists and tables',
};
