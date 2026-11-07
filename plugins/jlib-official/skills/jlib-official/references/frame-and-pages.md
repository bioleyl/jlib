# The frame and its pages

An app's frame is a `JlAppShell` holding its navigation, its search, the person signed in, and a `JlPageOutlet`
where the router shows the pages. Each page is a `JlPage`. The whole of it, file by file, is in
[recipes.md](recipes.md#an-app-from-scratch); this guide says what each part does.

## Contents

- The shell
- The side nav and the tab bar
- The person signed in
- Search: the command palette
- The router and the outlet
- Navigating from code
- A page
- Pages that load on demand
- Titles and the favicon

## The shell

```tsx
<JlAppShell narrowHeader>
  <div slot="header" class="top-bar">…the app's name, a compact search button…</div>
  <JlSideNav<Place> slot="nav" sections={NAV_SECTIONS} collapsible />
  <JlPageOutlet />
  <JlTabBar<Place> slot="tabs" items={TAB_ITEMS} />
</JlAppShell>
```

- Slots: `header` (a top bar), `nav` (the sidebar; a drawer when narrow), the default slot (the main area, which
  scrolls), `aside` (a panel on the right, hidden when narrow), `tabs` (a bar along the bottom, shown only when
  narrow).
- The shell takes its container's height: the frame's host gets `height: 100dvh` and the shell `height: 100%`.
- Under 960 pixels of its own width, the sidebar becomes a drawer, opened by a menu button at the start of the top
  bar, `nav-open` or `toggleNav()`; following a link or a select in the nav closes it.
- `narrowHeader` shows the top bar only when narrow: wide, the side nav's header names the app. SyWare's frame uses
  it.
- A shell that fills the window writes the tab bar's height as `--jl-shell-bottom` on the document: toasts keep above
  it, and a page's floating bar can too, `bottom: calc(var(--jl-shell-bottom, 0px) + 16px)`.

## The side nav and the tab bar

```ts
export const NAV_SECTIONS: SideNavSection<Place>[] = [
  { items: [{ href: '/orders', icon: 'package', id: 'orders', label: 'Orders', badge: 4 }] },
  { items: [{ href: '/settings', icon: 'settings', id: 'settings', label: 'Settings' }], label: 'Shop' },
];
```

- Items with an `href` are links (a middle click opens a tab, the router follows the others); items without fire
  `select` with their id. `children` nest items under a parent that opens with a chevron.
- `value` is the current place, drawn in the accent colour: the frame sets it from the route, on both the side nav and
  the tab bar.
- `collapsible` adds a button that folds the side nav into a rail of icons; `collapse` says so, for the app to
  remember it on the device (`localStorage`), and `collapsed` starts it folded. While folded, the host carries the
  `rail` attribute: style its header with `jl-side-nav[rail] …`.
- Slots `header` (the app's icon and name, the search button) and `footer` (the person signed in).
- The tab bar takes the main places only (an icon each); its `more` label adds a last button that opens the drawer
  with the rest.

## The person signed in

A `JlAccountButton` (avatar, name, role) at the foot of the side nav, the trigger of a `JlMenu`:

```tsx
<JlMenu<AccountAction> slot="footer" items={ACCOUNT_ITEMS} placement="top-start" label="Your account" onSelect={(action) => this.act(action)}>
  <JlAccountButton slot="trigger" name={user.name} description={user.role} />
</JlMenu>
```

`compact` shows the avatar alone (a phone's top bar, a folded rail); `href` makes it a link to the account page
instead of a menu's trigger.

## Search: the command palette

```tsx
<JlSearchButton onPress={() => this._refs.palette.show()} />
<JlCommandPalette commands={COMMANDS} onSelect={(id) => navigate(id)} onSearch={(text) => void this.search(text)} />
```

- ⌘K or Ctrl+K opens it from anywhere (`hotkey`); a `JlSearchButton` at the top of the side nav (and `compact` in
  the phone's top bar) opens it too.
- Commands: `id`, `label`, and `group`, `icon`, `description` (what it is, to tell two of one name apart), `shortcut`,
  `keywords`. Give them addresses as ids, and `select` navigates.
- The server's own results: on `search` (debounced, `''` when it opens), set `loading`, fetch, then set the commands
  again with the results marked `result: true`, listed whatever the search.

## The router and the outlet

```ts
const router = new Router(ROUTES, { links: true, mode: 'history', signal: this.killSignal });
router.mountOn(outlet, { show: (page) => outlet.show(page) });
```

- Routes are `defineRoutes({ name: { page: PageClass, path: '/orders/:id' } })`; the first that matches wins, so a
  catch-all (`/:rest`) goes last and `/orders/new` before `/orders/:id`.
- A page that implements `onRoute(route)` (`RoutedPage` from `@jadis/core`) is kept from one address to the next of
  the same page and gets each one: `route.params.id`, `route.query.get('search')`, `route.name`. A page without it is
  made again at each navigation. `onRoute` runs after the page's `onConnect`.
- `JlPageOutlet` keeps the page shown, usable, until the next one's load states have their data (`max-wait`, 3 s),
  a thin line along its top meanwhile; the first page shows at once. Put it flush with the top of the main area
  (the room around a page is the page's); under a sticky bar, `--line-top` is that bar's height.
- `router.bus` emits `change` with each route shown: the frame marks the place in the navigation from it.
- History addresses need a server that answers every route with `index.html` (Vite does in development); `baseUrl`
  for an app under a folder; `mode: 'hash'` for a host that serves files only.

## Navigating from code

Links do most of it. For the rest (open the order just created, write a list's filters in the address), pages do not
import the router, which imports them: a small bus does it, which the frame connects to the router.

```ts
export const navigationBus = new Bus<{ goto: string; replace: string }>();
export const navigate = (path: string): void => navigationBus.emit('goto', path);
export const replaceAddress = (path: string): void => navigationBus.emit('replace', path);
```

```ts
// In the frame's onConnect
this.onBus(navigationBus, 'goto', (path) => router.gotoPath(path));
this.onBus(navigationBus, 'replace', (path) => router.replacePath(path));
```

An app that navigates only in code gives its items no `href` and follows their events: a side nav's, tab bar's or
tree's items fire `select`, an `interactive` `JlListItem` or `JlLink` fires `press`, a `JlBreadcrumb` item or a
`JlFacts` fact with an `id` fires `select`, and a `backable` `JlPage` fires `back`.

## A page

```tsx
<JlPage heading="Order CH-2026-0160" description="Placed by Alpine Électricité SA." back="/orders" backLabel="Orders" appName={APP_NAME}>
  <JlBadge slot="meta" tone="warn" label="Late" />
  <JlButton slot="actions" label="Invoice" icon="download" />
  <JlButton slot="actions" variant="primary" label="Prepare" />
  …the content…
</JlPage>
```

- `heading` names the thing or the collection; `description` says what the page is for, or the facts that identify
  its subject.
- `width`: `form` (720px), `standard` (1120px), `wide` (1400px), or `full`.
- `back` is the address of the page above, `backLabel` its name ("Orders", not "Back"); a deeper page puts a
  `JlBreadcrumb` in `slot="breadcrumb"`.
- `slot="actions"`: the page's actions, the primary last, one primary at most; the rarer ones in a `JlMenu` behind an
  ellipsis button. `slot="meta"`: the status and the facts.
- Parts that stand alone are `JlCard`s; the rest is divided by `h2`s. A layout of the page's own uses
  `grid-template-columns: minmax(0, 1fr)` (or `minmax(0, …)` tracks), never a bare `1fr`, or a wide child pushes
  the page sideways on a phone.
- A work surface beside a list (a tree and the item open) is a `JlSplitView` ([lists.md](lists.md#split-views)).

## Pages that load on demand

A large or rarely opened page loads in a chunk of its own. The router takes a page's class, not a loader: a small
page stands for it in the routes, imports the module when it connects and draws the real page inside its own
`JlLoadState`, which the outlet waits for.

```tsx
// src/pages/reports-route.tsx
import { Jadis } from '@jadis/core';
import { JlLoadState } from '@syware/jlib';

/** Stands for the reports page in the routes: loads its module the first time it shows. */
export class ReportsRoute extends Jadis {
  static readonly selector = 'app-reports-route';

  private readonly _refs = this.useRefs((ref) => ({ state: ref(JlLoadState) }));

  templateHtml(): Node {
    return (
      <JlLoadState skeleton="lines">
        <slot />
      </JlLoadState>
    );
  }

  onConnect(): void {
    if (this.childElementCount > 0) {
      return;
    }
    void this._refs.state.load({
      draw: (Page) => this.append(new Page()),
      fetch: () => import('./reports-page').then((module) => module.ReportsPage),
    });
  }
}

ReportsRoute.register();
```

```tsx
// src/pages/reports-page.tsx
import { Jadis } from '@jadis/core';
import { JlPage } from '@syware/jlib';

export class ReportsPage extends Jadis {
  static readonly selector = 'app-reports-page';

  templateHtml(): Node {
    return <JlPage heading="Reports">…</JlPage>;
  }
}

ReportsPage.register();
```

What only that page uses (its data, its helpers) goes in its module, not in one the navigation imports.

## Titles and the favicon

- `appName` on a `JlPage` writes `document.title`, the most specific first: "Order CH-2026-0160 · Shop".
- `setFavicon(APP_ICON)` (a registered icon name) makes the app's tile the tab's icon, in the theme's colours; a
  `JlAppIcon` draws the same tile in the frame.
