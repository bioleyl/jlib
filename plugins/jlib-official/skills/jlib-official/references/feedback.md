# States and feedback

How a page shows that something loads, that there is nothing, that something failed, that an action runs, worked
or needs a yes; with which component. The `syware-ux` skill says when each one is right; this guide says how.

## Contents

- What to use
- Load states
- Empty
- Errors in the page
- An action that runs
- Toasts
- Confirmations
- Downloads
- Progress and processes
- Status

## What to use

| Situation | Component |
|---|---|
| A list, a table or a section waits for its data | `JlLoadState` around it, loaded with `load()` |
| A page waits for the next page's data | `JlPageOutlet`, which keeps the current page meanwhile |
| Another wait that replaces what is shown | `JlLoadingBar` (`active`) |
| Nothing yet, nothing matching, not found | `JlEmpty` where the content would be, with the way on |
| A form's or a page's error, a mode the app is in (offline) | `JlAlert` in place (`tone="danger"`, `warn`, `info`) |
| A button's action runs | the button's own `loading` |
| An outcome out of view, a failed action, Undo | `toast()` |
| Before what cannot be undone | `await confirmDialog({ … })` |
| A file the server makes | `download(url, { title })` |
| How much of a task is done | `JlProgress`, `JlProgressRing`; a process's steps: `JlSteps` |
| The state of a thing | `JlBadge` with a tone, from a map of states (`showStatus`) |

Never `alert()`, `confirm()` or `prompt()`: they look like another program and freeze the page.

## Load states

A `JlLoadState` shows a skeleton while its data comes (after `delay`, 300 ms, so a quick answer shows nothing),
then its content, its `empty` slot, or an error with **Try again**:

```tsx
<JlLoadState skeleton="rows" count={5} errorHeading="The orders could not be loaded">
  <JlTable<Order> columns={COLUMNS} rowKey="id" />
  <JlEmpty slot="empty" icon="package" heading="No orders yet" />
</JlLoadState>
```

```ts
void this._refs.state.load({
  draw: (orders) => this._refs.table.rows.set(orders),
  fetch: () => fetchOrders(this.killSignal),
  isEmpty: (orders) => orders.length === 0,
});
```

- `fetch` returns a promise; a rejection shows the error, and **Try again** runs the same task again (the `retry`
  event says so). `draw` gets the value; `isEmpty` decides the empty slot.
- A second `load()` while one runs wins over it; a refresh keeps the content shown (no skeleton) and shows an error
  only if nothing is shown yet. `load()` resolves `true` once drawn, `false` when it failed.
- `skeleton` is `rows`, `cards` or `lines`; `slot="loading"` takes a skeleton of your own made of `JlSkeleton`s.
- The page outlet waits for every load state of the next page before showing it (`max-wait`, 3 s), so a page loads
  its data in load states rather than with its own spinner. `JlLoadState.whenSettled(root, signal)` waits the same
  way in your code or tests.
- In `onConnect`, load once: `if (this._refs.state.state.get() !== 'loading') return;` before `load()`.

## Empty

```tsx
<JlEmpty icon="search-x" heading="No order matches" description="Try another word, or show every status.">
  <JlButton label="Show all" onPress={() => this.clearFilters()} />
</JlEmpty>
```

`size="sm"` in a card or a panel. The heading says what is empty or why; the description and the buttons give the
way on (create the first one, clear the filters). A table also has `emptyText` for the few words it says itself.

## Errors in the page

```tsx
<JlAlert tone="danger" heading="Not saved" description="The server refused the job number: it is already used." />
```

- `tone`: `info`, `ok`, `warn`, `danger` (the last two interrupt screen readers), `neutral`, `accent`.
- `description` is plain text; links and markup go in the default slot; buttons in `slot="actions"`.
- `dismissible` adds an ×. An error about one field goes under that field instead ([forms.md](forms.md)).

## An action that runs

