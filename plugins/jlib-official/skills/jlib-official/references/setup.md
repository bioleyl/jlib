# Setup

## Contents

- A new app
- Adding jlib to a Jadis app
- TypeScript
- Vite and Vitest
- The document's styles
- Without a build step
- Updating jlib

## A new app

Start from Jadis's TypeScript template, then add jlib:

```bash
npx @jadis/create ts my-app
cd my-app
npm install @syware/jlib lucide
npm install @fontsource-variable/manrope @fontsource-variable/jetbrains-mono
npm install -D vitest jsdom
```

Then give it the frame of [recipes.md](recipes.md#an-app-from-scratch): `main.tsx`, `icons.ts`, the document's
styles, the navigation, the router and the frame. An app on SyWare's UX also loads the `syware-ux` skill.

## Adding jlib to a Jadis app

```bash
npm install @syware/jlib lucide
```

- `@jadis/core` is a peer dependency (1.6 or later; this skill describes jlib on 1.8): the app and jlib share one
  copy. Two copies (a linked jlib, a bundler that duplicates it) break `instanceof` and the JSX types: dedupe it
  (`resolve: { dedupe: ['@jadis/core'] }` in Vite).
- `lucide` gives the icons the app registers by name.
- Imports come from `@syware/jlib`; a component alone from `@syware/jlib/<level>/<tag>`
  (`@syware/jlib/organisms/jl-table`); the tokens stylesheet from `@syware/jlib/tokens.css`.
- jlib is tree-shaken: a component's module is kept when the app uses its class, and dropped otherwise. A tag written
  only in HTML needs `define(…)` ([views.md](views.md#tags-in-html-and-define)).

## TypeScript

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@jadis/core",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "target": "ES2022",
    "types": ["vite/client"],
    "useDefineForClassFields": true
  }
}
```

`vite/client` types the `?inline` imports of the views' styles. `noUncheckedIndexedAccess` is worth turning on: a
route's `params.id` is then `string | undefined`, as it is.

## Vite and Vitest

```ts
// vite.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: { jsx: { importSource: '@jadis/core', runtime: 'automatic' } },
  test: {
    // The views' ?inline styles import empty otherwise.
    css: true,
    environment: 'jsdom',
  },
});
```

- A view's CSS is imported with `?inline` (`import styles from './orders-page.css?inline'`): Vite minifies it in the
  build. Never `?raw`, which keeps comments and spaces, since no bundler minifies a string.
- History routes need the server to answer every route with `index.html`: Vite's dev server does; a static host
  needs a rule, or the router's `mode: 'hash'`.
- Testing in jsdom: [testing.md](testing.md).

## The document's styles

jlib gives the document its tokens when its first component registers. The page's own stylesheet sets the body in
them, and the app's palette when it has one ([theming.md](theming.md)):

```css
/* src/styles/document.css, imported first by main.tsx */
body {
  margin: 0;
  background: var(--jl-bg);
  color: var(--jl-text);
  font-family: var(--jl-font-sans);
  font-size: var(--jl-font-md);
}
```

A page that must have the tokens before its script runs (rendered on a server, a static page) imports them:
`@import '@syware/jlib/tokens.css';`.

Fonts: `import '@fontsource-variable/manrope';` and `import '@fontsource-variable/jetbrains-mono';` in `main.tsx`;
without them, the system's fonts.

## Without a build step

A page that only writes tags (a static site, a prototype, a page of another framework) can load jlib from a CDN with
an import map. `@syware/jlib/all` defines every component and registers the common icons:

```html
<script type="importmap">
  {
    "imports": {
      "@jadis/core": "https://esm.sh/@jadis/core@1.9.0",
      "@jadis/core/": "https://esm.sh/@jadis/core@1.9.0/",
      "lucide": "https://esm.sh/lucide@1.61.0",
      "@syware/jlib/all": "https://esm.sh/@syware/jlib@0.16.0/all?external=@jadis/core,lucide"
    }
  }
</script>
<script type="module">
  import { jlTexts } from '@syware/jlib/all';

  await jlTexts.setLocale('fr');
</script>

<jl-field label="Email" hint="We never share it.">
  <jl-input name="email" type="email" icon="mail" clearable></jl-input>
</jl-field>
<jl-button variant="primary" icon="plus" label="Subscribe"></jl-button>
```

Pin the versions; `external` keeps one copy of Jadis and lucide for the page and jlib. It loads every component:
an app with a bundler imports what it uses instead.

## Updating jlib

```bash
npm view @syware/jlib version
npm install @syware/jlib@latest
```

Read the [changelog](https://bioleyl.github.io/jlib/changelog) first: each release says what to look at when you
update. Then type-check (a renamed input or a narrowed type fails there), run the tests, and look at the pages.
