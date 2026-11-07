# Testing views

A view's tests run in Vitest with jsdom: they create the view, stub `fetch`, wait for what it queued, and read the
components' **inputs**, not their shadow DOM. What jsdom cannot show (layout, popovers, the top layer, a form's
submission through form-associated controls) is checked in a browser.

## Contents

- Setup
- The timing to wait for
- A page's test
- A dialog's test
- What jsdom lacks
- Firing a component's events
- In a browser

## Setup

```bash
npm install -D vitest jsdom
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: { jsx: { importSource: '@jadis/core', runtime: 'automatic' } },
  test: {
    // The views' ?inline styles import empty otherwise.
    css: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
```

## The timing to wait for

| After | Done | Wait for the rest |
|---|---|---|
| `document.body.append(view)` | The template, attribute callbacks, `useChange` values set before | `onConnect()` (a task later), then what it fetched |
| `field.set(value)` on a connected component | Its callback | Nothing |
| A stubbed `fetch` resolves | Nothing yet | The promise chain: a task |

```ts
/** Lets the components run what they queued: onConnect runs a task after connecting, and the reads resolve after. */
const settle = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve));
  await new Promise((resolve) => setTimeout(resolve));
};
```

Never sleep a fixed time: wait for the step that does the work. A page the router would give a route gets it from the
test, after its `onConnect`: `page.onRoute({ … })`.

## A page's test

The list of orders of the recipes: the address's search reaches the request, and the rows and the count show.

```tsx
// tests/orders-page.test.tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OrdersPage } from '../src/pages/orders-page';

import type { ActiveRoute } from '@jadis/core';
import type { JlLoadMore, JlTable } from '@syware/jlib';
import type { Order, OrderList } from '../src/types/order.types';

const ORDER: Order = {
  city: 'Sion',
  customer: 'Alpine Électricité SA',
  id: 'o-160',
  number: 'CH-2026-0160',
  placedAt: '2026-11-02',
  status: 'Late',
  total: 1290.5,
};

const LIST: OrderList = { items: [ORDER], total: 42 };

const settle = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve));
  await new Promise((resolve) => setTimeout(resolve));
};

const answerJson = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, status });

const routeOf = (query: string): ActiveRoute => ({
  componentSelector: OrdersPage.selector,
  name: 'orders',
  params: {},
  path: '/orders',
  query: new URLSearchParams(query),
});

describe('OrdersPage', () => {
  const fetchMock = vi.fn(async (_url: string) => answerJson(LIST));

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockClear();
    document.body.replaceChildren();
  });

  it('lists the orders the address searches for, and says how many there are', async () => {
    const page = document.body.appendChild(new OrdersPage());
    await settle();
    page.onRoute(routeOf('search=alpine&status=Late'));
    await settle();

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('search=alpine');
    const table = page.shadowRoot?.querySelector<JlTable<Order>>('jl-table');
    expect(table?.rows.get().map((order) => order.number)).toEqual([ORDER.number]);
    const more = page.shadowRoot?.querySelector<JlLoadMore>('jl-load-more');
    expect(more?.shown.get()).toBe(1);
    expect(more?.total.get()).toBe(LIST.total);
  });
});
```

- Read inputs with `.get()`: `page.heading.get()`, `table.rows.get()`, `state.state.get()` (`'ready'`, `'empty'`…).
- Components inside components: walk the shadow roots by tag, typed by the class
  (`list.shadowRoot?.querySelector<JlTable<Row>>('jl-table')`). What a table's renderers drew is in
  `table.shadowRoot`.
- Answer different addresses from one stub: `vi.fn(async (url: string) => answerOf(url))`.

## A dialog's test

```tsx
// tests/new-order-dialog.test.tsx
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { NewOrderDialog } from '../src/pages/new-order-dialog';

import type { JlField } from '@syware/jlib';

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

describe('NewOrderDialog', () => {
  beforeAll(() => {
    // jsdom has no modal dialogs: opening one only marks it open.
    HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it('says under each field what is missing, and sends nothing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const dialog = document.body.appendChild(new NewOrderDialog());
    await settle();
    dialog.open();

    dialog.shadowRoot?.querySelector('form')?.requestSubmit();

    const customer = dialog.shadowRoot?.querySelector<JlField>('jl-field.customer');
    expect(customer?.error.get()).toBe('Enter the customer, as on their invoices.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

## What jsdom lacks

- **Layout**: sizes are zero; components that measure (`jl-flow`, the indicator of `jl-tabs`) measure nothing, and
  `scrollIntoView` is skipped.
- **Modal dialogs**: no `showModal`; stub it as above for `JlDialog`, `JlConfirm` and `JlDrawer`.
- **The popover API**: menus, popovers, tooltips and toasts use it. Keep them out of a test's path, or mock jlib's
  functions while keeping the rest:

```ts
vi.mock('@syware/jlib', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@syware/jlib')>()),
  confirmDialog: vi.fn(async () => true),
  toast: vi.fn(() => ({ dismiss: vi.fn(), update: vi.fn() })),
}));
```

- **Form values of jl-* controls**: jsdom gives form-associated elements no form value; test what the view reads from
  the controls (`input.value.get()`), and the submission with `FormData` in a browser.
- **jlib's language** is module state: a test that needs French sets it (`await jlTexts.setLocale('fr')`) and puts
  it back.

## Firing a component's events

The component's own events go through its `events`: `button.events.emit('press')`, `tabs.events.emit('change', 'lines')`,
`input.events.emit('enter', '')`. A form submits with `form.requestSubmit()`; keys are `KeyboardEvent`s with
`bubbles: true, composed: true` so they cross shadow roots.

## In a browser

Playwright (or `@vitest/browser`) checks what jsdom cannot: the page outlet's swap, popovers, dialogs, focus, layout
on a phone's width. Its selectors reach into shadow roots. With the page outlet, the page shown and the next one are
both in the document for a moment: wait for one page before reading it.
