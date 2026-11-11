---
name: syware-ux
description: How SyWare's apps behave, from jlib's UX patterns — the principles, the frame (app shell, side nav, tab bar, account, search), page headers and widths, lists and their toolbars, actions and their words, forms, loading, empty and error states, feedback and toasts, confirmations and undo, statuses, phones, accounts — with every pattern page in full (offline), the mistakes generic web habits cause, and the checklist a finished page is reviewed against. Load it when building, changing or reviewing the views of a SyWare app, or of any app that follows SyWare's UX, together with the jlib-official skill; also when asked how a SyWare page should look or behave, what a button or a state should say, or to review a page against the patterns.
license: MIT
---

# SyWare's UX

Every SyWare app behaves the same way, as jlib's [UX patterns](https://bioleyl.github.io/jlib/patterns) describe:
what people learn in one app works in the next. This skill says what each page does and why; it applies the
patterns with jlib's components, whose use is the `jlib-official` skill's (the Claude Code plugin installs it with
this one). Load both.

Written for the patterns of `@syware/jlib@0.14.0`. The patterns: <https://bioleyl.github.io/jlib/patterns>

## How to use this skill

1. **First time in a session**: read this file, then [references/ux-mistakes.md](references/ux-mistakes.md). It
   shows what generic web habits do to a SyWare page, and what the patterns ask instead.
