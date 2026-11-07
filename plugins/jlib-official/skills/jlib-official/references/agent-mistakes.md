# Mistakes models make with jlib

Read this the first time you use the skill in a session. Models that do not know jlib write it like MUI, shadcn or
plain HTML: they invent props, listen to clicks, mirror state, and paint colours. Several of these were found in
apps built on jlib. Each entry shows the mistake, why it breaks, and what to write instead. The rule names are those
of [SKILL.md](../SKILL.md#rules).

## Contents

1. The tag form in JSX
2. Props and components from other kits
3. `click` listeners, and listeners on a parent
4. A control's value mirrored in state
5. Reading a component's shadow DOM
6. A function given to `set()`
7. Literal colours, utility classes, inline styles
8. Icons not registered, or imported as components
9. Styling inside a component
10. `[hidden]` beaten by `display`
11. jlib's texts written by hand
12. Loading with a spinner and an `if`
13. Loading again on Try again
14. A page without `JlPage`, or with several primary actions
15. A form that is not a form
16. Errors in a toast, questions in `confirm()`
17. `jl-select`'s empty value used as a choice
18. A toaster inside a shadow root
19. A page that imports the router
20. Writing the address by hand
21. Kebab-case props in JSX
22. One ref for two components of a class
23. `?raw` styles
24. Tests that read the shadow DOM, or do not wait

## 1. The tag form in JSX

Rule: **By class in JSX.**

```tsx
// Bad: a string tag: tree-shaking drops the component, the props are not checked
<jl-page heading="Orders">
  <jl-button variant="primary" label="New order"></jl-button>
</jl-page>
```

The module never names `JlPage`, so the bundler drops it and the tag stays an empty element, with no error. Nothing
checks `heading` or `variant`.

```tsx
// Good: classes, children included
<JlPage heading="Orders">
  <JlButton slot="actions" variant="primary" label="New order" />
</JlPage>
```

A tag belongs in HTML strings and `index.html`, with `define(JlPage, JlButton)` in the module that writes them.

## 2. Props and components from other kits

Rule: **Real APIs only.**

None of these exist: `<JlButton onClick>`, `color="primary"`, `variant="contained"`, `size="small"`,
`<JlButton disabled={loading}>` to show a load, `<JlModal>`, `<JlDataGrid>`, `<JlTextField>`, `<JlSnackbar>`,
`open={true}` on a toast, `<JlIcon icon={Plus} />`.

| Wanted | jlib |
|---|---|
| A button's action | `onPress`, and `loading` while it runs |
| Its text | `label="Save"` (the default slot is for rich content) |
| Its importance | `variant`: `primary`, `secondary`, `ghost`, `danger` |
| Its size | `size`: `sm`, `md`, `lg` |
| A modal | `JlDialog` (`show()`, `close()`), or `confirmDialog()` |
| A data grid | `JlTable<Row>` |
| A text field with its label | `JlField` around a `JlInput` |
| A snackbar | `toast()` |

Look the component up in [components.md](components.md) and read its reference before writing a prop.

## 3. `click` listeners, and listeners on a parent

Rule: **Inputs are fields, outputs are events.**

```tsx
// Bad: a native click fires on a disabled or loading button too; a parent never hears a jl-* event
this.on(this._refs.save, 'click', () => this.save());
this.on(this._refs.list, 'change', (event) => this.toggle(event));
```

```tsx
// Good: the component's own event, on the component itself
<JlButton label="Save" onPress={() => this.save()} />

{skills.map((skill) => (
  <JlSwitch label={skill.name} checked={skill.on} onChange={(on) => this.setSkill(skill, on)} />
))}
```

jl-* events do not bubble: each switch of a list gets its own handler. In code,
`switchElement.events.register('change', …)` in `onConnect`.

## 4. A control's value mirrored in state

Rule: **The component holds the state.**

```ts
// Bad: a copy that drifts from what the select shows
private readonly _currency = this.useChange<Currency>('chf', () => {});
// …onChange={(value) => this._currency.set(value)}
```

```ts
// Good: read it from the control, or take the event's detail
const currency = this._refs.currency.value.get();
```

A form's values come from `FormData` or from each control's `value.get()`.

## 5. Reading a component's shadow DOM

Rule: **Inputs are fields, outputs are events.**

```ts
// Bad: jlib's markup is its own, and changes between versions
const text = this._refs.name.shadowRoot?.querySelector('input')?.value;
this._refs.nav.shadowRoot?.append(myButton);
```

```ts
// Good
const text = this._refs.name.value.get();
```

A component that lacks an option (a button on a side nav's row) is an issue on jlib, not a patch into its shadow
root, which the next version breaks.

## 6. A function given to `set()`

Rule: **Typed by the page's data.**

```ts
// Bad: set() calls a function as an updater, with the previous value
tree.loader.set((parent, offset) => fetchLevel(parent, offset));
```

```ts
// Good: the inputs that are functions are plain properties
tree.loader = (parent, offset) => fetchLevel(parent, offset);
table.detail = (order) => <JlFacts items={factsOf(order)} />;
```

An object of functions is an ordinary value: `table.renderers.set({ number: (order) => … })`.

## 7. Literal colours, utility classes, inline styles

Rule: **Tokens only.**

```css
/* Bad */
.summary { background: #f7f8f9; color: #5b616b; border-radius: 10px; box-shadow: 0 2px 8px rgb(0 0 0 / 0.1); }
```

```tsx
// Bad
<div class="p-4 text-gray-500" style="color: #0c72b0">…</div>
```

Literal colours break dark mode and the app's palette; a shadow on a flat surface breaks SyWare's look.

```css
/* Good */
.summary {
  background: var(--jl-surface-2);
  color: var(--jl-muted);
  border: 1px solid var(--jl-line);
  border-radius: var(--jl-radius);
}
```

## 8. Icons not registered, or imported as components

Rule: **Icons by name, registered.**

```tsx
// Bad: lucide's icons are not JSX components here; and an unregistered name draws a neutral mark
import { Plus } from 'lucide';
<JlButton label="New"><Plus /></JlButton>
<JlButton icon="file-spreadsheet" label="Export" />
```

```ts
// Good: the module that writes the name registers it
import { registerIcons } from '@syware/jlib';
import { FileSpreadsheet } from 'lucide';

registerIcons({ 'file-spreadsheet': FileSpreadsheet });
```

```tsx
<JlButton icon="file-spreadsheet" label="Export" />
```

The console warning `jl-icon: no icon named "…"` means a missing registration: fix it, never ignore it.

## 9. Styling inside a component

Rule: **CSS stops at shadow roots.**

```css
/* Bad: selectors never cross a shadow root */
jl-button button { border-radius: 999px; }
jl-table td.total { font-weight: 700; }
```

```css
/* Good: the part a component exposes, or a token set on it */
jl-button.pill::part(base) { border-radius: var(--jl-radius-pill); }
.checkout jl-button { --jl-accent: var(--jl-ok); }
```

What a table's renderer draws lives in the table's shadow root: a class of the view does not style it. Draw it with
jl-* components (`JlBadge`, `JlLink`), or keep the column's `format`.

## 10. `[hidden]` beaten by `display`

Rule: **CSS stops at shadow roots.**

```css
/* Bad: .panel { display: grid } wins over the browser's [hidden], and the panel never hides */
.panel { display: grid; }
```

Each view's CSS ends with:

```css
[hidden] {
  display: none;
}
```

`hidden` on a jl-* component works on its own: jlib's styles hide its host.

## 11. jlib's texts written by hand

Rule: **jlib speaks through jlTexts.**

```tsx
// Bad: the same French in every view, and screen readers' labels left in English
<JlDialog heading="Nouveau client" />
<JlLoadMore label="Afficher plus" countText="{shown} sur {total}" />
```

```ts
// Good: once, before anything is drawn; the views pass only their own content
await jlTexts.setLocale('fr-CH');
```

Set a jlib text by hand only to say something more precise than jlib's ("Delete the order" for a confirm button).

## 12. Loading with a spinner and an `if`

Rule: **Data comes in load states.**

```tsx
// Bad: no skeleton, no error with Try again, no empty state, and the page outlet does not wait for it
private async load(): Promise<void> {
  this._refs.spinner.hidden = false;
  const orders = await fetchOrders();
  this._refs.spinner.hidden = true;
  this._refs.table.rows.set(orders);
}
```

```tsx
// Good
<JlLoadState errorHeading="The orders could not be loaded">
  <JlTable<Order> columns={COLUMNS} />
  <JlEmpty slot="empty" heading="No orders yet" />
</JlLoadState>
```

```ts
void this._refs.state.load({
  draw: (orders) => this._refs.table.rows.set(orders),
  fetch: () => fetchOrders(this.killSignal),
  isEmpty: (orders) => orders.length === 0,
});
```

## 13. Loading again on Try again

Rule: **Data comes in load states.**

```tsx
// Bad: Try again already runs the last load() again: this fetches twice
<JlLoadState onRetry={() => void this.load()} />
```

Leave `retry` alone, or listen to it only to say something (a log), never to load.

## 14. A page without `JlPage`, or with several primary actions

Rule: **A page is a `JlPage`.**

```tsx
// Bad: a hand-made header, two primary buttons, a red button in the header
<header class="head">
  <h1>Order 160</h1>
  <JlButton variant="primary" label="Prepare" />
  <JlButton variant="primary" label="Invoice" />
  <JlButton variant="danger" label="Cancel order" />
</header>
```

```tsx
// Good: the page's header, one primary action, the rare and the destructive behind an ellipsis
<JlPage heading="Order 160" back="/orders" backLabel="Orders">
  <JlButton slot="actions" label="Invoice" />
  <JlMenu<OrderAction> slot="actions" items={MORE_ACTIONS} onSelect={(action) => void this.act(action)}>
    <JlButton slot="trigger" variant="ghost" icon="ellipsis" hint="More actions" />
  </JlMenu>
  <JlButton slot="actions" variant="primary" label="Prepare" />
</JlPage>
```

No red button in the header: the danger look belongs to the destroying item of a menu (last, after a line) and to the
confirm button of its confirmation.

## 15. A form that is not a form

Rule: **Forms are forms.**

```tsx
// Bad: no <form>, labels written by hand, a label twice
<div>
  <label>Email</label>
  <JlInput label="Email" />
  <JlButton label="Send" onPress={() => this.send()} />
</div>
```

```tsx
// Good
<form noValidate>
  <JlStack>
    <JlField label="Email" required>
      <JlInput name="email" type="email" required />
    </JlField>
    <JlButton type="submit" variant="primary" label="Send" />
  </JlStack>
</form>
```

`JlField` names its control; a `JlButton type="submit"` submits the form around it, and so does Enter in a field of
one line. A form in a dialog: the `<form>` goes around the `JlDialog`
([forms.md](forms.md#a-form-in-a-dialog)).

## 16. Errors in a toast, questions in `confirm()`

Rule: **Ask and answer with jlib.**

```ts
// Bad
toast({ heading: 'Some fields are missing', tone: 'danger' });
if (window.confirm('Are you sure?')) { … }
```

```ts
// Good: the error under its field; the question names the thing and the consequence
this._refs.emailField.error.set('Enter an email address, like name@example.com.');
const confirmed = await confirmDialog({
  confirmLabel: 'Delete',
  heading: `Delete ${client.name}?`,
  text: 'Their offers and invoices stay as they are.',
  tone: 'danger',
});
```

What can be undone does not ask: it happens, with **Undo** in its toast.

## 17. `jl-select`'s empty value used as a choice

Rule: **The component holds the state.**

```ts
// Bad: '' means "nothing chosen": the placeholder shows, and required refuses it
const LIMITS: SelectOption[] = [{ label: 'No limit', value: '' }, { label: '10', value: '10' }];
```

```ts
// Good: a real choice has a value of its own, turned back into the empty setting when saved
const NO_LIMIT = 'any';
const LIMITS: SelectOption[] = [{ label: 'No limit', value: NO_LIMIT }, { label: '10', value: '10' }];
```

## 18. A toaster inside a shadow root

Rule: **Ask and answer with jlib.**

`toast()` looks for a `JlToaster` in the document and makes one on `<body>` otherwise. A `<JlToaster />` placed in a
view's shadow root is never found: toasts appear in a second toaster. Place none (the default corner), or put the
one with your `placement` in the document (`document.body.append(new JlToaster())`).

## 19. A page that imports the router

Rule: **Check it runs.**

```ts
// Bad: router.ts imports every page; a page that imports router.ts makes a cycle, and the routes are built
// before the page's class exists ("Cannot convert undefined or null to object" in defineRoutes)
import { router, NEW_ORDER_ROUTE } from '../app/router';
```

Pages navigate through a small module of their own (`navigate()`, `replaceAddress()` on a bus the frame connects to
the router), read their route in `onRoute`, and compare `route.path` with the path they know
([recipes.md](recipes.md#an-app-from-scratch)).

## 20. Writing the address by hand

Rule: **Real APIs only.**

```ts
// Bad: the router does not know: its page and the address part ways
history.pushState(null, '', `/orders/${id}`);
location.hash = '#/orders';
```

Links (`href`) do most of it; code goes through the router (`gotoPath`, `replacePath`), through the navigation
module.

## 21. Kebab-case props in JSX

Rule: **By class in JSX.**

```tsx
// Bad: a hyphenated name sets the attribute, which TypeScript does not check
<JlPage app-name={APP_NAME} />
<JlLoadState error-heading="The orders could not be loaded" />
```

```tsx
// Good: the property, typed
<JlPage appName={APP_NAME} />
<JlLoadState errorHeading="The orders could not be loaded" />
```

## 22. One ref for two components of a class

Rule: **Real APIs only.**

```ts
// Bad: ref(JlLoadState) finds the first one only
private readonly _refs = this.useRefs((ref) => ({ orders: ref(JlLoadState), stats: ref(JlLoadState) }));
```

```ts
// Good: a class for each, found by its selector
private readonly _refs = this.useRefs((ref) => ({
  orders: ref<JlLoadState>('.orders-state'),
  stats: ref<JlLoadState>('.stats-state'),
}));
```

## 23. `?raw` styles

Rule: **Tokens only.**

```ts
// Bad: kept as written, comments included: no bundler minifies a string
import styles from './orders-page.css?raw';
```

```ts
// Good
import styles from './orders-page.css?inline';
```

## 24. Tests that read the shadow DOM, or do not wait

Rule: **Check it runs.**

```ts
// Bad: jlib's markup, read before onConnect ran
const page = document.body.appendChild(new OrdersPage());
expect(page.shadowRoot?.querySelector('jl-table')?.shadowRoot?.querySelectorAll('tr').length).toBe(2);
```

```ts
// Good: wait for what it queued, then read the inputs
const page = document.body.appendChild(new OrdersPage());
await settle();
expect(page.shadowRoot?.querySelector<JlTable<Order>>('jl-table')?.rows.get()).toHaveLength(1);
```

See [testing.md](testing.md).
