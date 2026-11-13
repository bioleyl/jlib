# Lists, tables, trees

How a page shows a collection with jlib: a table to compare, rows to read, cards to recognise, a tree for what
nests; then searching, filtering and loading more. The whole list page of the recipes puts it together
([recipes.md](recipes.md#a-list-page-that-creates)).

## Contents

- Which form
- Tables
- Cells drawn by code
- Rows that open, selection, sorting
- Search and filters
- Long lists: Show more, pages
- Rows: `JlListItem`
- Trees
- Split views

## Which form

| The collection | Component |
|---|---|
| Records compared column by column | `JlTable<Row>` |
| Items read one by one, with a line of detail | `JlListItem`s in a list |
| Things recognised by a picture or a few figures | `JlCard`s in a grid |
| What nests: folders, a hierarchy | `JlTree` |
| A list beside the item it opens | `JlSplitView` with the list in `start` and the item in `end` |

## Tables

```ts
const COLUMNS: TableColumn<Order>[] = [
  { key: 'number', label: 'Order', format: 'code' },
  { key: 'customer', label: 'Customer', description: 'city' },
  { key: 'status', label: 'Status', format: 'badge', tones: { Late: 'warn', Open: 'info', Shipped: 'ok' } },
  { key: 'total', label: 'Total', format: 'number', sortable: true },
  { key: 'placedAt', label: 'Placed', format: 'date', sortable: true, width: 140 },
  { key: 'note', label: 'Note', wrap: true },
];
```

```tsx
<JlTable<Order> columns={COLUMNS} rowKey="id" label="Orders" emptyText="No order matches." />
```

```ts
this._refs.table.rows.set(orders);
```

- A column's `key` is a field of the row, checked by the type; `format` is `text`, `number` (localised,
  right-aligned), `date`, `datetime`, `badge` (with `tones` by value) or `code`; `description` names a field shown as
  a quieter line under the value; `wrap` lets long text break over lines instead of widening the table; `width` and
  `align` when the default does not suit.
- `rowKey` names the field that tells rows apart (`id` by default): the selection and the open rows go by it.
- `dense` for shorter rows, `striped`, `maxHeight` (`'50vh'`, or pixels) for a header that stays while the rows
  scroll, `loading` for placeholder rows, `marked` (keys) to point at rows such as a search's matches.
- Rows are plain objects of a `type`. A table that does not say its type takes any object.

## Cells drawn by code

`renderers` draw the cells of some columns, by key, from the whole row, typed as the table is. A column of the
table's own (actions) is named in the second type parameter:

```tsx
// src/pages/members-table.tsx
import { Jadis } from '@jadis/core';
import { JlBadge, JlButton, JlFacts, JlTable } from '@syware/jlib';

import type { TableColumn, TableRenderers } from '@syware/jlib';

type Member = { id: string; name: string; email: string; role: 'Admin' | 'Member'; active: boolean };

type MemberColumn = 'actions';

const COLUMNS: TableColumn<Member, MemberColumn>[] = [
  { description: 'email', key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'active', label: 'Status' },
  { align: 'right', key: 'actions', label: 'Actions', width: 96 },
];

/** The members of a team: each a row that opens on its details, with its own actions. */
export class MembersTable extends Jadis {
  static readonly selector = 'app-members-table';

  readonly events = this.useEvents<{ remove: Member }>();

  private readonly _refs = this.useRefs((ref) => ({
    table: ref<JlTable<Member, MemberColumn>>('jl-table'),
  }));

  private readonly _renderers: TableRenderers<Member, MemberColumn> = {
    actions: (member) => (
      <JlButton variant="ghost" size="sm" icon="trash" hint={`Remove ${member.name}`} onPress={() => this.events.emit('remove', member)} />
    ),
    active: (member) => <JlBadge tone={member.active ? 'ok' : 'neutral'} label={member.active ? 'Active' : 'Invited'} />,
  };

  templateHtml(): Node {
    return (
      <JlTable<Member, MemberColumn>
        columns={COLUMNS}
        renderers={this._renderers}
        detail={(member) => <JlFacts items={[{ label: 'Email', value: member.email }]} />}
        expandable="single"
        rowKey="id"
        label="Members"
      />
    );
  }

  /** Shows these members. */
  show(members: Member[]): void {
    this._refs.table.rows.set(members);
  }
}

MembersTable.register();
```

- A renderer returns a node, drawn in the table's shadow root: the view's CSS does not reach it, so draw it with
  jl-* components (`JlLink`, `JlBadge`, `JlButton`), not classes of the view. Its `on…` props work as anywhere.
- A renderer replaces the column's format: format the value yourself there (`Intl`), or keep the format and draw
  only what needs code.
- `cellOf<Row>((row) => node)` types a renderer of a table that does not say its type.
- Row actions are icon buttons with a `hint` (their accessible name), never shown only on hover.
- In a test, what renderers drew is in `table.shadowRoot`.

## Rows that open, selection, sorting

- `expandable="single"` (one open at a time) or `"multiple"`, and `detail = (row) => Node` (a property, or a JSX
  prop) draws what an open row shows under it. `expanded` holds the open keys; `toggle(key, open)` opens one from
  code; the `toggle` event says which.
- `selectable` adds a checkbox per row and one for all; `selected` holds the keys; `selection` emits them. Actions on
  the selection go in a bar above the table that shows while something is selected.
- `sortable` on a column lets people sort by it; `sortKey` and `sortDirection` set the order. The table sorts the
  rows it holds; a list loaded page by page sorts on the server: listen to `sort` (`{ key, direction }`), load the
  first page again in that order, and keep the order in the address.
- `press` says which row was pressed and how: `{ key, row, button, event }`, `button` being `'main'` (a click),
  `'auxiliary'` (a middle click) or `'secondary'` (a right click, the keyboard's menu key, a long press), and `event`
  the browser's own. Check the button before acting: every press arrives here. Cancel the event to refuse the press:
  `event.preventDefault()` keeps the browser's menu away, so the page shows its own at `event.clientX`,
  `event.clientY`, and keeps an expandable row closed. A press on a control in the row (a link, a button, its
  checkbox) is that control's and fires none. Rows take no focus: what a click opens also needs a link or a button
  in the row, for the keyboard; `--row-cursor: pointer` on the table says the rows open something.

```tsx
<JlTable<Order>
  rows={orders}
  columns={COLUMNS}
  onPress={({ button, event, row }) => {
    if (button === 'secondary') {
      event.preventDefault();
      this.openMenu(row, event);
      return;
    }
    if (button === 'main') {
      router.goto('order', { id: row.id });
    }
  }}
/>
```

## Search and filters

- A `JlSearch` above the list (`onSearch`, fired once typing pauses, on Enter, or when cleared); `shortcut="/"`
  focuses it from anywhere.
- Filters are a `JlChipGroup<Value>`: one choice (`required`, with an "All" option) or several (`multiple`), each
  option with a `badge` count when the server gives them. A `JlSegmented` switches between views of the same list.
- The search, the filters and the sort live in the address: write them with the router's `replacePath` (no step of
  the history per keystroke), and read them in the page's `onRoute`, which loads the list. A shared or reloaded
  address shows the same list.
- Nothing matching is a `JlEmpty` with the way back ("Show every order"), not the empty state of a list that has
  nothing yet ("New order").

## Long lists: Show more, pages

```tsx
<JlLoadMore onMore={() => void this.loadMore()} />
```

```ts
more.shown.set(table.rows.get().length);
more.total.set(list.total); // once all show, it takes no room
more.loading.set(true);     // the next page is on its way
```

SyWare's lists load 30 at a time with **Show more** and "30 of 120" beside it. `JlPagination` (`page`, `pages`,
`change`) is for results people page through by number.

