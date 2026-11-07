# Applying the patterns with jlib

Each pattern with the components that do it, as a view writes them: by class in JSX. The components' whole API is in
the `jlib-official` skill (`references/components/<tag>.md`), and its `references/recipes.md` has a whole app built
this way (frame, list, detail page, settings form).

## Contents

- The frame
- The page header
- A list
- Empty states
- Forms
- Errors
- Feedback
- Confirmations and undo
- Statuses, times and durations
- Search
- Phones
- Accounts

## The frame

```tsx
<JlAppShell narrowHeader>
  {/* The phone's top bar: menu (the shell's), the app, the search and the person, compact. */}
  <div slot="header" class="top-bar">
    <a class="brand" href="/"><JlAppIcon icon={APP_ICON} size={24} /> {APP_NAME}</a>
    <JlSearchButton compact onPress={() => this._refs.palette.show()} />
  </div>
  <JlSideNav<Place> slot="nav" sections={NAV_SECTIONS} collapsible label="Main navigation">
    <div slot="header" class="nav-header">
      <a class="brand" href="/"><JlAppIcon icon={APP_ICON} size={24} /> {APP_NAME}</a>
      <JlSearchButton onPress={() => this._refs.palette.show()} />
    </div>
    <JlMenu<AccountAction> slot="footer" items={ACCOUNT_ITEMS} placement="top-start" onSelect={(action) => this.act(action)}>
      <JlAccountButton slot="trigger" name={user.name} description={user.roleLabel} />
    </JlMenu>
  </JlSideNav>
  <JlPageOutlet />
  <JlTabBar<Place> slot="tabs" items={TAB_ITEMS} more="More" label="Main navigation" />
  <JlCommandPalette commands={COMMANDS} placeholder="Search orders, articles, pages…" />
</JlAppShell>
```

```ts
// The destinations, the most used first, a count on what waits; Administration for administrators only.
const NAV_SECTIONS: SideNavSection<Place>[] = [
  {
    items: [
      { badge: 3, href: '/inbox', icon: 'inbox', id: 'inbox', label: 'Review inbox' },
      { href: '/orders', icon: 'package', id: 'orders', label: 'Orders' },
    ],
  },
  { items: [{ href: '/users', icon: 'users', id: 'users', label: 'Users' }], label: 'Administration' },
];

const ACCOUNT_ITEMS: MenuItem<AccountAction>[] = [
  { icon: 'user', label: 'My account', value: 'account' },
  { icon: 'log-out', label: 'Sign out', value: 'sign-out' },
];
```

- The tab bar: the daily work of the role, four at most, with their counts; **More** opens the drawer.
- A work surface that needs the width (an editor, a canvas) sets the side nav's `collapsed` while it is open, and
  gives it back as people left it.

## The page header

```tsx
<JlPage heading={`Order ${order.number}`} description="Placed by Alpine Électricité SA, 2 Nov." back="/orders" backLabel="Orders" appName={APP_NAME}>
  <JlBadge slot="meta" />  {/* badge.showStatus(ORDER_STATUS[order.status]) */}
  <JlButton slot="actions" label="Invoice" icon="download" />
  <JlMenu<OrderAction> slot="actions" items={MORE_ACTIONS} label="More actions">
    <JlButton slot="trigger" variant="ghost" icon="ellipsis" hint="More actions" />
  </JlMenu>
  <JlButton slot="actions" variant="primary" label="Prepare" />
</JlPage>
```

```ts
// The rarer actions; the one that destroys last, after a line, in red.
const MORE_ACTIONS: MenuItem<OrderAction>[] = [
  { icon: 'copy', label: 'Duplicate', value: 'duplicate' },
  { divider: true },
  { danger: true, icon: 'trash', label: 'Delete order', value: 'delete' },
];
```

- `width`: `form` for one column of fields, `standard` for most pages, `wide` for tables of many columns, `full`
  for work surfaces.
- Until the thing has loaded, the heading is the collection's name; then the thing's.

## A list

