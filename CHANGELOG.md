# Changelog

What changed in each version of [@syware/jlib](https://www.npmjs.com/package/@syware/jlib). Every component is shown
and documented on [the documentation site](https://bioleyl.github.io/jlib/).

## 0.9.0 (2026-10-30)

jlib's texts in English, French and German: an app chooses its language in one line, or has jlib follow its Jadis
translator, every component drawing its texts again when the language changes.

### Added

- **Texts in French and German**: jlib translates what its components say on their own, and shows English until the
  app chooses: `jlTexts.setLocale('fr')`, a region taking its language (`fr-CH` shows French). Each language is a
  module of its own, loaded when it is chosen. `JL_LANGUAGES` lists them.
- **Texts that follow the app**: `jlTexts.follow(translator)` shows jlib's texts in the language of a Jadis
  `Translator`, now and at each of its changes. It loads them for each of the app's languages first, so they change
  with the app's own texts; every component draws its texts again, without a reload.
- **Texts a page adds or fixes**: `jlTexts.add('es', …)` adds a language jlib does not translate, all its texts (as
  they are, or their loader) or one of jlib's languages shown for it (`jlTexts.add('it', 'en')`);
  `jlTexts.fix('de-CH', { close: 'Schliessen' })` changes some texts of one language, its regions included. Both are
  checked against `DEFAULT_TEXTS`: every key, and each text's placeholders, none missing and none added. A language
  jlib has no texts for is refused, by `setLocale`, and at start by `follow` for each of the app's languages.

### Changed

- **Requires Jadis 1.5.1** (`@jadis/core` `^1.5.1`, a peer dependency): jlib's texts are a translation of Jadis 1.5, and
  each component draws them with its `useTranslation`. Update Jadis along with jlib.
- **Texts**: `setTexts()` is gone, and the `JlTexts` type with it. A page in one language calls
  `jlTexts.setLocale()`; one that kept a map of all the texts in its language drops it for jlib's own, and keeps the
  texts it wants otherwise with `jlTexts.fix()`. `jlText()` takes the parameters of each text, required by name, and
  writes a number among them the way the language writes it.
- **Text inputs**: the inputs whose default was one of jlib's texts (`label`, `empty-text`, `count-text`,
  `retry-label`, `confirm-label`…) default to `''`, which shows jlib's text in the language shown, so it changes with
  the language. Reading one gives `''` until the page sets it. `jl-auth-layout`'s `origin` is `null` until set, its
  text then jlib's; `''` still shows nothing.

### Fixed

- **Texts**: what components still said in English whatever the page's language now comes from jlib's texts: the
  heading of `guardLeave()`'s question (`leaveHeading`, "Leave without saving?"), the buttons of `jl-confirm` and
  `confirmDialog()` (`confirm` and `cancel`), the heading of a failed `jl-load-state` (`loadStateHeading`) and the
  foot of `jl-auth-layout` (`authOrigin`); and what screen readers heard: a rating's value (`noRating`, `ratingOf`),
  a trail's folded crumbs (`showMoreCount`), a table's check boxes (`selectAllRows`, `selectNamed`), a side nav's
  expanders (`showPagesOf`), a flow's nodes (`node`) and its empty canvas (`flowEmpty`), a date picker's range
  errors (`chooseDateFrom`, `chooseDateUntil`), a pagination's pages and its compact status (`page`, `pageNumber`,
  `pageOfTotal`), a tag input's announcements and remove buttons (`addedNamed`, `removedNamed`, `removeNamed`).
- **Forms pattern**: `guardLeave()` is a Jadis page's `canLeave` as it is: the router waits for its answer from
  `@jadis/core` 1.5.1, which takes a `canLeave` that answers with a promise and keeps the history as it was when
  the page refuses.

### Worth a look when you update

- **This version breaks the pages that set jlib's texts**, as a minor may before 1.0: `setTexts()` and the
  `JlTexts` type are gone. A page in one language replaces `setTexts(texts)` with `jlTexts.setLocale('fr')` (a region
  works too: `fr-CH`), awaited before it draws, so nothing shows in English first; its own map of jlib's texts goes,
  and the few texts it wanted otherwise move to `jlTexts.fix()`. A page in a language jlib does not translate adds it
  with `jlTexts.add()`.
- Update Jadis with jlib: `npm install @jadis/core@^1.5.1 @syware/jlib@^0.9.0`. npm refuses an older Jadis now that
  the peer dependency asks for 1.5.1.
