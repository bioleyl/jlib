# Rendering pages on a server

Jadis renders an app's pages on a server from 1.7 (`@jadis/core/server`, and `@jadis/fastify` on Fastify): each page
arrives as HTML, every shadow root as declarative shadow DOM, and the components take it over once their code has
loaded. The `jadis-official` skill and Jadis's
[Server Rendering](https://bioleyl.github.io/jadis/server-rendering/overview.html) section come first (history
routes, a page's data in its `load`, what code gives back). This is what jlib adds.

## Contents

- jlib on the server
- Tokens before the first paint
- What travels in the markup
- The shell around the pages
- What the server cannot measure
- Language per request

## jlib on the server

jlib runs in the server's DOM (happy-dom) as it is. Where the DOM has no `attachInternals`, its components get inert
internals: nothing to stub.

## Tokens before the first paint

jlib gives the document its tokens when a component registers, which in the browser comes after the first paint.
The page's own stylesheet imports them, so the HTML the server sends is drawn in them at once:

```css
@import '@syware/jlib/tokens.css';
```

## What travels in the markup

- Inputs bound to an attribute travel: a table's `rows` and `columns`, set in the page's `load` on the server, are in
  the markup when the page upgrades.
- A function does not travel (a table's `renderers` or `detail`, a tree's `loader`): set it in the page's own
  template, which runs again in the browser.
- Icons registered after the components' imports still draw: a `jl-icon` whose name is not registered yet looks
  again at the end of the task, before the browser paints.

## The shell around the pages

An element of the page's shell that the server does not render (a `jl-page-outlet` written in `index.html` around
the body) is styled only until its code loads:

```css
jl-page-outlet:not(:defined) {
  display: block;
}
```

Only until then: a page's rule on a jl-* host beats the component's own `display`, and would keep beating it after
the upgrade (the outlet's loading line would then push the page down).

```ts
// The client's entry: the router takes over the page the server rendered in the outlet.
const outlet = document.querySelector<JlPageOutlet>(JlPageOutlet.selector);
if (outlet) {
  new Router(routes, { links: true }).mountOn(outlet, { show: (page) => outlet.show(page) });
}
```

## What the server cannot measure

The server measures nothing: what a component measures (jl-flow's edges, the indicator of `jl-tabs` and
`jl-segmented`) settles once its code runs.

## Language per request

Module state is shared by every render of a server, jlib's language too: an app in several languages chooses it in
each render, from the request (`await jlTexts.setLocale(locale)` before rendering), and never relies on the last
render's.
