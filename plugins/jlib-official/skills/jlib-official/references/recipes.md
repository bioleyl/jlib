# Recipes

A whole app on jlib, file by file: its frame, a list that searches and creates, a detail page with its actions, a
settings form that guards its changes. Every file type-checks against the version of jlib this skill describes.
Follow the project's own layout where it has one.

## Contents

- An app from scratch
- A list page that creates
- A detail page with its actions
- A settings form that guards its changes
- A page not found

## An app from scratch

The frame (shell, side nav, tab bar, search, account), the router showing its pages through the outlet, and
navigation from code without a page ever importing the router.

```ts
// src/app/app.constants.ts
export const APP_NAME = 'Shop';

/** The app's glyph, drawn on the brand's tile: in the side nav, the phone's top bar, the browser's tab. */
export const APP_ICON = 'package';

/** The language of jlib's own texts: 'en', 'fr' or 'de', or a region of one ('fr-CH'). */
export const APP_LOCALE = 'en';
```

```ts
// src/icons.ts
import { COMMON_ICONS, registerIcons } from '@syware/jlib';

// The usual icons, for the frame and the views; a view that names another registers it itself.
registerIcons(COMMON_ICONS);
```

```css
/* src/styles/document.css */
body {
  margin: 0;
  background: var(--jl-bg);
  color: var(--jl-text);
  font-family: var(--jl-font-sans);
  font-size: var(--jl-font-md);
}
```

```tsx
// src/main.tsx
import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
import './styles/document.css';
import './icons';

import { jlTexts } from '@syware/jlib';

import { AppFrame } from './app/app-frame';
import { APP_LOCALE } from './app/app.constants';

// jlib's own texts in the app's language before anything is drawn; unreadable, they stay in English.
void jlTexts.setLocale(APP_LOCALE).finally(() => document.body.append(<AppFrame />));
```

```ts
// src/app/navigation.ts
import { Bus } from '@jadis/core';

import type { SideNavSection, TabBarItem } from '@syware/jlib';

/** The places of the side nav and the tab bar. */
export type Place = 'orders' | 'settings';

/** Where the app goes from code, for the frame's router to do: a page never imports the router. */
export const navigationBus = new Bus<{ goto: string; replace: string }>();

/** Opens an address of the app, as a link would. */
export const navigate = (path: string): void => navigationBus.emit('goto', path);

/** Writes the address of the page shown again, without a step in the history: its search, its filters. */
export const replaceAddress = (path: string): void => navigationBus.emit('replace', path);

export const NAV_SECTIONS: SideNavSection<Place>[] = [
  { items: [{ href: '/orders', icon: 'package', id: 'orders', label: 'Orders' }] },
  { items: [{ href: '/settings', icon: 'settings', id: 'settings', label: 'Settings' }], label: 'Shop' },
];

export const TAB_ITEMS: TabBarItem<Place>[] = [
  { href: '/orders', icon: 'package', id: 'orders', label: 'Orders' },
  { href: '/settings', icon: 'settings', id: 'settings', label: 'Settings' },
];

const PLACES: readonly Place[] = ['orders', 'settings'];
const HOME_PLACE: Place = 'orders';

/** The place a route's path belongs to, for the navigation to mark; none for the others. */
export function placeOf(path: string): Place | '' {
  if (path === '/') {
    return HOME_PLACE;
  }
  return PLACES.find((place) => path === `/${place}` || path.startsWith(`/${place}/`)) ?? '';
}
```

```ts
// src/app/router.ts
import { defineRoutes, Router } from '@jadis/core';

import { NotFoundPage } from '../pages/not-found-page';
import { OrderPage } from '../pages/order-page';
import { OrdersPage } from '../pages/orders-page';
import { SettingsPage } from '../pages/settings-page';

import type { JlPageOutlet } from '@syware/jlib';

// The first route that matches wins: the catch-all goes last, /orders/new before /orders/:id.
const ROUTES = defineRoutes({
  home: { page: OrdersPage, path: '/' },
  orders: { page: OrdersPage, path: '/orders' },
  ordersNew: { page: OrdersPage, path: '/orders/new' },
  order: { page: OrderPage, path: '/orders/:id' },
  settings: { page: SettingsPage, path: '/settings' },
  notFound: { page: NotFoundPage, path: '/:rest' },
});

export type AppRouter = Router<typeof ROUTES>;

/** Shows the routes' pages in the outlet, following the links to them, until the signal aborts. */
export function startRouter(outlet: JlPageOutlet, signal: AbortSignal): AppRouter {
  const router = new Router(ROUTES, { links: true, mode: 'history', signal });
  router.mountOn(outlet, { show: (page) => outlet.show(page) });
  return router;
}
```

