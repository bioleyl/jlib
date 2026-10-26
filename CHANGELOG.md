# Changelog

What changed in each version of [@syware/jlib](https://www.npmjs.com/package/@syware/jlib). Every component is shown
and documented on [the documentation site](https://bioleyl.github.io/jlib/).

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
