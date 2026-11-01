---
name: syware-ux
description: How SyWare apps behave, from jlib's UX patterns — the principles, the frame (app shell, side nav, account menu, search), page layout, lists and work surfaces, forms, collections, states, feedback, confirmations, and the checklist a finished page is reviewed against. Load when building, changing or reviewing the views of a SyWare app, or of an app that follows SyWare's UX, together with the jlib skill.
---

# SyWare's UX

Every SyWare app behaves the same way, as jlib's [UX patterns](https://bioleyl.github.io/jlib/patterns) describe:
what people learn in one app works in the next. This skill applies them with jlib's components; the `jlib` skill
says how those components are used.

## Where the patterns are

- [references/patterns.md](references/patterns.md) holds the principles, and every pattern page in reading order
  with what it covers.
- A page in full, with its rules, its do and don't and its examples, is a file of jlib's repository. Read it at the
  installed jlib's version (`version` in `node_modules/@syware/jlib/package.json`):
  `https://raw.githubusercontent.com/bioleyl/jlib/v<version>/site/src/docs/patterns/<slug>.ts`. The documentation
  site draws its pages by script: fetching one of them gives an empty page.
- Read the page of what you build before building it: `collections` for a list, `forms` for a form, `states` for
  what loads or fails.

## As the views apply them

- **Frame**: `JlAppShell` with `narrowHeader` and a `JlSideNav` (its header: the app's icon and name, and the
  search button) and, on phones, a top bar and a `JlTabBar`. The side nav is `collapsible`: people fold it into its
  rail, the page remembers it on the device (`collapse` event, stored in `localStorage`) and, styled on the side
  nav's `rail` attribute, its header keeps only the icon and a `compact` search button; a phone's drawer shows it
  whole. Navigation items are links (`href: '#/sync'`). `document.title` is the view, then the app, and the app's
  icon is the tab's favicon (`setFavicon(APP_ICON)` when the app connects).
- **The person**: a `jl-account-button` at the foot of the side nav (its `footer` slot; `compact` in the phone's top
  bar, and while the nav is folded), name and role, trigger of a `jl-menu`: **Language** (each language in its own
  words, the one in use checked) and **Log out**. A work surface that needs the width folds the side nav while it is
  open, and gives it back as people left it.
- **Page**: each view is a `jl-page`: heading (the collection's or the thing's name), description (what it is for,
  or the thing's id), at most one primary action in `slot="actions"`, a status badge in `slot="meta"`. Parts that
  stand alone are `jl-card`s; the rest is divided by `h2`s. A thing's own actions (rename, delete, take offline) are
  buttons in its page's `actions` slot, the rarer ones in a `jl-menu` behind an ellipsis button; where it sits is a
  `jl-breadcrumb`.
- **Lists and work surfaces**: tables are `jl-table` with `empty-text`; a tree beside the opened item is a
  `jl-split-view` with `stack-below` (two pages on a phone, `pane` switching, a back link only while stacked: the
  `stack` event). The split view draws only its `start` and `end` panes: a dialog goes beside it, not in it.
  What opens something is a link, so a middle click opens a tab. A large tree loads a level and a page at a time
  (`loader`, `lazy` items, a `badge` with each folder's count); a search in it lists its matches as
  `jl-list-item`s in place of the tree. A short list beside its item is a `jl-tree` of links, its rows with an
  icon, groups as folders, under a small `jl-search`, names only: no counts beside the search or on the rows; with
  nothing open, the end pane is the collection's page and its `jl-empty`.
- **Forms**: each control in a `jl-field` (label, hint, error); a field of several values is a `jl-input-list`;
  several choices at once are a `jl-chip-group multiple`; groups of fields are `jl-accordion-item`s, and a form's
  fields stand in a `jl-stack` where the installed jlib has it. Leaving a page with changes not saved asks first:
  `guardLeave({ isDirty })` asks when the tab closes, and what it returns is the page's `canLeave`, which the router
  waits for.
- **Collections**: a list is the page, its filters (`jl-chip-group` with counts) and its search (`jl-search`) in
  the address, written with `history.replaceState` so each keystroke is not a step of the history; **Show more**
  with "30 of 120" under it (`jl-load-more`: `shown`, `total`, `loading`, the `more` event). Creating something is
  the page's primary action, in a `jl-dialog`; the result opens on its own page (`#/items/<id>`), whose back link
  returns to the list as it was. Beside a list (a split view), New is a `+` button (`icon` and `hint`) on the list's
  search row, there whatever is open, and the way on in the `jl-empty` while nothing is.
- **States**: an action shows it runs on its own button (`loading`); what loads is wrapped in a `jl-load-state`
  (`load({ fetch, draw, isEmpty })`: a skeleton, then the content, its `empty` slot, or the error with **Try
  again**); a form's or a page's error is a `jl-alert` in place; nothing yet, nothing matching, not found or
  unreadable is a `jl-empty` where the content would be, with the way on (create the first one, show all). A process
  shows its `jl-steps`, a failed step (`failed`) marked as such.
- **From page to page**: the page shown stays, usable, until the next one has its data, then the next takes its
  place in one go, never half drawn; meanwhile a thin line over the top says it is on its way. A page whose data
  takes more than 3 seconds shows anyway, its skeletons in place; the first page of a visit shows at once. The
  router shows its pages through a `jl-page-outlet` (where the installed jlib has it), each page loading its data
  in its `jl-load-state`s; another wait that replaces what is shown takes a `jl-loading-bar`.
- **Feedback**: the result itself first (the row appears, the report shows); a toast (`toast()`) for an outcome out
  of view (a job that ends while people are elsewhere, with **Open**) or an action that failed; progress where the
  work started (`jl-progress`, `jl-stat`s in cards). A download is jlib's `download(url, { title })`: a toast with
  its progress and a **Cancel**, then the file saved, under its own name (`Content-Disposition`), or why it failed.
  Several downloads of one thing are one **Download** button opening a `jl-menu`, its items grouped by what they
  take. What waits carries a count in the navigation, read every 30 seconds while the page is in view. A mode the
  whole app is in (offline) is a `jl-alert` over every view, with the way to the page that handles it.
- **Confirmations**: what cannot be undone asks first, with `await confirmDialog({ … })` naming the thing and the
  consequence; what can be undone just happens, with **Undo** in its toast.
- **Search**: a `jl-command-palette` (Ctrl K) with a `jl-search-button` at the top of the side nav (`compact` in the
  phone's top bar): the views, the actions, and the server's own results for the text typed (`search` event,
  commands marked `result`, `loading` meanwhile), a pasted ID opened whole; a result's `description` says what it
  is, telling apart two of one name. The palette can also create (**New …**): the view opens its dialog once the
  address has brought it.

## Reviewing a page

The **checklist** (`checklist`, above) is the review of a finished page: go through it before calling a view done,
and say which of its items the page misses and why.
