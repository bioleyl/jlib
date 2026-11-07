# Writing views

A view is a Jadis component that puts jl-* components together. This guide is what a view needs of Jadis and of
jlib; the `jadis-official` skill has Jadis in full.

## Contents

- Jadis in brief
- Components by class
- Inputs
- Events
- Refs
- Typed components
- Slots
- Styles
- Tags in HTML, and `define()`
- Your own components on `JlElement`

## Jadis in brief

- A view extends `Jadis` (or jlib's `JlElement`, below): `static readonly selector = 'app-orders-page'` (lowercase,
  with a hyphen, unique), `templateHtml()` returning its JSX, `templateCss()` returning its styles, and
  `OrdersPage.register()` at the bottom of its module.
- The template is drawn **once**, at the first connection. Nothing re-renders: a change of state writes to the nodes
  it concerns (`textContent`, a component's `.set()`, `replaceChildren` for a list), found with `useRefs`.
- State is `useChange(initial, (value) => …)` fields, read with `get()` and written with `set()`. Values are plain
  data, replaced rather than changed in place (`set((rows) => [...rows, row])`), never a function itself.
- `onConnect()` runs a task after each connection (again if the view is taken out and put back; a view moved in the
  page stays connected). It wires listeners with `this.on(node, 'click', …)`, `events.register(…)` and
  `this.onBus(bus, …)`, which end when the view leaves; `fetch(url, { signal: this.killSignal })` stops with it.
  One-time work there checks what the DOM or the state already holds.
- Outputs are `readonly events = this.useEvents<{ saved: Order }>()`, emitted with `this.events.emit('saved', order)`.
  They do not bubble.
- `tsconfig.json`: `"jsx": "react-jsx"`, `"jsxImportSource": "@jadis/core"`.

## Components by class

Write every jl-* component by its class, its children inside it:

```tsx
templateHtml(): Node {
  return (
    <JlPage heading="Sync" width="form">
      <JlCard heading="Schedule">
        <JlStack>
          <JlField label="Every">
            <JlSelect<Interval> name="interval" options={INTERVALS} value="hour" />
          </JlField>
          <JlSwitch name="paused" label="Paused" />
        </JlStack>
      </JlCard>
    </JlPage>
  );
}
```

- The view imports the class, so the bundle keeps the component; a tag written as a string would be dropped by
  tree-shaking and stay an empty element.
- Every prop is checked against the component's inputs: a misspelt one, or a wrong value of an enum, fails the type
  check.
- `slot="…"`, `class`, `id`, `hidden`, `data-*` and `aria-*` work on a class as on any element. A `style` string
  does not type-check on a class (Jadis 1.8): style the component from the view's CSS. A class takes no `attrs`: an
  attribute no prop names (a `part`) needs the element made with
  `createElement(JlField, { attrs: { part: 'field' }, props: { label: 'Name' } })`, or the tag with `define()`.
- A JSX prop sets the **property**: `label="Save"` calls `button.label.set('Save')`. A hyphenated name
  (`data-id`, `aria-label`) sets the attribute.
- A JSX expression is typed as a plain element: to keep one and use its inputs, cast it,
  `const save = (<JlButton label="Save" />) as JlButton;`, or find it with a ref.

## Inputs

Each input of a jl-* component is a `useChange` field bound to an attribute, the same in all three forms:

```tsx
<JlInput clearable placeholder="Search" />   // JSX
```

```ts
input.clearable.set(true);                   // code
input.placeholder.get();                     // 'Search'
```

```html
<jl-input clearable placeholder="Search"></jl-input>
```

- Lists and objects are plain values in JSX and code, JSON in HTML: `items='[{"label":"Home"}]'`.
- `set(value)` replaces the value; `set((previous) => next)` computes it. A function is therefore never the value of
  a `useChange` input: the inputs that are functions themselves are plain properties (`table.detail`,
  `tree.loader`), set by a JSX prop or by assignment. An object of functions is fine: `table.renderers.set({ … })`.
- Inputs that default to one of jlib's texts (a close button's hint, an empty table's text) default to `''`: leave
  them empty to get jlib's text in the language shown.

## Events

A jl-* component reports with its own events, each with a detail:

```tsx
<JlButton label="Save" variant="primary" onPress={() => this.save()} />
<JlSelect<Currency> options={CURRENCIES} onChange={(currency) => this.convert(currency)} />
```

```ts
onConnect(): void {
  this._refs.search.events.register('search', (text) => this.filter(text));
}
```

- In JSX the prop is `on` and the event's name: `press` is `onPress`, `change` is `onChange`; the handler gets the
  detail, typed. In code, `events.register(name, (detail) => …)` in `onConnect`, ended when the view leaves.
- They do not bubble: listen on the component itself, never on a parent.
- Listen to `press`, not `click`: `press` fires only when the button can be pressed (not disabled, not loading).
  Native events that come out of a component (`input`, `keydown`, `focusin`) are the browser's: prefer the
  component's own (`input`, `change`, `enter`, `search`).
- An event's names and details are in the component's reference, under Events.

## Refs

```ts
private readonly _refs = this.useRefs((ref) => ({
  state: ref(JlLoadState),                       // the one jl-load-state of the template
  table: ref<JlTable<Order>>('jl-table'),        // by selector, to keep the type parameter
  rename: ref<JlButton>('.rename'),              // one among several, by its class
  list: ref<HTMLUListElement>('ul'),
}));
```

- A ref is a getter that queries the view's shadow root at each access: read it after the first connection, never in
  the constructor or a field initializer.
- `ref(JlLoadState)` finds the component of that class when the template has one; among several, give each a class.
- Refs hold HTML elements only.

## Typed components

A component that holds the page's values or records takes their type, and its inputs and events follow:

| Component | Typed by | Checks |
|---|---|---|
| `JlTable<Order>` | the rows | columns' `key` and `description`, `rowKey`, `sortKey`, renderers, the `sort` event |
| `JlSelect<Currency>`, `JlRadioGroup<…>`, `JlSegmented<…>` | the values | options, `value`, `change` |
| `JlChipGroup<Status>` | the values | options, `value` (a list), `change` |
| `JlMenu<'rename' \| 'delete'>` | the actions | items' `value`, `select` |
| `JlSideNav<Place>`, `JlTabBar<Place>`, `JlBreadcrumb<…>` | the ids | items' `id`, `value`, `select` |
| `JlCommandPalette<Command>` | the command ids | commands' `id`, `select` |

```ts
type Currency = 'chf' | 'eur';
const CURRENCIES: SelectOption<Currency>[] = [
  { label: 'Swiss franc', value: 'chf' },
  { label: 'Euro', value: 'eur' },
];
```

- In JSX the type is written after the class (`<JlSelect<Currency> …/>`) or read from the props.
- Rows are plain objects of a `type` (`type Order = { … }`). A value read back from the DOM (`dataset.value`) is
  looked up among the options, not cast.
- Each typed component's reference has a Typing section with both forms.

## Slots

Components that take content say where in their reference (Slots): the default slot, and named ones written with
`slot="…"` on the child.

```tsx
<JlCard heading="Members">
  <JlButton slot="actions" icon="plus" hint="Add a member" variant="ghost" />
  <JlTable<Member> columns={MEMBER_COLUMNS} rowKey="id" />
  <JlLink slot="footer" href="#/members" label="All members" />
</JlCard>
```

A slotted child stays in the view's shadow root: the view's CSS styles it, and the view's refs find it.

## Styles

A view's stylesheet is a `.css` file beside it, imported with `?inline` and returned by `templateCss()`:

```css
/* src/pages/order-page.css */
:host {
  display: block;
}

.totals {
  display: grid;
  gap: var(--jl-space-2);
  color: var(--jl-muted);
  font-size: var(--jl-font-sm);
}

jl-table {
  margin-block-start: var(--jl-space-4);
}

jl-button.pill::part(base) {
  border-radius: var(--jl-radius-pill);
}

[hidden] {
  display: none;
}
```

- Read tokens only (`--jl-text`, `--jl-muted`, `--jl-line`, `--jl-surface-2`, `--jl-accent`, `--jl-space-*`,
  `--jl-font-*`, `--jl-radius*`…): [theming.md](theming.md) lists them.
- A view styles its own nodes and the hosts of the jl-* components it places: `display`, `margin`, `width`, `grid-*`.
  Inside a component, only its parts (`::part(base)`, listed in its reference under Styling) and the tokens set on it
  (`.checkout jl-button { --jl-accent: … }`).
- `?inline`, never `?raw`: Vite minifies `?inline` CSS in the build.
- An element of the view with `display: grid` or `flex` beats `[hidden]`: hence the last rule.
- A sideways scroller inside a grid gets `min-width: 0` on its grid item, or `grid-template-columns: minmax(0, 1fr)`,
  or phones scroll the whole page sideways.

## Tags in HTML, and `define()`

The tag form is for HTML: a string set as `innerHTML`, `index.html`, a server's template, another framework's
markup. A module that writes tags this way defines their classes, which also keeps them in the bundle:

```ts
import { define, JlButton, JlInput } from '@syware/jlib';

define(JlButton, JlInput);
```

`@syware/jlib/all` defines every component and registers the common icons, for a page without a bundler that writes
tags only (see [setup.md](setup.md#without-a-build-step)).

## Your own components on `JlElement`

An app's own component can extend `JlElement` instead of `Jadis`: it gets jlib's tokens adopted by the document,
`whenRendered`, `reflect`, and starts its styles with jlib's own.

```tsx
// src/components/order-total.tsx
import { css } from '@jadis/core';
import { BASE_STYLES, JlElement } from '@syware/jlib';

import styles from './order-total.css?inline';

export class OrderTotal extends JlElement {
  static readonly selector = 'app-order-total';

  readonly amount = this.useChange(0, (amount) => this.drawAmount(amount), { attribute: 'amount' });

  readonly currency = this.useChange('CHF', () => this.drawAmount(this.amount.get()), { attribute: 'currency' });

  private readonly _refs = this.useRefs((ref) => ({ value: ref('output') }));

  templateHtml(): Node {
    return <output />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private drawAmount(amount: number): void {
    const format = new Intl.NumberFormat(undefined, { currency: this.currency.get(), style: 'currency' });
    this._refs.value.textContent = format.format(amount);
  }
}

OrderTotal.register();
```

```css
/* src/components/order-total.css */
:host {
  display: inline-block;
  font-variant-numeric: tabular-nums;
}
```

- `BASE_STYLES` gives box sizing, the focus ring, `hidden` and `.sr-only`; add `CONTROL_STYLES` for a text field's
  `.control` frame, `FLOATING_STYLES` for what opens over the page.
- `drawTexts()` is jlib's: it writes jlib's texts at each language change. Give the method that writes your app's
  texts another name (`writeTexts`), with its own `useTranslation`.
- `reflect('variant', value)` mirrors a value on the host for `:host([variant="…"])`; call it from that input's own
  callback.
- Don't name an input or a method like an `HTMLElement` member: `title`, `hidden`, `role`, `remove`, `click`,
  `translate`, `focus`.
- A control that a form submits extends `JlFormControl`, which is form-associated: look at `jl-switch` or
  `jl-input` in jlib's source before writing one, and ask whether a jl-* control would do.
