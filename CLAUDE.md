# jlib: notes for working on the code

jlib is a component library on Jadis (`@jadis/core` 1.3) and native Web Components, in atomic design, with a static
documentation site that shows and tests every component. Load the project skills before writing code: `jadis`
(the frontend library) and `coding-style` (named constants, guard clauses, exhaustive mappers, types in `types/`).

## Layout

- `src/`: the library. `atoms/` (one element: button, icon, input…), `molecules/` (a few atoms with one job: field,
  search, menu…), `organisms/` (a section with behaviour: dialog, data table, command palette…), `templates/`
  (layouts with slots). Pure helpers in `lib/` (tested in `tests/`), shared types in `types/`, shared CSS in
  `styles/`, the base classes in `base/`.
- `src/index.ts` and `src/all.ts` are **generated** by `npm run generate` from the component folders: never edit
  them by hand; run the script after adding a component.
- `site/`: the documentation site (Vite root `site/`, built with Jadis and jlib itself), on GitHub Pages under
  `/jlib/`. History routes: links use `pageHref('/route')`, files of `site/public` use `assetHref('file')` (never
  relative paths: the page's address has folders), and `services/navigation` takes over clicks on internal links.
  The build writes a copy of `index.html` for every route and a `404.html`. A component's
  page is made from `site/src/docs/components/<tag>.doc.ts` (picked up by `import.meta.glob`, no registry to edit).
- `scripts/shoot.mjs`: screenshots site pages and reports console errors (own Vite server and Chromium per run).

## Writing a component

- File `src/<level>/jl-<name>.tsx`, its CSS beside it in `jl-<name>.css`, class `Jl<Name>` extending `JlElement`
  (`JlFormControl` for what a form submits), `static readonly selector = 'jl-<name>'`, `Jl<Name>.register()` at the
  bottom. Styles: `css\`${BASE_STYLES}${styles}\`` (add `CONTROL_STYLES` for text-field frames, `FLOATING_STYLES`
  for what opens over the page).
- **Inputs are `useChange` fields bound to an attribute** (`{ attribute: 'icon-end' }`), so they work from HTML, from
  JSX and from code. Text, numbers and flags parse by default; enums use `parse: oneOf(VALUES, fallback)`; lists and
  objects use `parse: jsonOf(fallback)` (HTML writes them as JSON: `items='[{"label":"A"}]'`). Mirror state the CSS
  needs on the host with `this.reflect('variant', value)` and style it with `:host([variant="primary"])`.
- **Outputs are `useEvents`** with a detail: `press`, `change` (detail = the new value), `input`, `open`, `close`,
  `select`… They do not bubble. Native events that cross shadow roots (`input`, `click`, `keydown`, `focusin`…) must
  not be re-emitted under the same name without `event.stopPropagation()` on the native one (see `jl-input`).
- Child components are used **by class** in JSX (`<JlIcon name="x" />`) so bundlers keep them. A component imported
  only for its side effect is dropped by tree-shaking (`sideEffects` in package.json): when a template needs a tag
  with children (`<jl-popover>…</jl-popover>`), also write `define(JlPopover)` at module level.
- `onConnect` wires listeners with `this.on`, `events.register`, `onBus`; it can run several times. The first
  `slotchange` can fire before `onConnect`: draw slot-dependent state there too (see `jl-dialog`).
- Methods callable before the element connects use `this.whenRendered(() => …)`.
- Don't name an input or method like an `HTMLElement` member (`title`, `hidden`, `role`, `remove`, `click`,
  `setAttribute`…). `key` is reserved by the JSX runtime.
- `part` in JSX: `attrs={{ part: 'base' }}` (expose the main inner element as `base`).
- Every look comes from `src/styles/tokens.css` (`--jl-*`): no literal colours in components. Flat surfaces with
  lines; shadows only for what floats (menus, dialogs, toasts). Heights: `--jl-control-sm|md|lg`.
- Accessibility is part of the job: roles and `aria-*` on the inner elements, keyboard (arrows in lists, tabs and
  menus; Escape closes what floats; Enter/Space activate), focus rings come from `BASE_STYLES` (`:focus-visible`).
- What floats goes in the top layer: `popover="auto"` (light dismiss) or `"manual"`, class `floating`, placed with
  `followAnchor(anchor, floating, placement, signal)` from `lib/floating.ts` with an `AbortController` per opening.