```tsx
// src/app/app-frame.tsx
import { Jadis } from '@jadis/core';
import {
  JlAccountButton,
  JlAppIcon,
  JlAppShell,
  JlCommandPalette,
  JlMenu,
  JlPageOutlet,
  JlSearchButton,
  JlSideNav,
  JlTabBar,
  setFavicon,
} from '@syware/jlib';

import { APP_ICON, APP_NAME } from './app.constants';
import styles from './app-frame.css?inline';
import { NAV_SECTIONS, navigate, navigationBus, placeOf, TAB_ITEMS } from './navigation';
import { startRouter } from './router';

import type { MenuItem, PaletteCommand } from '@syware/jlib';
import type { Place } from './navigation';

type AccountAction = 'sign-out';

const ACCOUNT_ITEMS: MenuItem<AccountAction>[] = [{ icon: 'log-out', label: 'Sign out', value: 'sign-out' }];

// The palette's commands are addresses: choosing one opens it. An action that opens a form ends with an ellipsis.
const COMMANDS: PaletteCommand[] = [
  { group: 'Go to', icon: 'package', id: '/orders', label: 'Orders' },
  { group: 'Go to', icon: 'settings', id: '/settings', keywords: ['preferences'], label: 'Settings' },
  { group: 'Actions', icon: 'plus', id: '/orders/new', label: 'New order…' },
];

const COLLAPSED_KEY = 'shop.nav-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function storeCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  } catch {
    // A browser that keeps nothing folds the side nav for this visit only.
  }
}

/** The frame of the app: the shell, its navigation, the search, the account, and the pages in their outlet. */
export class AppFrame extends Jadis {
  static readonly selector = 'app-frame';

  private readonly _refs = this.useRefs((ref) => ({
    nav: ref<JlSideNav<Place>>('jl-side-nav'),
    outlet: ref(JlPageOutlet),
    palette: ref(JlCommandPalette),
    tabs: ref<JlTabBar<Place>>('jl-tab-bar'),
  }));

  templateHtml(): Node {
    return (
      <JlAppShell narrowHeader>
        <div slot="header" class="top-bar">
          <a class="brand" href="/">
            <JlAppIcon icon={APP_ICON} size={24} />
            <span>{APP_NAME}</span>
          </a>
          <JlSearchButton compact onPress={() => this._refs.palette.show()} />
        </div>
        <JlSideNav<Place>
          slot="nav"
          sections={NAV_SECTIONS}
          label="Main navigation"
          collapsible
          collapsed={readCollapsed()}
          onCollapse={storeCollapsed}
        >
          <div slot="header" class="nav-header">
            <a class="brand" href="/">
              <JlAppIcon icon={APP_ICON} size={24} />
              <span class="brand-name">{APP_NAME}</span>
            </a>
            <JlSearchButton class="nav-search" onPress={() => this._refs.palette.show()} />
          </div>
          <JlMenu<AccountAction>
            slot="footer"
            items={ACCOUNT_ITEMS}
            placement="top-start"
            label="Your account"
            onSelect={(action) => this.act(action)}
          >
            <JlAccountButton slot="trigger" name="Marie Rochat" description="Administrator" />
          </JlMenu>
        </JlSideNav>
        <JlPageOutlet />
        <JlTabBar<Place> slot="tabs" items={TAB_ITEMS} label="Main navigation" />
        <JlCommandPalette
          commands={COMMANDS}
          placeholder="Search orders and pages…"
          onSelect={(address) => navigate(address)}
        />
      </JlAppShell>
    );
  }

  templateCss(): string {
    return styles;
  }

  // Each connection starts the router, which stops with the frame (killSignal).
  onConnect(): void {
    setFavicon(APP_ICON);
    const router = startRouter(this._refs.outlet, this.killSignal);
    this.onBus(router.bus, 'change', (route) => this.drawPlace(placeOf(route.path)));
    this.onBus(navigationBus, 'goto', (path) => router.gotoPath(path));
    this.onBus(navigationBus, 'replace', (path) => router.replacePath(path));
    this.drawPlace(placeOf(router.currentRoute.path));
  }

  private drawPlace(place: Place | ''): void {
    this._refs.nav.value.set(place);
    this._refs.tabs.value.set(place);
  }

  private act(action: AccountAction): void {
    if (action === 'sign-out') {
      window.location.assign('/sign-out');
    }
  }
}

AppFrame.register();
```