- `jlText()` takes each text's parameters by name: a call that left one out, or misspelt it, stops compiling.
- An input that defaulted to one of jlib's texts (`label`, `empty-text`, `count-text`, `retry-label`, `confirm-label`…)
  reads `''` until the page sets it: code that read that default to show it elsewhere asks `jlText()` instead.
- A Jadis page that guards a form sets `canLeave = guardLeave({ … })` as it is: the router waits for the answer.
  Code that refused at once and navigated again itself after the answer can go.

## 0.8.0 (2026-10-30)

Rows of a table that open on their details, and the components that hold a page's values or records typed by them:
the editor completes what they take and refuses a misspelt value.

### Added

- **Table**: rows that open on their details. `expandable="single"` keeps one row open (opening another closes it),
  `"multiple"` lets any number stay open. A press on the row or on its chevron opens it, the row staying as it is,
  and `detail` draws what comes under it, from the row, when it opens. `expanded` holds the keys of the open rows,
  `toggle` says each opening and closing, and `toggle(key, open)` does it from code. The detail lines up with the
  first column and stays in the frame when the table scrolls sideways.
- **Table**: typed by its rows. `JlTable<Order>` takes rows of the page's own type, an interface included; its
  columns (`TableColumn<Order>`), `row-key` and `sort-key` name fields of an order, which the editor completes and
  checks; its renderers, `detail` and `sort` read an order, without `cellOf`. In JSX, `<JlTable rows={orders} />`
  reads the type from the rows. A column that is not a field, such as one of actions, is named:
  `JlTable<Order, 'actions'>`.
- **Select**, **segmented control**, **radio group** and **chip group**: typed by their values.
  `JlSegmented<'list' | 'grid'>` takes options of those values only, and gives `change` and `value` as one of them
  (lists of them for the chip group). In JSX, the type can also be read from the options.
- **Menu**, **command palette**, **tab bar** and **side nav**: typed by their values or ids.
  `JlMenu<'rename' | 'delete'>` gives `select` one of them, for a `Record` of one handler per action, which
  TypeScript refuses while one is missing. A palette's records can take ids of their own form (`` `open:${string}` ``).
- The documentation shows each of these components typed, in code and in JSX, on its page (**Typing**).

### Changed

- jlib is developed on Jadis 1.4.2, whose `useChange` takes a parser for a field typed by the component's type
  parameter. The peer dependency stays `^1.4.0`: pages need not update Jadis.

### Worth a look when you update

- Nothing breaks: without a type argument, every component takes and gives text as before, and a table any field.
  `TableColumn`, `TableSort`, `TableCellRenderer`, `SelectOption` and the like take the type as an optional
  parameter, so code that names them keeps compiling.
- jlib's declarations use `NoInfer`: an app type-checks them with TypeScript 5.4 or later.
- A table of an interface's rows can drop the spread (`{ ...row }`) and `cellOf`: type the table
  (`querySelector<JlTable<Order>>`, `ref<JlTable<Order>>`, `<JlTable<Order> …/>`) and its renderers read an order.
  A typed table refuses a column `key` that is not a field: name such columns in its second type argument.
- Menus, selects and palettes handled with a `switch` on the value, or comparisons of strings, can become a
  `Record<Action, () => void>` that the compiler keeps complete.

## 0.7.0 (2026-10-27)

What the docuteam engines' pages need to move to jlib, starting with the storage engine's.

### Added

- **Facts** (`jl-facts`): the facts about one thing, label and value, such as an archived object's kind, size and
  digest. A fact without a value is left out, and an element with none takes no room. Values can be code (monospace,
  broken anywhere) or links; `orientation="vertical"` puts each label over its value, the facts side by side.
- **Tree**: a `loader` loads it a level at a time and a page at a time, for trees too large to give at once: the
  roots first, a `lazy` folder's children when it opens, the next page from the **Show 75 more** row that ends a
  level, and again from the row of a level that failed. `reveal(path)` opens the folders down to an item, loading
  what it needs on the way, and selects it; `reload()` starts again. Items take an `href` (the row is a link, which a
  middle click opens in a new tab) and a `hint` (a tooltip). Every text the tree shows can be set: `empty-text`,
  `loading-text`, `more-text`, `error-text`, `retry-label`.