- Icons are tree-shaken: the registry (`src/lib/icons.ts`) starts empty. A component registers the lucide icons it
  draws itself at module level (`registerIcons({ x: X })`, below its imports); names a page writes (`icon="plus"`)
  are the page's to register, one by one or with `COMMON_ICONS` (`src/lib/icon-set.ts`, registered by `@syware/jlib/all`).
  An unregistered name draws a neutral mark and warns once; the e2e suite fails on that warning.
- Shared enums: `TONES`, `CONTROL_SIZES`.

## Documenting a component

`site/src/docs/components/jl-<name>.doc.ts` exports `doc: ComponentDoc` (see `site/src/types/docs.types.ts` and
`jl-button.doc.ts`): summary, description, playground (starting attributes; a control per prop worth trying), every
prop (name, attribute, type, default as code, description), events, slots, methods, styling, and 3–6 examples. An
example is HTML rendered in the page (helper classes `row`, `stack`, `narrow`, `muted`), plus an optional typed
`setup(root)` and the `script` shown for it.

## Checking a change

`npm run check` (generate --check, lint, types, unit tests), then `npm run test:e2e` (builds the site and opens
every page in Chromium: no console error, no undefined `jl-*` tag, no unregistered icon). Look at the pages:
`node scripts/shoot.mjs /components/<name> --out <dir> [--theme dark] [--width 390] [--full] [--eval "…"]`.

## Gotchas met so far

- Flex and grid items are blockified: an `inline-flex` host reads as `flex` inside a flex container.
- `JlElement.isConnected` is Jadis's own flag, true from the start of `connectedCallback`.
- Biome's `useSortedKeys` reorders object keys: the route table keeps its order with a `biome-ignore` above it.
- The site's Vite root is `site/`: files above it need `server.fs.allow` (fonts, `src/`).
- Document stylesheets don't reach shadow roots: examples render inside the component page's shadow root, which
  holds `EXAMPLE_STYLES`; `data-theme` on an element inside a shadow root needs `TOKEN_STYLES` in that root.
- Reflect an input's attribute only from that input's own callback. At connection the attribute callbacks run in
  field order: an earlier field's render that calls `reflect('selected', false)` erases the attribute before the
  `selected` callback reads it. Give derived host state its own name (`clickable`, `direction`).
- `formDisabledCallback` also fires for the control's own `disabled` attribute, possibly before render: keep the
  form's state apart and draw it with `whenRendered` (see `jl-input`).
- `this.on()` is typed for HTMLElement targets: for `document`, `window` or a `MediaQueryList`, use
  `addEventListener(…, { signal: this.killSignal })`.
- A JSX expression is typed as a plain element: cast it to its class to use its inputs
  (`(<JlSwitch />) as JlSwitch`).
- `useRefs` only holds HTML elements: keep SVG nodes in a private holder object.
- A cached `<img>` can fire `load` before `onConnect`: wire `onLoad`/`onError` in the template.
- A `<slot>` in a grid container makes every slotted node its own grid item: wrap the label and slot in a span.
- Biome's `useNamingConvention` flags `KeyboardEvent.key` names (`ArrowDown`) as object keys: use a `Map`.
- Implicit grid columns grow to their widest content: page grids use `grid-template-columns: minmax(0, 1fr)`, and
  a sideways scroller inside a component gets `contain: inline-size`, or phones scroll sideways.
- Re-showing a popover restarts the CSS animations inside it: use WAAPI for timers and enter animations there.
- Light dismiss closes a `popover="auto"` on pointerdown, before the trigger's click: read the open state on
  pointerdown or the click reopens it.
- `setFormValue(FormData)` uses the entries' own names: write them again when `name` changes.
- `::details-content` is not matched by `*`: give it `box-sizing: inherit` inside details.
- Link to light-DOM elements from a shadow root with element reflection (`ariaControlsElements`): ids cannot cross.
- The shoot script's Vite server reloads when files change: an `--eval` failing with "Execution context was
  destroyed" just needs a rerun.
- The SyWare logo SVGs in `site/public/` are the designer's paths, cropped. Shown small (under 64px), the site uses
  the PNGs that `node scripts/logo-png.mjs` renders from them (`site-logo`): the browser's smoothing filter blends
  about a quarter more edge pixels than the vector drawn at size, which on a standard screen shows steps.
- The package is `@syware/jlib` on npm (the bare name `jlib` belongs to someone else): docs and the site import it by
  that name (an alias to `src/` in development). `npm publish` runs the checks (`prepublishOnly`) and builds the
  library (`prepack`); a pushed version tag publishes from GitHub (`.github/workflows/publish.yml`) and creates the
  GitHub release.