```css
/* src/app/app-frame.css */
:host {
  display: block;
  height: 100dvh;
}

jl-app-shell {
  height: 100%;
}

.top-bar {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: var(--jl-space-2);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--jl-space-2);
  color: var(--jl-text);
  font-weight: 700;
  text-decoration: none;
}

.nav-header {
  display: grid;
  gap: var(--jl-space-3);
  padding: var(--jl-space-2);
}

/* Folded into its rail, the side nav keeps the icon alone. */
jl-side-nav[rail] .brand-name,
jl-side-nav[rail] .nav-search {
  display: none;
}

[hidden] {
  display: none;
}
```

- History addresses (`mode: 'history'`) need a server that answers every route with `index.html`: Vite's does in
  development; a static host needs a rule for it, or `mode: 'hash'`. An app under a folder gives `baseUrl`.
- With `links: true`, the router follows clicks on links to its routes, in shadow roots too: the side nav's items,
  a table's links, a `JlButton href`. A click with a modifier key opens a tab, as people expect.

## A list page that creates

The list of orders: its search and its status filter in the address, a page of 30 at a time with **Show more**, an
empty state for each case, and **New order** opening the dialog of [forms.md](forms.md#a-form-in-a-dialog) at its own
address (`/orders/new`), the new order opening on its own page.

```ts
// src/types/order.types.ts
export type OrderStatus = 'Open' | 'Shipped' | 'Late';

export type Order = {
  id: string;
  number: string;
  customer: string;
  city: string;
  status: OrderStatus;
  total: number;
  placedAt: string;
};

/** What the New order dialog sends. */
export type NewOrder = { customer: string; total: number };

/** A page of the list of orders, and how many the search finds in all. */
export type OrderList = { items: Order[]; total: number };

/** What the list shows: its search and its status filter, both in the address. */
export type OrderQuery = { search: string; status: OrderStatus | '' };
```

```ts
// src/services/api.ts
const NOT_FOUND = 404;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** A request the server refused: its status, why, and what is wrong with each field it names. */
export class ApiError extends Error {
  readonly status: number;
  readonly fields: Readonly<Record<string, string>>;

  constructor(message: string, status: number, fields: Readonly<Record<string, string>> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

type Problem = { message?: string; fields?: Record<string, string> };

async function answered(path: string, init: RequestInit): Promise<Response> {
  const answer = await fetch(`/api${path}`, init);
  if (!answer.ok) {
    const problem = (await answer.json().catch(() => ({}))) as Problem;
    throw new ApiError(problem.message ?? `The server answered ${answer.status}.`, answer.status, problem.fields);
  }
  return answer;
}

/** Reads JSON from the API; a refusal throws an ApiError with the server's reasons. */
export const request = async <Value>(path: string, init: RequestInit = {}): Promise<Value> =>
  (await (await answered(path, init)).json()) as Value;

/** The same, null when the server has no such thing. */
export async function requestOrNull<Value>(path: string, init: RequestInit = {}): Promise<Value | null> {
  try {
    return await request<Value>(path, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === NOT_FOUND) {
      return null;
    }
    throw error;
  }
}

/** Sends JSON to the API, and reads what it answers. */
export const send = <Value>(path: string, method: string, body: unknown, signal?: AbortSignal): Promise<Value> =>
  request<Value>(path, { body: JSON.stringify(body), headers: JSON_HEADERS, method, signal: signal ?? null });

/** Asks the API to do something that answers nothing. */
export const act = async (path: string, method: string): Promise<void> => {
  await answered(path, { method });
};
```

```ts
// src/services/orders.ts
import { act, request, requestOrNull, send } from './api';

import type { NewOrder, Order, OrderList, OrderQuery } from '../types/order.types';

export { ApiError } from './api';

/** How many orders a page of the list holds. */
export const ORDER_PAGE_SIZE = 30;

export function fetchOrderList(query: OrderQuery, offset: number, signal: AbortSignal): Promise<OrderList> {
  const params = new URLSearchParams({
    limit: String(ORDER_PAGE_SIZE),
    offset: String(offset),
    search: query.search,
    status: query.status,
  });
  return request<OrderList>(`/orders?${params}`, { signal });
}

export const fetchOrder = (id: string, signal: AbortSignal): Promise<Order | null> =>
  requestOrNull<Order>(`/orders/${encodeURIComponent(id)}`, { signal });

export const createOrder = (order: NewOrder, signal: AbortSignal): Promise<Order> =>
  send<Order>('/orders', 'POST', order, signal);

export const deleteOrder = (id: string): Promise<void> => act(`/orders/${encodeURIComponent(id)}`, 'DELETE');
```

```tsx
// src/pages/orders-page.tsx
import { Jadis } from '@jadis/core';
import {
  JlButton,
  JlChipGroup,
  JlEmpty,
  JlLink,
  JlLoadMore,
  JlLoadState,
  JlPage,
  JlSearch,
  JlTable,
  toast,
} from '@syware/jlib';

import { APP_NAME } from '../app/app.constants';
import { navigate, replaceAddress } from '../app/navigation';
import { fetchOrderList } from '../services/orders';
import { NewOrderDialog } from './new-order-dialog';
import styles from './orders-page.css?inline';

import type { ActiveRoute, RoutedPage } from '@jadis/core';
import type { ChipGroupOption, TableColumn, TableRenderers } from '@syware/jlib';
import type { Order, OrderList, OrderQuery, OrderStatus } from '../types/order.types';

type StatusFilter = OrderStatus | 'all';

const ALL: StatusFilter = 'all';
const LIST_PATH = '/orders';
const NEW_ORDER_PATH = '/orders/new';
const QUERY = { search: 'search', status: 'status' } as const;

const STATUS_OPTIONS: ChipGroupOption<StatusFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'Open' },
  { label: 'Late', value: 'Late' },
  { label: 'Shipped', value: 'Shipped' },
];

const STATUSES: readonly OrderStatus[] = ['Open', 'Late', 'Shipped'];

const COLUMNS: TableColumn<Order>[] = [
  { key: 'number', label: 'Order' },
  { description: 'city', key: 'customer', label: 'Customer' },
  { format: 'badge', key: 'status', label: 'Status', tones: { Late: 'warn', Open: 'info', Shipped: 'ok' } },
  { format: 'number', key: 'total', label: 'Total' },
  { format: 'date', key: 'placedAt', label: 'Placed' },
];

// Rows are links: a middle click opens the order in a tab.
const RENDERERS: TableRenderers<Order> = {
  number: (order) => <JlLink href={`${LIST_PATH}/${order.id}`} label={order.number} />,
};

const statusOf = (text: string | null): OrderStatus | '' => STATUSES.find((status) => status === text) ?? '';

const statusOfFilter = (filter: StatusFilter | undefined): OrderStatus | '' =>
  filter === undefined || filter === 'all' ? '' : filter;

const queryOf = (params: URLSearchParams): OrderQuery => ({
  search: params.get(QUERY.search) ?? '',
  status: statusOf(params.get(QUERY.status)),
});

const sameQuery = (a: OrderQuery | null, b: OrderQuery): boolean =>
  a !== null && a.search === b.search && a.status === b.status;

/** The list's address: its search and filter, those left empty left out. */
function addressOf(query: OrderQuery): string {
  const params = new URLSearchParams();
  if (query.search !== '') {
    params.set(QUERY.search, query.search);
  }
  if (query.status !== '') {
    params.set(QUERY.status, query.status);
  }
  const search = params.toString();
  return search === '' ? LIST_PATH : `${LIST_PATH}?${search}`;
}

/** Every order, found by its words and its status, both in the address, 30 at a time. */
export class OrdersPage extends Jadis implements RoutedPage {
  static readonly selector = 'app-orders-page';

  // The query the list shows, to load again only when it changes.
  private readonly _list: { query: OrderQuery | null } = { query: null };

  private readonly _refs = this.useRefs((ref) => ({
    count: ref<HTMLParagraphElement>('.count'),
    dialog: ref(NewOrderDialog),
    empty: ref(JlEmpty),
    more: ref(JlLoadMore),
    newFirst: ref<JlButton>('.new-first'),
    search: ref(JlSearch),
    showAll: ref<JlButton>('.show-all'),
    state: ref(JlLoadState),
    status: ref<JlChipGroup<StatusFilter>>('jl-chip-group'),
    table: ref<JlTable<Order>>('jl-table'),
  }));

  templateHtml(): Node {
    return (
      <JlPage heading="Orders" description="Every order of the shop, the latest first." width="wide" appName={APP_NAME}>
        <JlButton slot="actions" variant="primary" icon="plus" label="New order" href={NEW_ORDER_PATH} />
        <div class="tools">
          <JlSearch
            label="Search the orders"
            placeholder="Order number or customer"
            shortcut="/"
            onSearch={(search) => this.writeAddress({ ...this.query(), search })}
          />
          <JlChipGroup<StatusFilter>
            label="Status"
            options={STATUS_OPTIONS}
            value={[ALL]}
            required
            onChange={([filter]) => this.writeAddress({ ...this.query(), status: statusOfFilter(filter) })}
          />
        </div>
        <p class="count" />
        <JlLoadState errorHeading="The orders could not be loaded">
          <JlTable<Order> columns={COLUMNS} renderers={RENDERERS} rowKey="id" label="Orders" />
          <JlLoadMore onMore={() => void this.loadMore()} />
          <JlEmpty slot="empty" icon="package">
            <JlButton class="new-first" variant="primary" icon="plus" label="New order" href={NEW_ORDER_PATH} />
            <JlButton class="show-all" label="Show every order" href={LIST_PATH} />
          </JlEmpty>
        </JlLoadState>
        <NewOrderDialog
          onCreated={(order) => navigate(`${LIST_PATH}/${order.id}`)}
          onClose={() => this.leaveNewAddress()}
        />
      </JlPage>
    );
  }

  templateCss(): string {
    return styles;
  }

  // The router gives every address of this page here, its first one included: the address is the list's state.
  onRoute(route: ActiveRoute): void {
    // The route's path, as the routes write it: /orders/new opens the dialog over the list, which stays as it was;
    // a first visit to that address loads the whole list under it.
    const creating = route.path === NEW_ORDER_PATH;
    if (!creating || this._list.query === null) {
      this.showQuery(queryOf(route.query));
    }
    if (creating) {
      this._refs.dialog.open();
    }
  }

  private showQuery(query: OrderQuery): void {
    this._refs.search.value.set(query.search);
    this._refs.status.value.set([query.status === '' ? ALL : query.status]);
    if (!sameQuery(this._list.query, query)) {
      this.loadFirstPage(query);
    }
  }

  private query(): OrderQuery {
    return this._list.query ?? { search: '', status: '' };
  }

  private writeAddress(query: OrderQuery): void {
    replaceAddress(addressOf(query));
  }

  /** The dialog closed while its address shows: back to the list's, without a step in the history. */
  private leaveNewAddress(): void {
    if (window.location.pathname === NEW_ORDER_PATH) {
      replaceAddress(addressOf(this.query()));
    }
  }

  private loadFirstPage(query: OrderQuery): void {
    this._list.query = query;
    void this._refs.state.load({
      draw: (list) => this.drawList(list, query),
      fetch: () => fetchOrderList(query, 0, this.killSignal),
      isEmpty: (list) => list.total === 0,
    });
  }

  private drawList(list: OrderList, query: OrderQuery): void {
    const { count, empty, more, newFirst, showAll, table } = this._refs;
    table.rows.set(list.items);
    count.textContent = list.total === 1 ? '1 order' : `${list.total} orders`;
    count.hidden = list.total === 0;
    more.shown.set(list.items.length);
    more.total.set(list.total);
    const filtered = query.search !== '' || query.status !== '';
    empty.heading.set(filtered ? 'No order matches' : 'No orders yet');
    empty.description.set(filtered ? 'Try other words, or show every status.' : 'Orders placed in the shop show here.');
    newFirst.hidden = filtered;
    showAll.hidden = !filtered;
  }

  private async loadMore(): Promise<void> {
    const { more, table } = this._refs;
    more.loading.set(true);
    try {
      const list = await fetchOrderList(this.query(), table.rows.get().length, this.killSignal);
      table.rows.set((rows) => [...rows, ...list.items]);
      more.shown.set(table.rows.get().length);
      more.total.set(list.total);
    } catch {
      toast({ heading: 'More orders could not be loaded', text: 'Try again in a moment.', tone: 'danger' });
    } finally {
      more.loading.set(false);
    }
  }
}

OrdersPage.register();
```

```css
/* src/pages/orders-page.css */
:host {
  display: block;
}

.tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--jl-space-3);
}

/* Under the toolbar: how many the search finds. */
.count {
  margin: var(--jl-space-3) 0 var(--jl-space-4);
  color: var(--jl-muted);
  font-size: var(--jl-font-sm);
}

/* Side by side when there is room; on a phone, the chips go under the search, and scroll sideways. */
.tools jl-search {
  flex: 1 1 260px;
  max-width: 360px;
}

.tools jl-chip-group {
  flex: 1 1 260px;
  min-width: 0;
}

[hidden] {
  display: none;
}
```

- The search and the chips write the address (`replaceAddress`): no step of the history per keystroke, and the
  router gives the page its new query, which loads the list. A shared or reloaded address shows the same list.
- The dialog is placed once, and opened by its address: the primary action and the palette's **New order** are links
  to `/orders/new`.
- A page never imports the router's module, which imports every page: the routes would be built before the page's
  class exists. It navigates through `navigation.ts`, and reads its route in `onRoute`.

## A detail page with its actions

An order: its heading and status, its facts, a quiet action and the rarer ones behind an ellipsis, **Delete**
confirmed, not found said in place.

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

```tsx
// src/pages/order-page.tsx
import { Jadis } from '@jadis/core';
import {
  confirmDialog,
  download,
  JlBadge,
  JlButton,
  JlCard,
  JlEmpty,
  JlFacts,
  JlLoadState,
  JlMenu,
  JlPage,
  toast,
} from '@syware/jlib';

import { APP_NAME } from '../app/app.constants';
import { navigate } from '../app/navigation';
import { ORDER_STATUS } from '../lib/order-status';
import { deleteOrder, fetchOrder } from '../services/orders';

import type { ActiveRoute, RoutedPage } from '@jadis/core';
import type { Fact, MenuItem } from '@syware/jlib';
import type { Order } from '../types/order.types';

type OrderAction = 'delete';

// The rarer actions, behind an ellipsis; the one that destroys last, after a line, in red. Never a red button in
// the header: the danger look is the menu item's and its confirmation's.
const ORDER_ACTIONS: MenuItem<OrderAction>[] = [{ danger: true, icon: 'trash', label: 'Delete order', value: 'delete' }];

const LIST_PATH = '/orders';
const money = new Intl.NumberFormat(undefined, { currency: 'CHF', style: 'currency' });
const day = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });

const factsOf = (order: Order): Fact[] => [
  { label: 'Customer', value: order.customer },
  { label: 'City', value: order.city },
  { label: 'Total', value: money.format(order.total) },
  { label: 'Placed', value: day.format(new Date(order.placedAt)) },
  { code: true, label: 'Reference', value: order.id },
];

/** One order, found by the id in its address. */
export class OrderPage extends Jadis implements RoutedPage {
  static readonly selector = 'app-order-page';

  // The order shown, once loaded; its id, as soon as the address gives it.
  private readonly _shown: { id: string; order: Order | null } = { id: '', order: null };

  private readonly _refs = this.useRefs((ref) => ({
    actions: ref(JlMenu),
    facts: ref(JlFacts),
    invoice: ref<JlButton>('.invoice'),
    page: ref(JlPage),
    state: ref(JlLoadState),
    status: ref(JlBadge),
  }));

  templateHtml(): Node {
    return (
      <JlPage heading="Order" back={LIST_PATH} backLabel="Orders" appName={APP_NAME}>
        <JlBadge slot="meta" />
        <JlButton slot="actions" class="invoice" icon="download" label="Invoice" onPress={() => void this.invoice()} />
        <JlMenu<OrderAction> slot="actions" items={ORDER_ACTIONS} label="More actions" onSelect={(action) => void this.act(action)}>
          <JlButton slot="trigger" variant="ghost" icon="ellipsis" hint="More actions" />
        </JlMenu>
        <JlLoadState skeleton="lines" errorHeading="The order could not be loaded">
          <JlCard heading="Details">
            <JlFacts label="Details of the order" />
          </JlCard>
          <JlEmpty slot="empty" icon="package" heading="This order does not exist" description="It may have been deleted, or the link is wrong.">
            <JlButton href={LIST_PATH} label="Every order" />
          </JlEmpty>
        </JlLoadState>
      </JlPage>
    );
  }

  onRoute(route: ActiveRoute): void {
    const id = route.params.id ?? '';
    if (id === this._shown.id) {
      return;
    }
    this._shown.id = id;
    void this._refs.state.load({
      draw: (order) => this.drawOrder(order),
      fetch: () => fetchOrder(id, this.killSignal),
      isEmpty: (order) => order === null,
    });
  }

  private drawOrder(order: Order | null): void {
    this._shown.order = order;
    const { actions, facts, invoice, page, status } = this._refs;
    actions.hidden = order === null;
    invoice.hidden = order === null;
    status.hidden = order === null;
    if (order === null) {
      page.heading.set('Order not found');
      return;
    }
    page.heading.set(`Order ${order.number}`);
    status.showStatus(ORDER_STATUS[order.status]);
    facts.items.set(factsOf(order));
  }

  private async invoice(): Promise<void> {
    const order = this._shown.order;
    if (order !== null) {
      await download(`/api/orders/${encodeURIComponent(order.id)}/invoice.pdf`, { title: `Invoice of ${order.number}` });
    }
  }

  private async act(action: OrderAction): Promise<void> {
    const order = this._shown.order;
    if (order === null || action !== 'delete') {
      return;
    }
    const confirmed = await confirmDialog({
      confirmLabel: 'Delete',
      heading: `Delete order ${order.number}?`,
      text: 'Its lines and its invoice are deleted with it. This cannot be undone.',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteOrder(order.id);
      toast({ heading: `Order ${order.number} deleted`, tone: 'ok' });
      navigate(LIST_PATH);
    } catch {
      toast({ heading: 'The order was not deleted', text: 'Try again in a moment.', tone: 'danger' });
    }
  }
}

OrderPage.register();
```

- A page without `templateCss()` gets none; `JlPage` lays out the header and the width.
- The heading names the thing; the back link names the page it leads to.

## A settings form that guards its changes

A page with **Save**: its fields loaded in a load state, checked on submit, a toast once saved, and a question
before it is left with changes not saved.

```ts
// src/services/settings.ts
import { request, send } from './api';

export type Language = 'fr' | 'de' | 'en';

export type Settings = { shopName: string; language: Language; notify: boolean };

export const fetchSettings = (signal: AbortSignal): Promise<Settings> => request<Settings>('/settings', { signal });

export const saveSettings = (settings: Settings, signal: AbortSignal): Promise<Settings> =>
  send<Settings>('/settings', 'PUT', settings, signal);
```

```tsx
// src/pages/settings-page.tsx
import { Jadis } from '@jadis/core';
import {
  guardLeave,
  JlAlert,
  JlButton,
  JlField,
  JlInput,
  JlLoadState,
  JlPage,
  JlSelect,
  JlStack,
  JlSwitch,
  toast,
} from '@syware/jlib';

import { APP_NAME } from '../app/app.constants';
import { ApiError } from '../services/api';
import { fetchSettings, saveSettings } from '../services/settings';
import styles from './settings-page.css?inline';

import type { RoutedPage } from '@jadis/core';
import type { SelectOption } from '@syware/jlib';
import type { Language, Settings } from '../services/settings';

// Each language in its own words.
const LANGUAGES: SelectOption<Language>[] = [
  { label: 'Français', value: 'fr' },
  { label: 'Deutsch', value: 'de' },
  { label: 'English', value: 'en' },
];

const DEFAULT_LANGUAGE: Language = 'fr';

/** The shop's settings: a form that saves on Save, and asks before it is left with changes not saved. */
export class SettingsPage extends Jadis implements RoutedPage {
  static readonly selector = 'app-settings-page';

  // Asked by the router before it leaves the page; guarded once connected.
  canLeave = (): Promise<boolean> => Promise.resolve(true);

  // The settings as loaded or last saved, as JSON: what the form is compared with.
  private readonly _saved = { settings: '' };

  private readonly _refs = this.useRefs((ref) => ({
    alert: ref(JlAlert),
    form: ref<HTMLFormElement>('form'),
    language: ref<JlSelect<Language>>('jl-select'),
    notify: ref(JlSwitch),
    save: ref<JlButton>('.save'),
    shopName: ref(JlInput),
    shopNameField: ref<JlField>('.shop-name'),
    state: ref(JlLoadState),
  }));

  templateHtml(): Node {
    return (
      <JlPage heading="Settings" description="How the shop names itself, and what it tells you." width="form" appName={APP_NAME}>
        <JlLoadState skeleton="lines" errorHeading="The settings could not be loaded">
          <form noValidate>
            <JlStack>
              <JlAlert tone="danger" hidden />
              <JlField class="shop-name" label="Shop name" hint="On every invoice." required>
                <JlInput name="shopName" required />
              </JlField>
              <JlField label="Language of the invoices">
                <JlSelect<Language> name="language" options={LANGUAGES} />
              </JlField>
              <JlSwitch name="notify" label="Email each new order to the shop's address" />
              <div class="actions">
                <JlButton class="save" type="submit" variant="primary" label="Save" />
              </div>
            </JlStack>
          </form>
        </JlLoadState>
      </JlPage>
    );
  }

  templateCss(): string {
    return styles;
  }

  onConnect(): void {
    this.canLeave = guardLeave({
      isDirty: () => this._saved.settings !== '' && JSON.stringify(this.read()) !== this._saved.settings,
      signal: this.killSignal,
      text: 'Your changes to the settings are lost.',
    });
    this.on(this._refs.form, 'submit', (event) => {
      event.preventDefault();
      void this.save();
    });
    this._refs.shopName.events.register('input', () => this.checkAgain());
    if (this._refs.state.state.get() === 'loading') {
      void this._refs.state.load({
        draw: (settings) => this.draw(settings),
        fetch: () => fetchSettings(this.killSignal),
      });
    }
  }

  private draw(settings: Settings): void {
    this._refs.shopName.value.set(settings.shopName);
    this._refs.language.value.set(settings.language);
    this._refs.notify.checked.set(settings.notify);
    this._saved.settings = JSON.stringify(this.read());
  }

  private read(): Settings {
    return {
      language: this._refs.language.value.get() || DEFAULT_LANGUAGE,
      notify: this._refs.notify.checked.get(),
      shopName: this._refs.shopName.value.get().trim(),
    };
  }

  /** Writes what is wrong under its field; whether the settings can be sent. */
  private check(settings: Settings): boolean {
    this._refs.shopNameField.error.set(settings.shopName === '' ? 'Enter the name of the shop, as on its invoices.' : '');
    return settings.shopName !== '';
  }

  private checkAgain(): void {
    if (this._refs.shopNameField.error.get() !== '') {
      this.check(this.read());
    }
  }

  private async save(): Promise<void> {
    const settings = this.read();
    this._refs.alert.hidden = true;
    if (!this.check(settings)) {
      this._refs.shopName.focus();
      return;
    }
    this._refs.save.loading.set(true);
    try {
      this.draw(await saveSettings(settings, this.killSignal));
      toast({ heading: 'Settings saved', tone: 'ok' });
    } catch (error) {
      this.showRefusal(error);
    } finally {
      this._refs.save.loading.set(false);
    }
  }

  private showRefusal(error: unknown): void {
    const nameError = error instanceof ApiError ? error.fields.shopName : undefined;
    if (nameError !== undefined) {
      this._refs.shopNameField.error.set(nameError);
      this._refs.shopName.focus();
      return;
    }
    this._refs.alert.description.set(error instanceof ApiError ? error.message : 'The settings were not saved.');
    this._refs.alert.hidden = false;
  }
}

SettingsPage.register();
```

```css
/* src/pages/settings-page.css */
:host {
  display: block;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

[hidden] {
  display: none;
}
```

## A page not found

```tsx
// src/pages/not-found-page.tsx
import { Jadis } from '@jadis/core';
import { JlButton, JlEmpty, JlPage } from '@syware/jlib';

import { APP_NAME } from '../app/app.constants';

/** What the router shows for an address it has no route for. */
export class NotFoundPage extends Jadis {
  static readonly selector = 'app-not-found-page';

  templateHtml(): Node {
    return (
      <JlPage heading="Page not found" appName={APP_NAME}>
        <JlEmpty icon="circle-help" heading="This page does not exist" description="Its address may be wrong, or have changed.">
          <JlButton variant="primary" href="/" label="Home" />
        </JlEmpty>
      </JlPage>
    );
  }
}

NotFoundPage.register();
```
