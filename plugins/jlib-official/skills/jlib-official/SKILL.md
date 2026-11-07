---
name: jlib-official
description: Build and change apps on jlib (`@syware/jlib`), SyWare's 76 `jl-*` web components on Jadis — the app's frame, pages, tables, forms, dialogs, load states, toasts and confirmations, theming through `--jl-*` tokens, icons, jlib's texts in French and German, tests in jsdom and server rendering. Teaches finding the right component and its whole API (a reference per component, offline), writing views with the components by class in JSX, the mistakes agents make with jlib, and a self-check to run before delivering. Load it before writing, reviewing or debugging code that imports `@syware/jlib` or writes `jl-*` tags, before starting an app on jlib, and when a page needs a component or an option it cannot find, even when the request only says a table, a form, a dialog or a page in a project that depends on jlib.
license: MIT
---

# jlib

jlib (`@syware/jlib`) is the component library of SyWare's apps, free for any app: 76 `jl-*` web components on
Jadis, typed, tree-shaken, themed by `--jl-*` CSS custom properties, their own texts in English, French and German.
An app's views are Jadis components that put jl-* components together. Never bring another UI kit, a CSS framework or
a second component model on top of it.

Written for `@syware/jlib@0.12.0`, on `@jadis/core` 1.8. Documentation: <https://bioleyl.github.io/jlib/> ·
Source: <https://github.com/bioleyl/jlib>

## How to use this skill

1. **First time in a session**: read this file, then [references/agent-mistakes.md](references/agent-mistakes.md).
   It shows what models write from other UI kits' habits, and what jlib needs instead.