```tsx
<div class="toolbar">
  <JlSearch label="Search the orders" placeholder="Search by number or customer" shortcut="/" />
  <JlChipGroup<StatusFilter> label="Status" options={STATUS_OPTIONS} value={['open']} required />
</div>
<p class="count">12 orders</p>
<JlLoadState errorHeading="The orders could not be loaded">
  <JlTable<Order> columns={COLUMNS} renderers={RENDERERS} rowKey="id" label="Orders" />
  <JlLoadMore />
  <JlEmpty slot="empty" />
</JlLoadState>
```

```ts
// The filter people use most first, with its count; All last. The list opens on what needs action.
const STATUS_OPTIONS: ChipGroupOption<StatusFilter>[] = [
  { badge: 12, label: 'Open', value: 'open' },
  { badge: 3, label: 'Late', value: 'late' },
  { label: 'All', value: 'all' },
];
```

- Rows are links: a renderer draws the first column as a `JlLink` to the item's page; a `JlListItem` takes `href`.
- Row actions: two at most, icon buttons with a precise `hint`, the rest in a `JlMenu` behind `ellipsis`:

```tsx
<JlListItem heading="Rita Keller" description="rita@example.com" href="/users/rita">
  <JlAvatar slot="start" name="Rita Keller" size="sm" />
  <JlBadge slot="end" label="Reviewer" />
  <JlButton slot="end" variant="ghost" size="sm" icon="pencil" hint="Edit Rita Keller" />
</JlListItem>
```

- A row whose details take a few lines opens under itself: `expandable="single"` and `detail` on `JlTable`.
- The search, the chips and the sort write the address; the page reads them back when the router gives it its route.

## Empty states

```tsx
{/* Nothing yet */}
<JlEmpty icon="package" heading="No articles yet" description="Articles are what employees order from the shop.">
  <JlButton variant="primary" icon="plus" label="New article" href="/articles/new" />
</JlEmpty>

{/* Nothing matches */}
<JlEmpty icon="search" heading="No article matches “cable”" description="Try another word or another category.">
  <JlButton label="Clear the search" />
</JlEmpty>

{/* All done */}
<JlEmpty icon="check" heading="You are all caught up" description="New reviews show up here as workflows send them." />
```

`size="sm"` inside a card or a narrow panel.

## Forms

| How it saves | Components |
|---|---|
| Dialog with **Save** | A `<form>` around a `JlDialog`; the fields in a `JlStack`; **Cancel** then the primary in `slot="actions"` |
| Page with **Save** | A `JlPage` with `width="form"`; the primary under the last field, on the left; a toast once saved |
| Autosave | No Save button; the state where people look: "Saving…", "All changes saved" |
| At once | A `JlSwitch` or a `JlSegmented` that applies on `change` |

```tsx
<JlField label="Job number" hint="As on the work order." required error="Enter the job number, like CH-2026-0160.">
  <JlInput name="job" required />
</JlField>
```

- The error under its field, from the first submit on, and gone as soon as the answer is right.
- A page with a form: `this.canLeave = guardLeave({ isDirty, signal: this.killSignal, text: 'Your changes to … are lost.' })`.

## Errors

| What failed | Component |
|---|---|
| An answer | `JlField`'s `error` |
| Saving a form or a dialog | `JlAlert tone="danger"` at the top of the form, or above the dialog's buttons |
| An action from a row, a switch, a menu | `toast({ heading: 'The order was not cancelled', text: why, tone: 'danger' })` |
| Loading | `JlLoadState`'s error, with its `errorHeading` ("The orders could not be loaded") and **Try again** |
| A thing that does not exist | `JlEmpty` in place of the page: "This order does not exist", a link to the list |
| A page of another role | `JlEmpty` in place of the page: "For administrators", and who to ask |
| The server out of reach | One `JlAlert tone="warn"` at the top of the main area, until it is back |

## Feedback

