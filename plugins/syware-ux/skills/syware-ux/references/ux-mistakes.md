# Mistakes generic web habits make in a SyWare app

Read this the first time you use the skill in a session. A model that knows web apps in general builds a page that
works and still breaks SyWare's patterns: a spinner page, a toast for everything, "Are you sure?", a red button in
the header. Each entry shows the habit, what it costs people, and what the pattern asks. The rule names are those of
[SKILL.md](../SKILL.md#rules).

## Contents

1. A frame of the app's own
2. Lists whose filters live in memory
3. A title that is always the app's name, a back link that says "Back"
4. A hand-made header, several primary buttons, a red button
5. Cards everywhere
6. A toolbar in any order, no count
7. Row actions on hover, rows that are not links
8. Pages of numbered results by default
9. "OK", "Submit", "Log out", Title Case
10. A submit button disabled until the form is complete
11. Two ways to save in one form
12. Errors in a toast, or all at the top
13. A blank page or a spinner while loading
14. "Nothing here", one empty state for every case
15. A toast and a jump for a missing thing
16. "Saved!" toasts for what shows on the page
17. "Are you sure?" for everything, or for nothing
18. Statuses coloured by taste
19. "0.0 s", "2026-11-05T14:03:00Z"
20. A dialog that scrolls, a dialog over a dialog, a form in a popover
21. A page made for a computer only
22. One page called Settings for everything

## 1. A frame of the app's own

Rule: **One frame for every app.**

A top navbar with links, a logo on the left, the user's menu in the top right corner, a search field in the header:
the next SyWare app people open looks nothing like it. The frame is the same everywhere: a `JlAppShell` with
`narrowHeader`, the side nav (the app's icon and wordmark, the search button, the destinations with counts, the
Administration group, the person at the bottom), a top bar and a tab bar on phones. Never the SyWare logo in an app:
it is the company's.

## 2. Lists whose filters live in memory

Rule: **Every view has an address.**

A list keeps its search and filters in component state: Back loses them, a reload resets them, a shared link shows
something else. They go in the address (`/orders?status=late&search=alpine`), written without a step in the history
per keystroke, and read back when the page gets its route. A row that opens an item is a link, so a middle click
opens it in a tab.

## 3. A title that is always the app's name, a back link that says "Back"

Rule: **Titles and back links name the page.**

Ten tabs all called "swstock" are ten tabs nobody can tell apart. `document.title` is the page, then the app:
"Order #3 · swstock" (`appName` on `JlPage`). A back link says where it goes ("← Orders"), never "Back"; a page of the
side nav has none.

## 4. A hand-made header, several primary buttons, a red button

Rules: **The header answers three questions.** **One primary action.**

```html
<!-- Bad: three blue buttons and a red one, the status above the title -->
<span class="badge">Late</span>
<h1>Order #3</h1>
<button class="primary">Prepare</button><button class="primary">Invoice</button>
<button class="primary">Duplicate</button><button class="danger">Cancel order</button>
```

The eye has nowhere to go, and the red button pulls it to what people do least. One primary at the end of the
header's actions, one or two secondary before it, the rest in a **More** menu (the destroying item last, after a
line, in red), the status badge among the facts under the title.

## 5. Cards everywhere

Rule: **Four widths, flat parts.**

A dashboard of cards, cards inside cards, a card around a whole form: borders on borders. Parts are divided by `h2`
sections; a card frames only a part that stands on its own (a group of settings, a short list with its "See all");
never a card inside a card.

## 6. A toolbar in any order, no count

Rule: **Search, filters, sort, count.**

Filters on the left, the search squeezed on the right, no way to know how many things the list holds. The order is
the same in every app: the search first and widest, saying what it searches; the filters (chips with counts for a
few values, a select starting with "All …" for a long list); the sort; then the count under them, "12 orders". Chips
filter a list; segments switch between views of it; tabs split a thing into parts.

## 7. Row actions on hover, rows that are not links

Rule: **Rows are links, actions are shown.**

Icons that appear on hover do not exist on a phone, and a row that opens on a click handler cannot open in a tab.
The whole row is a link; two actions at most, always shown, as icon buttons with precise hints ("Edit Rita Keller");
the rest in a **More** menu.

## 8. Pages of numbered results by default

Rule: **Long lists show more.**

Page 1, 2, 3 … 12 under every list. SyWare's lists load 30 to 50 items, then **Show more** with "30 of 120" beside it;
numbered pages only for a fixed set where a row's position matters. A list never stops at a limit without saying so.

## 9. "OK", "Submit", "Log out", Title Case

Rule: **Labels are the shared verbs.**

