# Changelog

What changed in each version of [@syware/jlib](https://www.npmjs.com/package/@syware/jlib). Every component is shown
and documented on [the documentation site](https://bioleyl.github.io/jlib/).

## 0.5.0 (2026-10-26)

What swai and swstock each wrote for themselves, made one for every app, and the UX patterns that say how SyWare
apps behave.

### Added

- **Page** (`jl-page`): a page of an app. Its header holds a back link named after the page it leads to (`back`,
  `back-label`), the heading, a sentence or the facts that identify its subject, the status (slot `meta`) and the
  actions; the content is centred at one of four widths (`width`: `form`, `standard`, `wide`, `full`). With
  `app-name` it names the browser tab after its heading: "Order #3 · swstock".
- **Search button** (`jl-search-button`): what opens the command palette, a search field to press with the palette's
  keys (Ctrl K, ⌘K); `compact` for a folded side nav or a phone's top bar. Touch screens show no keys.
- **Account button** (`jl-account-button`): the person signed in, avatar, name and role, at the foot of the side nav
  or (`compact`) in a phone's top bar; a link to their account with `href`, a button otherwise.
- **Load state** (`jl-load-state`): what a list shows while its data comes (nothing for 300 ms, then a skeleton of
  rows, cards or lines), when there is none (slot `empty`), and when it failed (what failed, and Try again).
  `load({ fetch, draw, isEmpty })` moves between the states; a later load keeps the content while it refreshes.
- **Badge**: `hint`, what the state means as a tooltip, and `showStatus(look)`, which shows a state from an app's
  map of them. The type `StatusLook` (`label`, `tone`, `icon`, `hint`) is for those maps.
- `guardLeave({ isDirty, signal })`: closing the tab with changes not saved asks the browser's question, and the
  function it returns asks "Leave without saving?" in the page, for the router to call before it moves on.
- `formatDuration(milliseconds, locale)` and `formatRelativeTime(date, now, locale)`: "< 1 sec", "3 mins",
  "2 hrs 10 mins"; "now", "5 minutes ago", "yesterday", then "12 Mar", in the reader's language.
- Tokens: `--jl-page-form`, `--jl-page-standard` and `--jl-page-wide` (720, 1120 and 1400 pixels), the widest a
  page gets; `--jl-control-font`, the text people type in fields.
- Documentation: **UX patterns**, beside the design system: navigation, page layout, lists and tables, actions,
  forms, loading and errors, feedback, confirm and undo, dialogs and panels, status, search and shortcuts, phones,
  accounts, and a checklist, each with live do's and don'ts.

### Changed

- On touch screens (`pointer: coarse`), controls are 36, 44 and 48 pixels high instead of 30, 36 and 44, and the
  text of fields is 16 pixels, so a finger hits them and phones do not zoom in when a field takes the focus.
- **Toaster**: a toast with an action, or an error, stays 8 seconds instead of 5 when its options give no
  `duration`.

### Worth a look when you update

- Pages on phones and tablets: controls are taller there, and fields' text larger. Check rows of controls in narrow
  places.
- Error toasts and toasts with an action stay longer, unless they set their `duration`.

No property, event or method was removed or renamed.

## 0.4.0 (2026-10-26)

### Added

- **Tab bar** (`jl-tab-bar`): the bar along the bottom of a phone, with the three to five main places of an app, an
  icon over a label, a count over the icon, and the current place in the accent on a pill. Items with an `href` are
  links, the others buttons; both fire `select`. `more` adds a last button that fires `more`.
- **App shell**: slot `tabs`, a bar along the bottom (a `jl-tab-bar`) shown only when narrow, under the drawer; a tab
  bar's `more` opens the drawer.
- **Chip group** (`jl-chip-group`): a row of chips to choose from, one as radios or several (`multiple`), with icons
  and counts, the arrow keys, a row that scrolls sideways when narrow (or `wrap`), three sizes and form support
  (`name`, `required`). `value` and `change` are lists.
- **Button**: `href` (and `target`) make it a real link with the same look: a middle click opens a new tab, the address
  shows on hover, and `press` still fires. A disabled link loses its address.
- **Alert**: `description`, the message as plain text for pages that set it from code; the default slot keeps the
  links and markup. Empty parts no longer leave a blank line.
- **Input**: `inputmode`, the keyboard a phone shows for the field (`numeric` for a barcode, `decimal` for a price),
  as a native input's.

### Fixed

- **Chip** and **tag input**: the accents on capitals (É, Â, Ö, Î) were cut off at the top of the label.
- **App shell**: on a narrow screen, what the page lifted with `z-index` (a sticky bar, a floating button) showed
  above the open drawer and its scrim. The main area is now its own stacking context.
- Components can be created in jsdom, which runs many apps' unit tests: the design tokens go in a style element
  where the document takes no constructed stylesheet, instead of failing with "adoptedStyleSheets is not iterable".

## 0.3.0 (2026-10-26)

What SyWare's swai needed to drop its own components for jlib's.

### `jl-flow`: runs, problems, details and drops

- A node can show how a run went: `status` (`running`, `done`, `waiting`, `failed`) as a round mark and a ring or
  border, and `taken`, the exit it left by. That exit, and its edges to nodes that ran, stand out.
- `problem` marks a node with something to fix, with the text as its explanation (also for screen readers).
- `detail` adds a third line under a dashed rule: what the node is set to do. Such a node is 96 pixels tall instead
  of 64; rows of the layout are as tall as their tallest node.
- `color` gives a node's icon a colour of the page's own (`var(--my-ai)`), for kinds the tones do not cover.
- `drop-type` names a drag-and-drop type the canvas takes: something dragged from the page and dropped on it emits
  `drop`, with what it carried and where the node goes.
- New methods: `reveal(id)` brings a node into view, `centerPosition()` says where a node added without a place goes,
  and `positionAfter(from, port)` where + would put a node after an exit.
- New parts: `detail`, `status`, `problem`, and `taken` on edges.

### Added

- **Switch**: `hide-label` keeps the label for screen readers only, for a switch whose meaning the page shows beside
  it.
- **Input** and **search**: an `enter` event when Enter is pressed in the field. The search's `clear()` is public.
- **Accordion item**: `description`, a quieter line under the heading, and an `icon` slot for a richer icon.
- **Stat**: `tone` colours its icon.
- **Segmented control**: an option's `badge`, a count or a short word after its label.
- `BASE_STYLES`, `CONTROL_STYLES` and `FLOATING_STYLES` are exported, for the components an app writes itself (see
  Theming).

### Changed

- **Select**: a `value` that no option has (a choice since removed, options still loading) shows as an option of its
  own, first, and the form keeps it. It used to show the placeholder or the first option, and the form sent that.

### Worth a look when you update

- Selects whose value is not among their options now show that value instead of the placeholder.
- Flows with `detail` on some nodes lay out with taller rows.

No property, event or method was removed or renamed.

## 0.2.0 (2026-10-26)

### New: a flow editor, `jl-flow`

Nodes joined by edges, to edit: the steps of a workflow, the stages of a pipeline. Made generic from SyWare's
workflow editor.

- The graph is plain data: nodes (a label, a position, and optionally an icon, a tone, a description and exits) and
  edges. Every edit emits the whole new graph in `change`, ready to save.
- People drag nodes, draw an edge from an exit to a node, select and remove edges and nodes, and move and zoom the
  view. With the keyboard, the arrows move a node and Delete removes it.
- `+` on a free exit, or an edge dropped on empty space, emits `add` with where the node should go: the page adds the
  node it wants.
- The wand button (or `layout()`) lays the nodes out again, in rows from the starts down; a loop does not push rows
  down.
- Nodes, exits and edges can be restyled with `::part()`, and `readonly` is for people who only look.
- About 8.8 kB gzipped, and tree-shaken: a page that does not use it does not pay for it.

### Changed, after a UX review

- **Date picker**: the field shows the date in digits, in the locale's order (`25.10.2026`, `10/25/2026`), and takes
  it typed that way, with any separators or none (`25102026`), or year first. Phones show their number keys, and
  letters are refused. Without a placeholder, the field shows the pattern (`dd.mm.yyyy`). `value` and the form still
  hold the ISO date.
- **Toast**: tinted by its tone, as `jl-alert` is, with its tone's icon filled: success, information, warning and
  error read at a glance.
- **Alert**: its tone's icon is filled too.
- **Steps**: the current step's label is in the accent colour, and on a phone it keeps clear of the next step.
- **Timeline**: the time stands beside the marker, in a column, next to its event.
- **Timeline and vertical steps**: the line runs through the centre of the markers.

### Added

- `jl-icon` `filled`: a sign in a circle or a triangle (`circle-check`, `triangle-alert`…) drawn as a solid badge;
  `--cutout` colours the sign.
- `TONE_ICON_FILLED`: which tones' icons read well filled.

### Worth a look when you update

- Date pickers show dates in digits instead of with the month name ("Oct 25, 2026"), and show the date pattern when
  they have no placeholder.
- Toasts with a tone are tinted, and their tone icons are filled; so are alerts' icons.

No property, event or method was removed or renamed.

## 0.1.3 (2026-10-26)

- Published from GitHub: npm stages each version, with a provenance statement linking it to the run that built it,
  and a maintainer approves it.

## 0.1.0 (2026-10-26)

- The first version: 61 components in atomic design (atoms, molecules, organisms, templates), each one tree-shaken,
  with the design tokens, and the documentation site.