```ts
// src/lib/notify.ts
import { toast } from '@syware/jlib';

import type { ToastHandle, ToastOptions } from '@syware/jlib';

/** The app's one way to say what happened out of view: jlib's toasts, with their durations (5 s, 8 with an action). */
export const notify = (options: ToastOptions): ToastHandle => toast(options);

/** What was done, with Undo: the page goes back as it was if people press it. */
export const notifyUndo = (heading: string, undo: () => void): ToastHandle =>
  toast({ actionLabel: 'Undo', heading, onAction: undo });
```

- The heading names what happened, to what: "Order #12 sent", not "Saved".
- A change in view needs no toast: the row appears, the switch turns.
- Work that runs: `loading` on the button (a few seconds), `JlSteps` and `JlProgress` with what happens now in words
  (longer), its status live in its list and a toast when it ends (in the background).

## Confirmations and undo

```ts
const cancel = await confirmDialog({
  cancelLabel: 'Keep order',
  confirmLabel: 'Cancel order',
  heading: `Cancel order #${order.number}?`,
  text: 'Its reservations are released. This cannot be undone.',
  tone: 'danger',
});
```

```ts
removeFromBasket(item);
notifyUndo(`${item.name} removed from the basket`, () => restoreToBasket(item));
```

People and things with a history are deactivated (**Deactivate**, **Activate**), not deleted.

## Statuses, times and durations

```ts
// src/lib/run-status.ts
import type { StatusLook } from '@syware/jlib';

export type RunStatus = 'running' | 'review' | 'done' | 'failed' | 'cancelled';

// A new status is a compile error until it has its look.
export const RUN_STATUS: Record<RunStatus, StatusLook> = {
  cancelled: { hint: 'Stopped before it ended.', label: 'Cancelled', tone: 'neutral' },
  done: { label: 'Done', tone: 'ok' },
  failed: { hint: 'A step failed: open the run to see which.', icon: 'circle-x', label: 'Failed', tone: 'danger' },
  review: { hint: 'Waiting for a reviewer to decide.', label: 'To review', tone: 'info' },
  running: { label: 'Running', tone: 'info' },
};
```

```ts
badge.showStatus(RUN_STATUS[run.status]);
formatRelativeTime(run.startedAt, Date.now(), locale); // "5 minutes ago"
formatDuration(run.durationMs, locale); // "33 sec", "2 min", "< 1 sec"
```

## Search

```ts
const COMMANDS: PaletteCommand[] = [
  { group: 'Go to', icon: 'package', id: '/orders', label: 'Orders' },
  { group: 'Actions', icon: 'plus', id: '/orders/new', label: 'New order…' },
  { group: 'Actions', icon: 'moon', id: 'theme:dark', label: 'Dark theme' },
];
```

On `search`, the page sets `loading`, asks the server, and sets the commands again with what it found first, in a
group **Waiting for you** or by kind, each `result: true`, its `description` saying what it is.

## Phones

```css
/* A phone task's main action, in a bar along the bottom, above the shell's tab bar. */
@media (max-width: 959px) {
  .task-bar {
    position: sticky;
    bottom: calc(var(--jl-shell-bottom, 0px) + var(--jl-space-4));
    display: grid;
    grid-auto-flow: column;
    gap: var(--jl-space-2);
  }
}
```

```tsx
<JlInput name="quantity" inputmode="numeric" />
<JlSplitView stackBelow={960} />
```

Every page at 390px wide, in both themes; the controls grow to 44px on touch screens by themselves.

## Accounts

```tsx
<JlAuthLayout pitch="Orders that *arrive*." text="Order what the job needs; logistics prepares it." points={['Order from the van', 'Follow each order', 'Approve in one tap']}>
  <span slot="brand"><JlAppIcon icon={APP_ICON} size={32} /> {APP_NAME}</span>
  <form>…"Sign in", the username and the password, a JlAlert for a wrong answer…</form>
</JlAuthLayout>
```

- **My account**: name, role and what it allows, **Appearance** (As my device, Light, Dark: a `JlSegmented`),
  **Language** (each in its own words: Français, Deutsch), the password, **Sign out** as a secondary button.
- **Settings**: the company's, under **Administration**.