```ts
private async send(): Promise<void> {
  const button = this._refs.send;
  button.loading.set(true);
  try {
    await sendOrder(this.order, this.killSignal);
    toast({ heading: 'Order sent', tone: 'ok' });
  } catch {
    toast({ heading: 'The order was not sent', text: 'Try again in a moment.', tone: 'danger' });
  } finally {
    button.loading.set(false);
  }
}
```

A loading button shows a spinner and ignores presses: no double submission, nothing to disable by hand.

## Toasts

`toast(options)` shows a notification in the page's toaster, made on first use (no `JlToaster` to place unless its
`placement` or `max` must change):

```ts
const handle = toast({
  actionLabel: 'Undo',
  heading: 'Order archived',
  onAction: () => void restoreOrder(order.id),
  tone: 'neutral',
});
handle.dismiss(); // closes it early; handle.update({ … }) changes it while it shows
```

- Options: `heading`, `text`, `tone` (`neutral`, `ok`, `warn`, `danger`, `info`), `icon`, `duration` (5000 ms; 8000
  for an error or with an action; 0 until closed), `closable` (on by default), `actionLabel` with `onAction`,
  `working` and `progress` for work that runs.
- A toast is for an outcome out of view, a failure, or an Undo. What shows on the page (the new row, the saved form)
  needs none, and a form's error stays in the form, not in a toast that goes.

## Confirmations

```ts
const confirmed = await confirmDialog({
  cancelLabel: 'Keep it',
  confirmLabel: 'Delete',
  heading: `Delete ${order.number}?`,
  text: 'Its lines and invoices are deleted with it. This cannot be undone.',
  tone: 'danger',
});
if (!confirmed) {
  return;
}
```

- `confirmDialog` resolves `true` for confirm, `false` for cancel, Escape or the backdrop. The heading names the
  thing; the text says the consequence; the confirm label says what it does ("Delete"), never "OK".
- `tone: 'danger'` colours the confirm button and starts the focus on Cancel.
- What can be undone does not ask: it happens, with **Undo** in its toast.
- A page with a form guards it with `guardLeave` ([forms.md](forms.md#leaving-a-form)), which asks the same way.

## Downloads

```ts
const result = await download(`/api/orders/${order.id}/invoice.pdf`, { title: `Invoice of ${order.number}` });
if (result.outcome === 'saved') {
  // result.name, result.size
}
```

A toast shows its progress with **Cancel**, then the file is saved under the server's name
(`Content-Disposition`), or the toast says why it failed. `init` passes the request's options (headers,
credentials). A file the browser can fetch at once is a `JlButton` with `href` and `download` instead.

## Progress and processes

```tsx
<JlProgress label="Importing" value={42} showValue />
<JlSteps items={[{ label: 'Cart' }, { label: 'Payment', failed: true }, { label: 'Done' }]} current={1} />
<JlStat label="Open orders" value="128" delta="+12" icon="package" points={[96, 104, 110, 121, 128]} />
```

A `JlProgress` without `value` is indeterminate. Progress shows where the work started (a card, the row); a toast
with `working` and `progress` follows work the person left.

## Status

A thing's state is a `JlBadge` whose label, tone, icon and hint come from one map per kind of thing, so every view
says a state the same way:

```ts
// src/lib/order-status.ts
import type { StatusLook } from '@syware/jlib';
import type { OrderStatus } from '../types/order.types';

export const ORDER_STATUS: Record<OrderStatus, StatusLook> = {
  Late: { hint: 'Past its delivery date.', icon: 'clock', label: 'Late', tone: 'warn' },
  Open: { hint: 'Waiting for logistics to prepare it.', label: 'Open', tone: 'info' },
  Shipped: { label: 'Shipped', tone: 'ok' },
};
```

```ts
badge.showStatus(ORDER_STATUS[order.status]);
```

In a table, a `badge` column takes `tones` by value instead; a renderer with a `JlBadge` takes the same map. Its
icon names are registered like any other.
