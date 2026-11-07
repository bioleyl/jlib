# Theming, tokens and icons

Every colour, radius, space and size of jlib is a `--jl-*` CSS custom property. Custom properties cross shadow
roots, so one rule of the page restyles every component, and a view's own CSS reads the same tokens.

## Contents

- The tokens
- Overriding a token
- Your own accent
- Light and dark
- One component, and parts
- Your own components
- Icons
- Fonts

## The tokens

jlib looks like SyWare by default: ink and white, flat surfaces separated by lines, one blue for what is live,
selected or waiting for a person. A view's CSS uses these and never writes a colour:

| Group | Tokens | For |
|---|---|---|
| Text | `--jl-text`, `--jl-text-2`, `--jl-muted`, `--jl-faint` | Body text; secondary text; quiet text (6:1 on white); icons and decorations only, never text |
| Surfaces | `--jl-bg`, `--jl-surface`, `--jl-surface-2`, `--jl-surface-3`, `--jl-code-bg` | The page; cards and panels; a quiet band, a hovered row; a pressed or selected fill |
| Lines | `--jl-line`, `--jl-line-soft`, `--jl-line-strong` | Borders and dividers |
| Accent | `--jl-brand`, `--jl-accent`, `--jl-accent-strong`, `--jl-accent-soft`, `--jl-accent-line`, `--jl-on-accent`, `--jl-on-brand` | The logo's blue for shapes (marks, focus); the accent for what carries text (links, primary buttons, the selection); text on them |
| Status | `--jl-ok`, `--jl-warn`, `--jl-danger`, `--jl-info`, each with `-soft`; `--jl-on-danger` | A status's text or icon, and its tinted background |
| Shape | `--jl-radius-xs` (6px), `-sm` (8px), `--jl-radius` (10px), `-lg` (12px), `-xl` (20px), `-pill` | Corners |
| Space | `--jl-space-1` (4px), `-2`, `-3`, `-4` (16px), `-5`, `-6` (24px), `-8`, `-10`, `-12`, `-16` (64px) | Gaps and padding, on a 4px grid |
| Type | `--jl-font-sans`, `--jl-font-mono`; `--jl-font-xs` (12px), `-sm` (13px), `-md` (14px), `-lg` (16px), `-xl` (20px), `-2xl` (28px) | Families and sizes |
| Controls | `--jl-control-sm` (30px), `-md` (36px), `-lg` (44px), `--jl-control-font` | Heights of buttons and fields |
| Page widths | `--jl-page-form` (720px), `--jl-page-standard` (1120px), `--jl-page-wide` (1400px) | The widths of `jl-page` |
| Depth | `--jl-shadow-sm`, `--jl-shadow`, `--jl-shadow-lg`, `--jl-scrim`, `--jl-focus-ring` | Only what floats (menus, dialogs, toasts) casts a shadow |
| Motion | `--jl-ease`, `--jl-fast` (120ms), `--jl-slow` (240ms) | Transitions |

```css
.summary {
  display: grid;
  gap: var(--jl-space-2);
  padding: var(--jl-space-4);
  border: 1px solid var(--jl-line);
  border-radius: var(--jl-radius);
  background: var(--jl-surface-2);
  color: var(--jl-text-2);
  font-size: var(--jl-font-sm);
}

.summary .late {
  color: var(--jl-warn);
}
```

## Overriding a token

The tokens are in the `jlib` cascade layer, which jlib gives the document when its first component registers. A plain
rule of the app, outside any layer, wins whatever the order of the stylesheets:

```css
/* src/styles/theme.css: the app's palette, in one place */
:root {
  --jl-radius-sm: 4px;
  --jl-font-sans: 'Inter', system-ui, sans-serif;
}
```

The same tokens exist as a stylesheet, for a page that needs them before any script runs (a page rendered on a
server): `import '@syware/jlib/tokens.css';` or `@import '@syware/jlib/tokens.css';`.

## Your own accent

The accent's shades are mixed from the text and surface colours, so one rule works in light and dark:

```css
:root {
  --jl-accent: #6d4ed8;
  --jl-accent-line: color-mix(in srgb, var(--jl-accent) 40%, var(--jl-surface));
  --jl-accent-soft: color-mix(in srgb, var(--jl-accent) 12%, var(--jl-surface));
  --jl-accent-strong: color-mix(in srgb, var(--jl-accent) 80%, var(--jl-text));
  --jl-brand: #6d4ed8;
  --jl-info: var(--jl-accent);
  --jl-info-soft: var(--jl-accent-soft);
}
```

Check that text on the accent stays readable (4.5:1); the [Theming](https://bioleyl.github.io/jlib/theming) page
picks one live and writes the rule.

## Light and dark

The tokens follow the system's preference. `data-theme="light"` or `data-theme="dark"` forces one, on the root
element for the whole page, or on any element for that part of it:

```html
<html data-theme="dark">
  …
  <aside data-theme="light">A light panel in a dark page</aside>
</html>
```

A theme switch the person chooses writes `document.documentElement.dataset.theme` and remembers it on the device
(`localStorage`); removing the attribute goes back to the system's.

The document's rules do not reach inside shadow roots: a `data-theme` on an element inside a view's shadow root
needs the tokens in that root too, `css\`${TOKEN_STYLES}${styles}\`` in the view's `templateCss()`.

## One component, and parts

Tokens set on an element apply to it and to what it holds. Components expose their main inner element as the `base`
part, and some expose more (each reference lists them under Styling):

```css
.checkout jl-button {
  --jl-accent: #17784a;
}

jl-button.pill::part(base) {
  border-radius: var(--jl-radius-pill);
}

jl-app-shell::part(main) {
  background: var(--jl-surface-2);
}
```

Some components read custom properties of their own (`--width` of a drawer, `--line-top` of the page outlet): the
reference lists them too.

## Your own components

A component the app writes on `JlElement` starts its styles with jlib's: `css\`${BASE_STYLES}${styles}\``, and
`CONTROL_STYLES` for a text field's frame, `FLOATING_STYLES` for what opens over the page. It then has the focus
ring, `hidden` and `.sr-only` the library's components have. See [views.md](views.md#your-own-components-on-jlelement).

## Icons

Icons are lucide's, drawn by name. jlib's registry starts empty, so a bundle holds only the icons it uses:

- A component registers the icons it draws itself (a chevron, a close button): nothing to do.
- The names the app writes (`icon="plus"`, `<JlIcon name="settings" />`, an item's `icon` in a side nav) are the
  app's to register, by the module that writes them, below its imports:

```ts
import { registerIcons } from '@syware/jlib';
import { Package, Plus, RefreshCw } from 'lucide';

registerIcons({ package: Package, plus: Plus, 'refresh-cw': RefreshCw });
```

- `registerIcons(COMMON_ICONS)` registers the ~90 usual ones at once (about 5 kB), once, in `main.tsx`: the simplest
  for an app that names many. `iconNames()` lists what is registered, `hasIcon(name)` tells.
- The name is lucide's in kebab case (`RefreshCw` is `refresh-cw`); the list is at <https://lucide.dev/icons>.
- An unregistered name draws a neutral mark and warns once in the console: register it, never ignore the warning.
- The app's own icon is a `jl-app-icon` (its glyph on the brand's tile), and `setFavicon('package')` makes the same
  tile the tab's icon, with a registered name.

## Fonts

The components use Manrope and JetBrains Mono when the page has them, the system's fonts otherwise. For SyWare's
look:

```bash
npm install @fontsource-variable/manrope @fontsource-variable/jetbrains-mono
```

```ts
import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
```