2. **Before building a view**: open the pattern page of what you build ([Where to look](#where-to-look)): each is in
   full in `references/patterns/`, with its rules, its do and don't, and its examples.
3. **While building**: follow the [rules](#rules), with the components as
   [references/applying.md](references/applying.md) shows them.
4. **Before delivering**: go through the [checklist](#self-check-before-delivery) for every page you made or
   changed, fix what it finds, and report.
5. **Asked to review a page**: walk the checklist and the rules over it, and report each finding with its place, the
   rule's name, what the page does and what the pattern asks. Don't edit unless asked.

The project's own rules (`AGENTS.md`, `CLAUDE.md`) win over this skill. A case the patterns do not cover, or one
where a pattern seems wrong for the app, is a question for the person, not a quiet exception.

## The principles

- **People stay in control**: the app proposes, people decide. Nothing that matters happens unseen; what cannot be
  undone asks once, what can be undone offers **Undo**.
- **Answer before they ask**: every screen says what it is, what state it is in and what can be done next; every
  action gets an answer.
- **Same task, same way**: a list, a form, a confirmation look and work the same in every app, with the same words
  in the same places.
- **What needs you comes first**: home pages, lists and counts open on what waits for the person.
- **Fast for regulars, clear for newcomers**: Ctrl K, shortcuts and dense lists; plain words, empty states that teach
  and good defaults.
- **Where the work is**: the tasks done away from a desk are made for a thumb first; every other one still works on
  a phone.

## A SyWare page at a glance

```text
┌──────────────┬──────────────────────────────────────────────────────────────┐
│ [icon] app   │  ← Orders                                     (back link)    │
│ [Search ⌘K]  │  Order CH-2026-0160             [Invoice] [⋯] [Prepare]      │
│              │  Placed by Alpine Électricité SA · [Late]     (one primary)  │
│ ▸ Orders  4  │ ───────────────────────────────────────────────────────────  │
│ ▸ Basket  2  │  [Search the orders…        ] (All)(Open 12)(Late 3)         │
│ADMINISTRATION│  12 orders                                                   │
│ ▸ Users      │  ┌ table: rows are links, row actions as icon buttons ┐      │
│              │  └─────────────────────────────────────────────────────┘     │
│ (MR) Marie   │  30 of 120   [Show more]                                     │
│ Administrator│                                        toasts bottom right ▸ │
└──────────────┴──────────────────────────────────────────────────────────────┘
 On a phone: a top bar (menu, app, search, avatar), the page, a tab bar (4 + More).
```

## Rules

Each rule has a short name; use the name when you cite it in a review.

### Frame

1. **One frame for every app.** `JlAppShell` with `narrowHeader`. The side nav, top to bottom: the app's icon and
   wordmark (a link home; never the SyWare logo), the search button, the destinations (seven at most, each with an
   icon, a count on what waits), an **Administration** group for administrators only, and the person (avatar, name,
   role) opening **My account** and **Sign out**. On a phone, a top bar (menu, app, compact search and avatar) and a
   tab bar of four destinations at most, and **More**.
2. **Every view has an address.** A page, a tab of a page, the item open in a split view; a list's search, filters
   and sort are in its address. What opens a page is a link (`href`), so a middle click opens a tab.
3. **Titles and back links name the page.** `document.title` names what the page shows, then the app ("Order #3 ·
   swstock"). A page under another has a back link named after it; a page of the side nav has none; two levels or
   more take a breadcrumb.

### Page

4. **The header answers three questions.** A `JlPage`: what this is (its title), what state it is in (one status
   badge among the facts), and what can be done (its actions, on the right). A collection's description says what
   it is for; a thing's gives the facts that identify it.
5. **One primary action.** At most one primary button per page, dialog or form, at the end of its actions; one or two
   others before it, the rest in a **More** menu. No red button in a page's header: the danger look is for a menu's
   destroying item (last, after a line) and for the confirm button of a confirmation.
6. **Four widths, flat parts.** `form` (720px), `standard` (1120px), `wide` (1400px), `full`. Parts divided by `h2`
   sections; a card for a part that stands on its own; no card inside a card.

7. **The right surface.** A page for what people link to or work in; a dialog for a short task that ends where it
   began (one screen, **Cancel** then the primary in its footer, nothing over it but a confirmation); a drawer for an
   item's details beside the list; a popover or a menu for choices tied to one control, never a form.

### Lists

8. **The form fits the content.** A table to compare, rows to read one by one, cards to recognise. On a phone, a
   table becomes rows.
9. **Search, filters, sort, count.** Above the list in that order: the search first and widest (its placeholder says
   what it searches), chips for the few values people switch between (with counts) or a select for a long list
   ("All employees" first), the sort, then the count under them ("12 orders", "3 of 48 articles").
10. **Rows are links, actions are shown.** The whole row opens the item. Two actions at most on a row, as icon buttons
   with precise hints ("Edit Rita Keller"), the rest in a **More** menu; never an action shown only on hover.
11. **Long lists show more.** 30 to 50 items, then **Show more** with "30 of 120"; pages only for a fixed set where
    the position matters. A list others change updates by itself, without moving what people are reading.

### Actions and words

12. **Labels are the shared verbs.** In sentence case, never "OK": **New …** (a thing that did not exist), **Add …**
    (into something), **Edit**, **Save**, **Delete** (gone for everyone), **Remove** (out of here), **Deactivate**
    (kept with its history), **Cancel** (or **Keep order** when the action is itself a cancel), **Sign in**, **Sign
    out**, **Try again**, **Show more**.
13. **Disabled says why.** A submit button is not disabled to say a form is incomplete: people press it, the form
    shows what is missing. An action is disabled only for a reason the page shows. One that takes time shows
    `loading` on its own button.

### Forms

14. **One way to save.** A dialog with **Save** (a small thing, where it is listed), a page with **Save** (a larger
    thing), autosave (work done over time), or at once (one setting). Never two of them in one form.
15. **Errors where they are.** Checked on submit first, then as people fix them; under their field, saying how to put
    it right; what the server refuses under its field or in an alert at the top of the form (above a dialog's
    buttons); never in a toast. The focus goes to the first wrong field.
16. **Leaving asks.** A page with changes not saved asks before it is left (`guardLeave`); a dialog with changes asks
    before it closes; what people typed survives a failed save.

### States and feedback

17. **Never a blank page.** The header shows at once; the content shows a skeleton after 300 ms (`JlLoadState`); the
    page shown stays until the next one has its data (`JlPageOutlet`).
18. **The right empty state.** Nothing yet (what will be here, and the action that makes the first one), nothing
    matches (what found nothing, and the way back), all done (calmly). Never "Nothing here".
19. **Errors in place.** A failed load shows in place of the content, with **Try again**; a missing thing or a page of
    another role is a state of the page, not a toast and a jump; an unreachable server is one bar, not a toast per
    request.
20. **The result first.** The change itself answers (the row appears, the status turns **Sent**); a toast only for
    what the page cannot show, naming it ("Order #12 sent"), one action at most.
21. **Ask, or undo.** What can be taken back happens at once, with **Undo** in its toast. What cannot, or touches
    others, asks with `confirmDialog`: the question names the thing, the text says what happens and what is kept, the
    confirm button repeats the verb. People and things with a history are deactivated rather than deleted.
22. **One map per kind of state.** Every status comes from the app's one map (`Record<Status, StatusLook>`), with the
    shared tones: blue waits or runs, green finished well, amber needs attention, red failed, grey over or off. Roles
    and categories are grey. Recent times relative, durations in words.

### Everywhere

23. **Search from anywhere.** `Ctrl K` and the search button open the command palette: what waits for you, the
    things of the app (the server's results), the pages, the actions ("New order…").
24. **Phones are a target.** Every page checked at 390px in both themes; a phone task's main action in a bar along
    the bottom; 44px controls; nothing needs a hover; each field asks for its keyboard.
25. **Keyboard and screen readers.** Everything works with the keyboard; Escape closes what floats; icon buttons have a
    hint; the focus shows.
26. **My account is not Settings.** **My account**: the person (name, role, language, appearance, password, **Sign
    out**, not red). **Settings**: the company, for administrators. Appearance and language apply at once and are
    remembered on the device.

## Where to look

| When you build | Read |
|---|---|
| The frame, titles, addresses, back links, roles | [navigation](references/patterns/navigation.md) |
| A page's header, widths, sections and cards, a home page, a queue or an editor | [page-layout](references/patterns/page-layout.md) |
| A list, a table, rows or cards, search, filters, sort, Show more | [collections](references/patterns/collections.md) |
| Buttons, their words, their places, icon buttons, disabled and busy | [actions](references/patterns/actions.md) |
| A form, its checks, leaving it, passwords | [forms](references/patterns/forms.md) |
| A dialog, a drawer, a popover or a menu | [overlays](references/patterns/overlays.md) |
| Loading, page to page, empty states, errors, not found | [states](references/patterns/states.md) |
| Toasts, progress, live updates | [feedback](references/patterns/feedback.md) |
| A confirmation, Undo, delete or deactivate | [confirmations](references/patterns/confirmations.md) |
| Statuses, their colours, counts, times and durations | [status](references/patterns/status.md) |
| The command palette, the shared keys | [search](references/patterns/search.md) |
| A page for phones, thumbs, scanning | [phones](references/patterns/phones.md) |
| Sign-in, the session, My account and Settings | [accounts](references/patterns/accounts.md) |
| A review of a finished page | [checklist](references/patterns/checklist.md) |
| The principles, and every page in one list | [references/patterns.md](references/patterns.md) |
| The components each pattern uses, in JSX | [references/applying.md](references/applying.md) |
| Are new to SyWare's UX, or review a page | [references/ux-mistakes.md](references/ux-mistakes.md) |

The patterns are those of the version above. For an app on another jlib, a page at its version is in jlib's
repository: `https://raw.githubusercontent.com/bioleyl/jlib/v<version>/site/src/docs/patterns/<slug>.ts`.

## Self-check before delivery

The [checklist](references/patterns/checklist.md), for each page you made or changed. Fix every "no", or say why it
stays.

1. **Frame**: does the page set its title (most specific first, then the app), have an address with its search,
   filters and sort, a back link named after the page above, and show only what the role may use?
2. **Page**: a `JlPage` at one of the four widths, its header with the title, the description or facts, the status
   and the actions; one primary action at most; nothing red before a confirmation; labels from the shared verbs, in
   sentence case, no "OK"?
3. **Lists**: the right form (table, rows, cards); search, filters, sort and count in that order; rows that are links;
   row actions as icon buttons with hints, never only on hover; **Show more** on long lists; live lists that update
   by themselves?
4. **Forms**: one way to save; errors under their fields, precise, from the first submit on; leaving with changes
   asks first?
5. **States and feedback**: a skeleton while loading, never a blank page; the pages through a `JlPageOutlet`; the
   right empty state with its action; a failed load in place with **Try again**; every action showing its result;
   what cannot be undone asking, what can offering **Undo**?
6. **States of things**: statuses from the app's one map with the shared tones (blue only for what waits or runs);
   recent times relative, durations in words?
7. **Phones and access**: checked at 390px in both themes; phone tasks with their main action at the bottom and 44px
   controls; everything with the keyboard, icon buttons with hints, the focus visible? Say what you could not check.

Then report what the pass changed, as `<file>:<line> — <what changed>`, and end with one line:
`syware-ux checklist: 2 fixed` or `syware-ux checklist: clean`.

## When the patterns lack something

The patterns are jlib's, shared by every SyWare app: a case they do not cover, or a rule that does not work for a
real page, is fixed there once. Write it as an issue on jlib (`gh issue list --repo bioleyl/jlib --search "…"` first):
the page, what it needed, what the pattern says, what would solve it. Show it to the person, who files it, or file
it with `gh issue create --repo bioleyl/jlib` once they agree.