| Not | Say |
|---|---|
| OK, Submit, Apply | **Save**, or the verb of the action: **Send order** |
| Create, Add a user | **New user** (a thing that did not exist) |
| Remove (for what is gone for everyone) | **Delete**; **Remove** is "out of here" |
| Delete a user with a history | **Deactivate** |
| Log in, Log out, Logout | **Sign in**, **Sign out** |
| Retry | **Try again** |
| Load more, Next | **Show more** |
| Yes / No, two "Cancel" side by side | **Cancel order** / **Keep order** |
| Save Changes | **Save** (sentence case) |

## 10. A submit button disabled until the form is complete

Rule: **Disabled says why.**

A grey button explains nothing: people do not know what is missing. The button stays pressable; pressing it shows,
under each field, what to put right. An action is disabled only for a reason the page shows ("15 of 15 users").

## 11. Two ways to save in one form

Rule: **One way to save.**

A switch that applies at once in a form that also has **Save**, or an autosaving editor with a **Save** button "to be
sure": people cannot tell what is kept. Each form saves one way: a dialog with **Save**, a page with **Save**,
autosave, or at once.

## 12. Errors in a toast, or all at the top

Rule: **Errors where they are.**

"Some fields are missing or wrong." in a toast that vanishes, or red under every field before anyone typed. Errors
come on the first submit, under their field, saying how to put it right ("Enter the job number, like
CH-2026-0160"), and go as soon as the answer is right; what the server refuses about a field goes under it, the rest
in an alert at the top of the form.

## 13. A blank page or a spinner while loading

Rule: **Never a blank page.**

A white page, then a centred spinner, then everything at once. The header shows at once (its title is known from the
address); the content shows a skeleton shaped like what comes, after 300 ms; from page to page, the page shown stays
until the next one has its data. `JlLoadState` and `JlPageOutlet` do it.

## 14. "Nothing here", one empty state for every case

Rule: **The right empty state.**

"No data" for a new account, for a search that found nothing and for a finished queue alike. Three cases, three kinds
of words: nothing yet (what will be here, and **New …**), nothing matches (what found nothing, and **Clear the
search**), all done ("You are all caught up").

## 15. A toast and a jump for a missing thing

Rule: **Errors in place.**

An order that does not exist shows a toast and sends people to the home page: they never read why. It is a state of
the page: "This order does not exist. It may have been deleted, or the link is wrong.", and a link to the orders. A
page of another role says "For administrators", and who to ask.

## 16. "Saved!" toasts for what shows on the page

Rule: **The result first.**

A toast for every action teaches people to ignore toasts. The change itself answers; a toast only for what the page
cannot show (an order sent from the basket, an import that ended elsewhere), naming it: "Order #12 sent".

## 17. "Are you sure?" for everything, or for nothing

Rule: **Ask, or undo.**

Asking at every step teaches people to confirm without reading; deleting at once without asking loses work. What can
be taken back happens with **Undo**; what cannot asks with `confirmDialog`, naming the thing and the consequence, the
button repeating the verb (**Delete user**), the focus on the way out. Never `window.confirm`.

## 18. Statuses coloured by taste

Rule: **One map per kind of state.**

"Done" in blue on one page and green on another, "Admin" in red. Every status comes from the app's one map, with the
shared tones: blue waits for a person or runs, green finished well, amber needs attention, red failed, grey over or
off. Roles and categories are grey. A state keeps its name in every view.

## 19. "0.0 s", "2026-11-05T14:03:00Z"

Rule: **One map per kind of state.**

Raw numbers and ISO dates on screen. Recent times are relative ("5 minutes ago", "yesterday"), older ones dates
with the full date as a tooltip; durations in words ("< 1 sec", "33 sec", "2 min"); amounts with `Intl`, in the
reader's language.

## 20. A dialog that scrolls, a dialog over a dialog, a form in a popover

Rule: **The right surface.**

A dialog is a short task that ends where it began: one column, a few fields, **Cancel** then the primary in its
footer. A dialog that scrolls wants to be a page; nothing opens over a dialog but a confirmation; a popover holds
choices or a short piece of information, never a form to fill.

## 21. A page made for a computer only

Rule: **Phones are a target.**

A table that scrolls the whole page sideways, actions in a hover menu, 28px buttons, the main action at the top of a
long page. Every page is checked at 390px in both themes; a phone task has its main action in a bar along the bottom;
controls are 44px; a table becomes rows; filters scroll in one row of chips.

## 22. One page called Settings for everything

Rule: **My account is not Settings.**

The person's password next to the company's AI models: people look for their own settings, administrators for the
company's. **My account** holds the person (name, role, language, appearance, password, **Sign out**); **Settings**
holds the company, for administrators. **Sign out** is not red and asks nothing.