## Rows: `JlListItem`

```tsx
<ul class="list">
  <li><JlListItem heading="Weekly export" description="Every Monday at 6:00" icon="file-text" meta="2 min" href="/exports/weekly" /></li>
</ul>
```

`href` makes the row a link (with a chevron); `interactive` makes it pressable (`press`); `selected` marks the current
one; slot `start` takes an avatar, slot `end` controls. Each row drawn in a loop gets its own `on…` prop: jl-* events
do not bubble to the list.

## Trees

```ts
tree.items.set([{ children: [{ href: '/files/readme', id: 'readme', label: 'README.md' }], id: 'docs', label: 'docs' }]);
tree.loader = async (parent, offset) => fetchLevel(parent, offset, this.killSignal); // { items, total }
```

- `items` for a tree held whole; `loader` for a large one, loaded a level and a page at a time (`lazy` folders, a row
  that loads the next page). `badge` gives a folder its count.
- `value` is the selected item; `select` fires for items without `href`; `reveal(path)` opens the folders down to an
  item and selects it; `reload()` loads the roots again.
- `press` fires before the tree acts on a press on an item: `{ id, item, button, event }`, as on a table's row, with
  Enter and Space as the main button too. Cancel the event to refuse it: the item is not selected, its folder stays
  as it is, a link is not followed, and for the secondary button the browser's menu stays away.
- A search in a large tree lists its matches as `JlListItem`s in place of the tree.

## Split views

```tsx
<JlSplitView stackBelow={720} position={32} onStack={(stacked) => this.drawStacked(stacked)}>
  <div slot="start">…the list…</div>
  <div slot="end">…the item open…</div>
</JlSplitView>
```

- Two panes with a divider people drag (`position`, in percent; `change` when moved). Under `stackBelow` pixels,
  one pane at a time: `pane` (`start` or `end`) says which, and `stack` tells the page, which shows a back link only
  while stacked.
- It draws only its `start` and `end` panes: a dialog goes beside it, not in it.
- With nothing open, the end pane is the collection's page and its `JlEmpty`.