- **Code block**: `max-height`, past which the code scrolls under its header, the copy button staying in view.
- **Side nav**: `collapsible` adds a button at its bottom that folds it into its rail and unfolds it (`collapse`
  says so, for the app to remember it); its texts are `collapse-label` and `expand-label`. The rail is now said by
  the `rail` attribute on the host, whose styles read it.
- **App shell**: in its drawer, on a narrow screen, a side nav shows whole even when it is folded on a wide one.
- **App shell**: `narrow-header` keeps the top bar to narrow screens, where it holds the menu button and the app's
  name, as the navigation pattern lays it out; wide, the side nav's header names the app.
- **Button**: `download`, with an `href`: saves what it points to as a file of that name instead of opening it.
- **Texts**: what the components say on their own (close and clear buttons, "Show more", a file drop's refusals,
  the labels screen readers hear, the defaults of their text inputs) comes from one registry: `setTexts({...})`
  gives them in the page's language, once, before it draws; `DEFAULT_TEXTS` lists them in English. `download()`'s
  texts follow it (`downloadTexts()`).
- **App icon**: `setFavicon(icon)` makes the app's icon the page's favicon, the tile `jl-app-icon` draws, in the
  theme's `--jl-brand` (a page's own theme shows in the browser's tab too).
- **Input list** (`jl-input-list`): a field that takes several values, each in a row of its own, typed (any input
  type, or a text area) or picked from options; rows are added and removed, up to `max`. Its texts can be set.
- **Load more** (`jl-load-more`): the end of a long list read a page at a time, "30 of 120" and a **Show more**
  button (`more`), its spinner while the next page comes; it takes no room once the whole list shows.
- **Toast**: `working` and `progress` show the progress of the work it tells about, and `toast()`'s handle can
  `update()` it while it shows (its text, tone, progress, action…).
- `download(url, { title })`: a file fetched with its progress in a toast (the time the server takes to prepare it,
  the bytes received, a bar when the size is known), saved under the server's name; **Cancel** stops it, and its
  texts can be set.
