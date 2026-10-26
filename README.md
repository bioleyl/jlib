<img src="https://bioleyl.github.io/jlib/syware-logo.png" alt="SyWare" height="48">

# jlib

A component library on [Jadis](https://github.com/bioleyl/jadis) and native Web Components, organised in atomic
design: tags that work in any page, typed classes for JSX, form fields that submit like native ones, and a bundle
that holds only the components an app uses. Made by SyWare, for SyWare's own apps, and free for anyone to use.

The documentation site, https://bioleyl.github.io/jlib/ (or `npm run dev`), explains the library and shows every
component with a live playground, examples and its API.

## Install

```bash
npm install @syware/jlib @jadis/core
```

## Use

As HTML tags: define what the page writes (naming the classes keeps them in the bundle).

```ts
import { define, JlButton, JlInput } from '@syware/jlib';

define(JlButton, JlInput);
```

```html
<jl-input name="email" type="email" placeholder="you@example.com"></jl-input>
<jl-button variant="primary" label="Subscribe"></jl-button>
```

In JSX with Jadis (`"jsxImportSource": "@jadis/core"`), the classes are typed:

```tsx
import { JlButton } from '@syware/jlib';

<JlButton variant="primary" icon="plus" label="New project" />;
```

From code, inputs are change handlers and outputs typed events:

```ts
const button = new JlButton();
button.label.set('Save');
button.events.register('press', () => save());
```

## Components

- **Atoms**: avatar, badge, button, checkbox, chip, divider, icon, input, kbd, link, progress, progress ring, rating,
  select, skeleton, slider, spinner, switch, textarea.
- **Molecules**: accordion, alert, avatar group, breadcrumb, calendar, card, code block, combobox, copy button, date
  picker, empty state, field, file drop, list item, menu, number input, pagination, popover, radio group, search,
  segmented control, stat, steps, tabs, tag input, timeline, toast, tooltip.
- **Organisms**: command palette, confirm, dialog, drawer, navbar, page header, side nav, table, toaster, tree.
- **Templates**: app shell, split view.

## Icons

Components draw their own icons with no setup. The names a page writes (`<jl-icon name="settings">`,
`icon="plus"` on a button) are registered once, so a bundle holds only the icons in use:

```ts
import { Coffee } from 'lucide';
import { COMMON_ICONS, registerIcons } from '@syware/jlib';

registerIcons({ coffee: Coffee }); // one by one, from lucide
registerIcons(COMMON_ICONS); // or the ~90 usual ones (about 5 kB)
```

## Theming

Every colour, radius and size is a CSS custom property (`--jl-*`), defined in the `jlib` cascade layer: a plain rule
of the page overrides it. Light and dark follow the system; `data-theme="light|dark"` on any element decides for that
part of the page.

```css
:root {
  --jl-accent: #6d4ed8;
}
```

## Development

```bash
npm install
npm run dev        # the documentation site, with hot reload
npm run check      # generated files up to date, lint, types, unit tests
npm run test:e2e   # builds the site and checks every page in a headless Chromium
npm run build      # the library (dist/), the size report, the site (site/dist/)
npm run size       # what each component adds to a bundle
```

`src/index.ts` and `src/all.ts` are generated from the component folders: run `npm run generate` after adding a
component. Conventions for contributors are in [CLAUDE.md](CLAUDE.md).

## Releasing

```bash
npm version patch
```

```bash
git push --follow-tags
```

The tag stages the version on npm and creates the GitHub release; a maintainer then approves it with
`npm stage approve`. Every step, pre-releases and what to do when something fails: [RELEASING.md](RELEASING.md).
What changed in each version: [CHANGELOG.md](CHANGELOG.md).

## Made by SyWare

jlib is the component library behind SyWare's apps, and it carries their look. SyWare makes it for its own products
and shares it: use it in yours, change it, ship it. The official SyWare logo is in `site/public/` as SVG:
`syware-logo.svg`, `syware-logo-dark.svg` for dark backgrounds, and `syware-mark.svg` for the mark alone.

## License

MIT, © SyWare: free to use, change and distribute. See [LICENSE](LICENSE).