2. **Before writing a view**: find its components in [references/components.md](references/components.md), then
   open each one's reference (`references/components/<tag>.md`): every input, event, slot, method and part, with
   examples. Open the guide for the task ([Where to look](#where-to-look)). A component or an option you cannot find
   is not there: do not invent it.
3. **While writing**: follow the [rules](#rules); copy the shape of [the view below](#a-complete-view).
4. **Before delivering**: run the [self-check](#self-check-before-delivery) on your diff, fix what it finds, and
   report.
5. **Asked to review code on jlib**: walk the rules and the mistakes file over it, and report each finding with its
   place, the rule's name, the code quoted and a fix. Don't edit unless asked.

Views are Jadis components: the essentials are in [references/views.md](references/views.md); the `jadis-official`
skill teaches Jadis in full (the Claude Code plugin installs it with this one). How SyWare's apps behave (their
frame, lists, forms, states and feedback) is the `syware-ux` skill: an app that follows SyWare's UX loads both.

The project's own rules (`AGENTS.md`, `CLAUDE.md`, its README) and its consistent conventions win over this skill.

## The model, if you know other UI kits

| You would write (MUI, shadcn, Vuetify, Tailwind, plain HTML) | With jlib |
|---|---|
| `<Button variant="contained" onClick={save}>Save</Button>` | `<JlButton variant="primary" label="Save" onPress={() => this.save()} />`: inputs are props, outputs are `on…` props given the event's detail |
| `useState` mirroring a control's value | The control holds it: `select.value.get()`, the `change` event's detail, or `new FormData(form)` |
| `<label>`, `<input>` and an error `<span>` | `<JlField label="Email" error={…}><JlInput name="email" type="email" /></JlField>` in a real `<form>` |
| A data grid library | `<JlTable<Order> columns={COLUMNS} rowKey="id" />`, rows set with `table.rows.set(orders)` |
| `if (loading) <Spinner/>`, `if (error) …` | A `JlLoadState` around the content: `state.load({ fetch, draw, isEmpty })` draws the skeleton, the content, the empty slot or the error with **Try again** |
| A modal library, `window.confirm` | `JlDialog` for a task; `await confirmDialog({ heading, text, tone: 'danger' })` for a yes or no |
| A toast library | `toast({ heading: 'Order sent', tone: 'ok' })` |
| `<PlusIcon />` imported per use | `icon="plus"`: names, registered once by the module that writes them (`registerIcons`) |
| `className="text-gray-500 p-4"`, theme objects | The view's own CSS reading `--jl-*` tokens: `color: var(--jl-muted); padding: var(--jl-space-4);` |
| A layout library, a hand-made page shell | `JlAppShell`, `JlSideNav`, `JlPage`, `JlCard`, `JlStack`, `JlSplitView` |
| `<Outlet />` of a router | Jadis's `Router` showing its pages through a `JlPageOutlet` |
| An i18n library for the kit's own texts | `await jlTexts.setLocale('fr')`, or `await jlTexts.follow(i18n)` for an app with a `Translator` |

## A complete view

The shape to copy: a page that lists orders, loads them in a load state, and says when there are none.

```tsx
// src/pages/orders-page.tsx
import { Jadis } from '@jadis/core';
import { JlButton, JlEmpty, JlLoadState, JlPage, JlTable, registerIcons } from '@syware/jlib';
import { Package, Plus } from 'lucide';

import { fetchOrders } from '../services/orders';
import styles from './orders-page.css?inline';

import type { TableColumn } from '@syware/jlib';
import type { Order } from '../types/order.types';

// The icons this module names, and only those.
registerIcons({ package: Package, plus: Plus });

const COLUMNS: TableColumn<Order>[] = [
  { format: 'code', key: 'number', label: 'Order' },
  { description: 'city', key: 'customer', label: 'Customer' },
  { format: 'badge', key: 'status', label: 'Status', tones: { Late: 'warn', Open: 'info', Shipped: 'ok' } },
  { format: 'number', key: 'total', label: 'Total', sortable: true },
  { format: 'date', key: 'placedAt', label: 'Placed', sortable: true },
];

export class OrdersPage extends Jadis {
  static readonly selector = 'app-orders-page';

  // Children found by their class, or by their selector to keep a type parameter.
  private readonly _refs = this.useRefs((ref) => ({
    state: ref(JlLoadState),
    table: ref<JlTable<Order>>('jl-table'),
  }));

  // Drawn once. Components by class: the bundle keeps them, and their props are type-checked.
  templateHtml(): Node {
    return (
      <JlPage heading="Orders" description="Every order of the shop, the latest first." appName="Shop">
        <JlButton slot="actions" variant="primary" icon="plus" label="New order" href="#/orders/new" />
        <JlLoadState errorHeading="The orders could not be loaded">
          <JlTable<Order> columns={COLUMNS} rowKey="id" label="Orders" sortKey="placedAt" sortDirection="desc" />
          <JlEmpty slot="empty" icon="package" heading="No orders yet" description="Orders placed in the shop show here." />
        </JlLoadState>
      </JlPage>
    );
  }

  templateCss(): string {
    return styles;
  }

  // Runs after each connection: loads once, while nothing is shown yet.
  onConnect(): void {
    if (this._refs.state.state.get() !== 'loading') {
      return;
    }
    void this._refs.state.load({
      draw: (orders) => this._refs.table.rows.set(orders),
      fetch: () => fetchOrders(this.killSignal),
      isEmpty: (orders) => orders.length === 0,
    });
  }
}

OrdersPage.register();
```

```css
/* src/pages/orders-page.css */
:host {
  display: block;
}

[hidden] {
  display: none;
}
```

`fetchOrders(signal)` is the app's own: a `fetch` of its API with the signal, the answer typed as `Order[]`. A whole
app, its services, its frame (shell, navigation, router, outlet) and a list that searches and creates, is in
[references/recipes.md](references/recipes.md#an-app-from-scratch).

## Rules

Each rule has a short name; use the name when you cite it in a review.

### Using components

1. **By class in JSX.** Write every jl-* component by its class (`<JlPage>`, `<JlCard>…</JlCard>`), children
   included: the bundle keeps it, its props are typed, and no `define()` is needed. The tag (`<jl-page>`) belongs to
   HTML strings and `index.html` only, which need `define(JlPage)` beside them or the tag stays an empty element.
2. **Inputs are fields, outputs are events.** Set an input with a JSX prop or `.set()`, read it with `.get()`;
   lists and objects too. Listen with an `on…` prop (`onPress`, `onChange`) or `events.register(…)` in `onConnect`.
   jl-* events do not bubble: listen on the component itself. Never `addEventListener('click')` on a jl-*, never
   reach into its shadow root.
3. **The component holds the state.** A control knows its value, a table its rows and selection, a dialog whether it
   is open. Read them back (`value.get()`, the event's detail, `FormData`) rather than mirroring them.
4. **Typed by the page's data.** A component that holds the page's values or records takes their type:
   `JlTable<Order>`, `JlSelect<Currency>`, `JlMenu<'rename' | 'delete'>`, `JlSideNav<Place>`. Rows and values are
   plain data. An input that is a function itself (a table's `detail`, a tree's `loader`) is a plain property, set by
   a prop or by assignment: `set(fn)` would call it as an updater.
5. **Find before you build.** Look in the components list before writing an element of your own: jlib has it more
   often than not. An option it lacks is an issue on jlib, not a copy of the component.

### Look

6. **Tokens only.** Colours, radii, spaces, sizes and fonts come from `--jl-*` tokens: no literal colour in a view,
   no shadow on what does not float. The palette is changed once, in the app's stylesheet.
7. **Icons by name, registered.** Every icon name the app writes (`icon="plus"`) is registered once by the module
   that writes it, `registerIcons({ plus: Plus })` from lucide, or `registerIcons(COMMON_ICONS)`. An unregistered
   name draws a neutral mark and warns.
8. **CSS stops at shadow roots.** A view styles its own nodes and the jl-* hosts it places (`display`, `margin`,
   `width`), a component's `base` part (`::part(base)`) and its tokens; never selectors into a component. What a
   table's renderer draws lives in the table: draw it with jl-* components. Each view's CSS ends with
   `[hidden] { display: none; }`.
9. **jlib speaks through jlTexts.** jlib's own texts (Close, Show more, the labels screen readers hear) follow
   `jlTexts`, chosen once before anything is drawn. Texts that name the app's content are inputs of each component.

### Pages, data, forms

10. **A page is a `JlPage`.** Its heading, description, actions (`slot="actions"`, the primary last, one at most) and
    status (`slot="meta"`), at one of four widths. The router shows pages through a `JlPageOutlet`.
11. **Data comes in load states.** What loads is inside a `JlLoadState` and loaded with its `load()`; `fetch` gets
    `this.killSignal`. The outlet keeps the current page until the next one's load states have their data.
12. **Forms are forms.** A `<form>` of `JlField`s around named controls, read with `FormData`, submitted by a
    `JlButton type="submit"`; an error goes under its field, a page with a form guards it with `guardLeave`.
13. **Ask and answer with jlib.** `confirmDialog` before what cannot be undone, `toast` for an outcome out of view,
    an action's own `loading` while it runs. Never `alert`, `confirm` or `prompt`.

### Verification

14. **Real APIs only.** Check every input, event and method against the component's reference and the installed
    declarations before using it. Never write what an API "should" look like.
15. **Check it runs.** Type-check, run the tests (jsdom has no layout and no popovers: see the testing guide), and
    look at the page in a browser, in light and dark, wide and on a phone.

## Where to look

Open only what the task needs.

| When you | Read |
|---|---|
| Need a component, or think jlib lacks one | [references/components.md](references/components.md), then `references/components/<tag>.md` |
| Start an app, or add jlib to one: packages, TypeScript, Vite, fonts, no build step | [references/setup.md](references/setup.md) |
| Write a view: classes in JSX, inputs, events, refs, slots, typing, styles, your own components on `JlElement` | [references/views.md](references/views.md) |
| Build the frame: app shell, side nav, tab bar, account, search, router, outlet, titles, lazy pages | [references/frame-and-pages.md](references/frame-and-pages.md) |
| Show collections: tables, columns, renderers, rows that open, selection, search and filters, Show more, trees, split views | [references/lists.md](references/lists.md) |
| Write forms: fields, controls, validation, server errors, dialogs, guarding against leaving | [references/forms.md](references/forms.md) |
| Show states and feedback: load states, empty, errors, toasts, confirmations, downloads, progress, status badges | [references/feedback.md](references/feedback.md) |
| Change the look: tokens, the accent, dark mode, parts, icons | [references/theming.md](references/theming.md) |
| Show jlib's texts in the app's language | [references/texts.md](references/texts.md) |
| Write tests (Vitest, jsdom, Playwright) | [references/testing.md](references/testing.md) |
| Render pages on a server | [references/server-rendering.md](references/server-rendering.md) |
| Want a whole example: an app, a list page, a detail page, a dialog that creates, a settings form | [references/recipes.md](references/recipes.md) |
| Need a helper's signature: `toast`, `confirmDialog`, `guardLeave`, `download`, `registerIcons`, `jlTexts`… | [references/api.md](references/api.md) |
| Are new to jlib, or review code | [references/agent-mistakes.md](references/agent-mistakes.md) |

## The installed version

- The app's version: `version` in `node_modules/@syware/jlib/package.json`. Its declarations, commented, are the
  last word on an API: `node_modules/@syware/jlib/dist/<level>/<tag>.d.ts` (`atoms`, `molecules`, `organisms`,
  `templates`), the shared types in `dist/types/`, the helpers in `dist/lib/`.
- The references describe the version above. For an app on another one, its documentation pages are in jlib's
  repository at that version: `https://raw.githubusercontent.com/bioleyl/jlib/v<version>/site/src/docs/components/<tag>.doc.ts`
  (the site draws its pages by script: fetching one gives an empty page).
- A component, an input or a helper the references have and the installed declarations lack is newer: suggest
  updating (`npm view @syware/jlib version`; the [changelog](https://bioleyl.github.io/jlib/changelog) says what to
  look at), or do without it.

## Self-check before delivery

Walk your diff once. Fix every "no", or say why it stays.

1. Is every jl-* component written by its class in JSX, and every tag written in HTML given a `define()`?
2. Did you check each input, event, slot and method you use against the component's reference or declarations?
3. Are values read back from the components (`get()`, event details, `FormData`) rather than mirrored, and are
   components that hold the page's data typed by it?
4. Are listeners on jl-* components `on…` props or `events.register` in `onConnect`, with no `addEventListener` on
   their native events and no query into their shadow roots?
5. Does the view's CSS read only `--jl-*` tokens, style nothing inside a component except through `::part`, and end
   with `[hidden] { display: none; }`?
6. Is every icon name written registered by the module that writes it?
7. Is each page a `JlPage` with one primary action at most, and is what loads inside a `JlLoadState` loaded with
   `load()` and the kill signal, with an empty state where there can be nothing?
8. Are forms real forms of `JlField`s and named controls, errors under their fields, and pages with forms guarded
   with `guardLeave`?
9. Does what cannot be undone ask with `confirmDialog`, and does no `alert`, `confirm` or `prompt` remain?
10. Are jlib's texts in the app's language (`jlTexts`), and no text of jlib's rewritten by hand?
11. Do the type check and the tests pass, and did you look at the page in a browser, light and dark, wide and narrow?
    Say which you could not run.

Then report what the pass changed, as `<file>:<line> — <what changed>`, and end with one line:
`jlib self-check: 2 fixed` or `jlib self-check: clean`.

## What jlib lacks or gets wrong: an issue

jlib is shared by every app built on it: a bug, a missing option or a missing component is fixed there once, for all.

- Look for an existing issue first: `gh issue list --repo bioleyl/jlib --search "…"`.
- Write the issue: what the app needed, what jlib does instead (its version, the component, a few lines of HTML or
  JSX that show it, what the console says), and what would solve it. One issue per problem.
- Show it to the person, who files it, or file it with `gh issue create --repo bioleyl/jlib` once they agree: the
  issue is public.
- Meanwhile keep the app's way around it small and in one place, with a comment linking the issue, so that it goes
  once jlib has the fix. A problem in Jadis itself goes to [Jadis's issues](https://github.com/bioleyl/jadis/issues)
  the same way.