- **Facts**: a fact with a `key` is drawn by the renderer of that key (`renderers`): a badge, links, a list.
- **Table**: a column's `description` names a field shown as a quieter line under the value; the `datetime`
  format shows a date with its time; `cellOf<Row>()` writes a renderer for the page's own type of row; a column's
  `wrap` breaks long text over lines instead of widening the table; `marked` rows (a search's matches) carry a bar
  and a shade.
- **Tree**: an item's `badge`, a count or a short word after its label.
- **Side nav**: an item's `target`, `_blank` opening its link in a new tab.
- **Steps**: a step can be `failed` (a payment refused, a transaction rolled back): an × in the danger colour, and
  screen readers hear that it failed.
- **File drop**: `add(files)` takes files as a drop would, for files dropped elsewhere on the page.
- **Command palette**: it can search the app's data. `search` says what was typed once typing pauses (`debounce`),
  and an empty text when it opens; the page answers with commands marked `result`, listed as it gave them after the
  commands the text matches (records whose title holds it, "Open" for an ID pasted whole), with `loading` on while
  it looks.
- **Command palette**: a command's `description` says what it is, quieter, beside its label (a record's type, a
  person's username), to tell apart two of one name.

### Fixed

- Every component can be created in jsdom, where pages run their unit tests: the app shell, the split view, tabs and
  the segmented control no longer fail for want of `ResizeObserver` (jsdom has no layout: they watch nothing), and
  the form controls (input, select, checkbox, file drop…) no longer fail for want of the form methods of the
  element's internals (they keep no form value there, and find every value valid).

### Changed

- **Requires Jadis 1.4** (`@jadis/core` `^1.4.0`, a peer dependency): the components find their children with
  `useRefs`' `ref(Class)`, new in 1.4. Update Jadis along with jlib; nothing else changes for pages.
- **Select**: with a mouse, in Chrome and Edge, its open list looks like the combobox's: a panel with a shadow,
  rounded rows that light up under the pointer and the arrows, a check at the end of the chosen one, and quiet group
  headings. It stays the browser's own select (keyboard, type-ahead, form); touch screens keep the platform's sheet,
  and other browsers their own list. The chevron turns while the list is open.

### Worth a look when you update

- Update Jadis to 1.4 along with jlib. 1.4.1 is recommended: with it, a component written by its class takes
  children in JSX (`<JlDialog>…</JlDialog>`), its inputs type-checked.
- An app in another language calls `setTexts` once at start, before its first component is created: the components
  read their default texts when they are made. Attributes written on every element only to translate a default can
  go.
- An app that folds the side nav with a button of its own can use `collapsible`, and keep the choice from `collapse`.
- Styles that read `jl-side-nav[collapsed]` to style around the rail should read `jl-side-nav[rail]`: in the app
  shell's drawer, a folded side nav shows whole.
- An app shell whose top bar repeats the side nav's header on wide screens can take `narrow-header`.
- A toast that a page dismissed and showed again to report progress can `update()` instead.
- Unit tests that stubbed `ResizeObserver` or `ElementInternals` for jlib can drop the stubs.

No property, event or method was removed or renamed.

## 0.6.0 (2026-10-26)

What swai and swstock still worked around, now jlib's, and one icon per app.

### Added

- **App icon** (`jl-app-icon`): an app's own icon, its glyph in white on a rounded tile of the brand's blue: one
  family for every SyWare app, each telling itself apart where a word does not fit (a folded side nav, a phone's top
  bar, a browser tab). The Logo page says how the apps use it, and keeps the SyWare logo for the company.
- **Auth layout** (`jl-auth-layout`): the sign-in screen every SyWare app shares. The app's brand, a headline whose
  `*words*` take the brand's blue, a sentence, three points and "Made in Switzerland by SyWare" on a dark panel,
  with the SyWare mark large and faint; the form beside it. On a phone, a band with the brand above the form.
- **Split view**: `stack-below` and `pane`. Narrower than `stack-below` pixels, it shows one pane at a time, the
  one `pane` names: a list and the item opened from it become two pages on a phone. The attribute `stacked`, the
  event `stack` and `isStacked()` say when.
- **App shell**: a shell that fills the window writes the height of its tab bar, while it shows, as
  `--jl-shell-bottom` on the document. Toasts keep above it by themselves; a page's floating bars can too.
- **Toaster**: `--edge-bottom`, the distance from the bottom for the bottom placements.
- **Account button**: `current`, while the person's account page is the one shown.
- Token `--jl-on-brand`: what is drawn on the brand's blue, white in both themes.

### Fixed

- **Page**: what a page held with `position: fixed` (a bar along the bottom, a floating button) was fixed to the
  page instead of the window: its padding followed the page's width with a container query, and a size container
  holds what is fixed inside it. The padding now follows the screen's width.
- **Toaster**: on a phone, bottom toasts no longer hide behind an app shell's tab bar.
- **Load state**: a load overtaken by a later one (a search typed on, a poll during a reload) drew its data over
  the later one's, or left the error showing; it now draws nothing, and the latest load decides.
- **Tooltip**: a scroll that started on a word or an icon opened its bubble; a tap does now, a scroll does not. A
  long press on a trigger whose tooltip has no text was swallowed; it stays a press. A pending long press could
  throw once the tooltip left the page.
- **Tooltip**, **menu**: over a button with an `href`, they named and described its hidden inner button instead of
  the link people see, so the link's own title still showed and its long-press menu was blocked.
- **Badge**: a state given with `showStatus()` went back to the attributes' when the badge moved in the page.
- `guardLeave()`: asked twice at once (Back pressed twice), it opened two dialogs; it asks once. Its function no
  longer asks once `signal` ended the guard.
- `formatRelativeTime()` counts days by the calendar ("22 hours ago" for this morning seen tonight, not
  "yesterday"), and gives "" for a date that is not one instead of throwing. `formatDuration()` chooses the unit
  once rounded ("1 min", never "60 secs") and gives "" for what is not a number.
- **Command palette**: on touch screens, its field's text is 16 pixels like every field's, so phones do not zoom in.

### Worth a look when you update

- Pages whose floating bars sat inside a `jl-page` with a workaround can put them back.
- An app shell with a tab bar now lifts bottom toasts on phones; remove any rule of your own that did it.

No property, event or method was removed or renamed.

## 0.5.1 (2026-10-26)

### Fixed

- **Tooltip**: over a button with a `hint`, the browser's own tooltip showed a moment after the bubble, one over the
  other. While the pointer or the focus is on its trigger, the tooltip now sets the trigger's `title` aside, and
  gives it back when the pointer leaves.
- **Tooltip** on touch screens, which have no hover: it never showed. Pressing and holding the trigger now shows
  the bubble (the press does not act), which stays 1.5 seconds after the finger lifts; a trigger that does nothing
  on a tap, such as a word, shows or hides it on a tap. A tap elsewhere puts it away.

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
