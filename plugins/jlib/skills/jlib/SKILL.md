---
name: jlib
description: How apps are built with jlib (`@syware/jlib`, SyWare's `jl-*` web components on Jadis) — finding a component and its API, an app's setup, Jadis in brief, icons, theming through `--jl-*` tokens, jlib's texts in the app's language, writing views with jl-* components, guarding a form against leaving, testing views in jsdom, rendering pages on a server (SSR), and reporting what jlib lacks or gets wrong as an issue. Load before writing or changing code that imports `@syware/jlib`, before starting an app on jlib, or when a page needs a component or an option it cannot find.
---

# Apps on jlib

jlib (`@syware/jlib`, [docs](https://bioleyl.github.io/jlib/), [source](https://github.com/bioleyl/jlib)) is the
component library of SyWare's apps, free for any app (MIT): `jl-*` web components on Jadis 1.6, tree-shaken, with a
documentation site that shows each component. Views are Jadis components: load the `jadis` skill too when it is
there; the essentials are below.

How SyWare's apps behave (their frame, pages, lists, forms, states and feedback) is another skill, `syware-ux`, in
the plugin of that name: an app that follows SyWare's UX loads both.

## Finding a component and its API

- [references/components.md](references/components.md) lists every component by level, with its class, its tag and
  what it is for. Read it before writing a view, and before deciding that jlib lacks something.
- The API of the installed version is in the package's declarations,
  `node_modules/@syware/jlib/dist/<level>/jl-<name>.d.ts` (`atoms`, `molecules`, `organisms`, `templates`): its
  inputs (`useChange` fields, typed and commented), its `events` and their details, its methods. Shared types are in
  `dist/types/`.
- Its documentation, with every attribute, event, slot and part and working examples, is a file of jlib's
  repository. Read it at the installed version (`version` in `node_modules/@syware/jlib/package.json`):
  `https://raw.githubusercontent.com/bioleyl/jlib/v<version>/site/src/docs/components/jl-<name>.doc.ts`. The
  documentation site draws its pages by script: fetching one of them gives an empty page.
- A component in the list but missing from `node_modules/@syware/jlib/dist` is newer than the installed jlib: see
  whether a newer version has it (`npm view @syware/jlib version`), or do without.

## An app's setup

- `package.json`: `@syware/jlib`, `@jadis/core` (1.6 or later), `lucide` (the icons), and for the build and tests
  `vite`, `vitest`, `jsdom`.
- `tsconfig.json`: `"jsx": "react-jsx"`, `"jsxImportSource": "@jadis/core"`, `"types": ["vite/client"]` (for the
  `?inline` imports of styles).
- Vitest config: `test: { css: true, environment: 'jsdom' }`, or the components' `?inline` styles import empty.
- `main.tsx` chooses jlib's language if the app has others (below), then appends the app: jlib gives the document
  its own tokens when a component registers.
- A component's stylesheet is a `.css` file beside it, imported with `?inline`
  (`import styles from './orders-view.css?inline'`): Vite minifies it in the build. Not `?raw`, which keeps the CSS
  as written, comments and indentation included, since no bundler minifies what is inside a string.

## Jadis in brief

- A view extends `Jadis` (or jlib's `JlElement`): `static readonly selector = 'app-orders'` (with a hyphen, unique),
  `templateHtml()` returning its JSX, `templateCss()` returning its styles
  (`import styles from './orders-view.css?inline'`), and `OrdersView.register()` at the bottom of its module.
- The template is drawn once. Nothing re-renders: a change writes to the nodes (`textContent`, attributes,
  `replaceChildren` for a list), found with `useRefs((ref) => ({ list: ref('ul'), table: ref(JlTable) }))`.
- State and inputs are `useChange(initial, (value, previous) => …)` fields, read with `get()`, written with
  `set()`. Their values are plain data (`structuredClone` copies them): never a function, a node or a class instance.
- `onConnect()` runs a task after the view is connected, and again if it is taken out and put back (a view moved in
  the page stays connected). It wires listeners with `this.on(node, 'click', …)` and `this.onBus(bus, …)`, removed
  when the view leaves; `fetch(url, { signal: this.killSignal })` stops with it. One-time work there checks it was
  not done yet.
- Outputs are `useEvents<{ saved: Order }>()`, emitted with `this.events.emit('saved', order)`; they do not bubble.
- The router (`new Router(defineRoutes({ … }), { mode: 'hash' })`) creates a page for each address, its parameters
  given as attributes (`useAttributes`). The first matching route wins: a catch-all goes last.
- Pages show through a `jl-page-outlet`, where the installed jlib has it:
  `router.mountOn(outlet, { show: (page) => outlet.show(page) })`. The current page stays until the next one's
  `jl-load-state`s have their data (or `max-wait`, 3 seconds), so a page loads its data in load states, as it would
  anyway. Its loading line runs along its top edge: put the outlet flush with the top of the content area, the
  padding in the pages, and give `--line-top` the height of a sticky bar above it, or the line crosses the page's
  first lines and hides behind the bar once scrolled. Without it, `router.mountOn(outlet)` swaps the pages at once.
- A large or rarely opened page loads on demand, in a chunk of its own. The router takes a page's class, not a
  loader: a small page of the app's stands for it in the routes, imports the module when it connects and draws the
  real page inside its own `jl-load-state`, which the outlet waits for. What only that page uses (its data, its
  helpers) goes in its module, not in one the navigation imports.

  ```tsx
  templateHtml(): Node {
    return <JlLoadState skeleton="lines"><slot /></JlLoadState>;
  }

  onConnect(): void {
    if (this.childElementCount > 0) {
      return;
    }
    void this._refs.state.load({
      fetch: () => import('./reports-page').then((module) => module.ReportsPage),
      draw: (Page) => this.append(new Page()),
    });
  }
  ```

## Icons

Icons are lucide's, registered by the module that writes their names, only those:
`registerIcons({ 'refresh-cw': RefreshCw })` with `import { RefreshCw } from 'lucide'`. `registerIcons(COMMON_ICONS)`
registers the ~90 usual ones at once (about 5 kB). An unregistered name draws a neutral mark and warns in the
console.

## Theming

jlib looks like SyWare (blue) by default. Every colour, radius and size is a `--jl-*` custom property in jlib's `jlib`
cascade layer, so a plain rule outside any layer overrides it (`:root { --jl-accent: #6d4ed8; }`). Light and dark
follow the system; `data-theme="light|dark"` on an element forces one for that part of the page.

Keep the palette in one stylesheet. A page's CSS reads `--jl-*` tokens only (`--jl-text`, `--jl-muted`, `--jl-line`,
`--jl-surface-2`, `--jl-accent`, `--jl-danger`, `--jl-space-*`, `--jl-font-*`, `--jl-radius*`…) and never writes a
colour.

## Other languages: jlib's texts

What jlib's components say on their own (close and clear buttons, "Show more", a file drop's refusals, the labels
screen readers hear, the defaults of their text inputs) is in English, French or German: jlib translates it, and
shows English until the app chooses.

- An app in one language chooses it once, in `main.tsx`, before anything is drawn:
  `await jlTexts.setLocale('fr')` (a region takes its language: `fr-CH` shows French).
- An app with a Jadis `Translator` has jlib follow it: `await jlTexts.follow(i18n)`. jlib loads its texts for each of
  the app's languages, then changes language with the app, every component drawing its texts again.
- `jlTexts.add('it', 'en')` shows one of jlib's languages for another (or `jlTexts.add('es', () => import('./jl-es'))`
  with all its texts); `jlTexts.fix('de-CH', { close: 'Schliessen' })` changes a few texts of one language. Both are
  checked against `DEFAULT_TEXTS`, the English texts; `JL_LANGUAGES` lists jlib's languages.
- The texts that name the app's own content (a page's heading, a tree's empty text) are inputs of each component. A
  text jlib shows that none of this can change is a gap: report it (below).
- A component of the app that extends `JlElement` writes its own texts in a method of another name than `drawTexts`,
  which is jlib's.

## Writing a view

- Write every component by its class in JSX, children included: `<JlPage heading="Sync"><JlCard>…</JlCard></JlPage>`,
  `<JlAppShell narrowHeader>…</JlAppShell>`. The view then imports the class, so the bundle keeps it, its inputs are
  type-checked, and no `define()` is needed. Never the tag form (`<jl-page>`) in a view's JSX.
- Inputs are `useChange` fields: a JSX prop sets them (`label="…"`), code calls `.set()`/`.get()`
  (`button.loading.set(true)`). Outputs are events: in JSX an `on…` prop, its handler given the detail and typed as the
  component is (`<JlButton onPress={() => this.save()} />`, `<JlSelect<Currency> onChange={(value) => …} />`); in code
  `events.register('press', …)`, in `onConnect`. Refs find a component by its class (`ref(JlTree)`), or by its own
  class among several (`ref<JlInput>('.label')`).
- A component that holds the page's values or records is typed by them: `JlSelect<Currency>`, `JlTable<Order>`,
  `JlMenu<'rename' | 'delete'>`. Its events then give those types, and a misspelt value fails the typecheck.
- A function is never a `useChange` value (`set(fn)` calls it as an updater): such inputs are plain properties
  (`tree.loader = …`).
- A view's CSS does not reach inside a component: nodes a `jl-table` renderer draws live in the table's shadow
  root, so draw them with jl-* components (`JlLink`, `JlBadge`) rather than classes of the view.
- A view's `display: grid` on an element beats `[hidden]`: each view's CSS ends with `[hidden] { display: none; }`.
- `jl-select`'s empty value means "nothing chosen": give a real choice a value of its own (`head`).
- A page with a form guards it against leaving with changes not saved: it declares
  `canLeave = (): Promise<boolean> => Promise.resolve(true);` (`implements RoutedPage`), and sets it in `onConnect`:
  `this.canLeave = guardLeave({ isDirty: () => …, signal: this.killSignal })`. The router calls it before it leaves
  the page, for a link or Back, and waits: "Leave without saving?", in jlib's texts. Closing or reloading the tab
  asks the browser's own question. Back reaches the router only within the app: a page loaded directly is left by
  the browser. The documentation's Forms guide does it with its own form.
- Tables: columns are `TableColumn[]` (`format`: `badge` with `tones`, `date`, `datetime`, `number`, `code`;
  `description` names a field shown as a quieter line under the value; `wrap` lets long text break over lines
  instead of widening the table), `rowKey` names a row's id, and `renderers` draw cells by code, typed with
  `cellOf<Row>((row) => node)` from jlib. Rows are plain objects: an interface's rows are spread (`{ ...row }`).

## Testing views in jsdom

A page's tests (Vitest in jsdom) create the view, stub `fetch` and read the components' inputs, not their shadow
DOM:

```tsx
beforeEach(() => vi.stubGlobal('fetch', vi.fn(async (url: string) => answer(url))));
afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); });

it('shows a file found from its address alone', async () => {
  const view = document.body.appendChild(new ObjectsView());
  await settle(); // onConnect runs a task after connecting
  await view.open(FILE);
  expect(view.shadowRoot?.querySelector<JlPage>('jl-page')?.heading.get()).toBe('content');
});
```

jsdom has no layout: components that watch sizes watch nothing, `scrollIntoView` is skipped, and form controls keep
no form value. Toasts animate and use the popover API, which jsdom lacks: keep them out of a test's path or stub
`toast`.

## Rendering pages on a server

Jadis renders an app's pages on a server from 1.7 (`@jadis/core/server`, and `@jadis/fastify` on Fastify): each page
arrives as HTML, every shadow root as declarative shadow DOM, and the components take it over once their code has
loaded. Read Jadis's [Server Rendering](https://bioleyl.github.io/jadis/server-rendering/overview.html) section
first (history routes, a page's data in its `load`, what code gives back). What jlib adds:

- jlib runs in the server's DOM (happy-dom) as it is: where the DOM has no `attachInternals`, its components get
  inert internals.
- The page's own stylesheet imports jlib's tokens, `@import '@syware/jlib/tokens.css';`: jlib gives the document its
  tokens when a component registers, which comes after the first paint.
- Inputs bound to an attribute travel in the markup: a table's `rows` and `columns`, set in the page's `load` on the
  server, are there when it upgrades. A function (a table's `renderers`, a tree's `loader`) does not travel: set it
  in the page's own template, which runs again in the browser.
- Icons registered after the components' imports still draw: a `jl-icon` whose name is not registered yet looks
  again at the end of the task, before the browser paints.
- An element of the page's shell that the server does not render (a `jl-page-outlet` around the body) is styled
  only until its code loads: `jl-page-outlet:not(:defined) { display: block; }`. A page's rule on a jl-* host beats
  the component's own `display`, and keeps beating it after the upgrade: the outlet's line then pushes the page down.
- The server measures nothing: what a component measures (jl-flow's edges, the indicator of `jl-tabs` and
  `jl-segmented`) settles once its code runs.
- Module state is shared by every render of a server: jlib's language too. An app in several languages chooses it
  in each render, from the request.

## Problems, improvements and missing components: an issue

jlib is shared by every app built on it: a bug in a component, an improvement, a missing option or a missing
component is fixed there, once, for all of them. When the app meets one:

- Look for an issue about it first, among [jlib's issues](https://github.com/bioleyl/jlib/issues)
  (`gh issue list --repo bioleyl/jlib --search "…"`).
- Write the issue: what the app needed, what jlib does instead (its version, the component, a few lines of HTML or
  JSX that show it, what the console says), and what would solve it. One issue per problem.
- Show it to the person, who files it, or file it with `gh issue create --repo bioleyl/jlib` once they agree: the
  issue is public.
- Meanwhile, keep the app's way around it small and in one place, with a comment linking the issue, so that it goes
  once jlib has the fix.

A problem in Jadis itself goes to [Jadis's issues](https://github.com/bioleyl/jadis/issues) the same way.
