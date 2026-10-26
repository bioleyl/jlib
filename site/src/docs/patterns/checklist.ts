import { list, section, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

export const checklist: PatternDoc = {
  components: [],
  icon: 'list-checks',
  label: 'Checklist',
  lead: 'Go through it for every new screen, and when reviewing one. Each group leads to the pattern behind it.',
  path: '/patterns/checklist',
  sections: [
    section(
      'Frame',
      text('See [Navigation](/patterns/navigation).'),
      list(
        'The page sets its `document.title`, the most specific first: "Order #3 · swstock".',
        'It has an address, and its search, filters and sort are in it.',
        'A page under another has a back link named after it.',
        'Roles see only what they may use; a page of another role says so.'
      )
    ),
    section(
      'Page',
      text('See [Page layout](/patterns/page-layout) and [Actions](/patterns/actions).'),
      list(
        'A `jl-page-header` with the title, the description or the facts, the status and the actions.',
        'One primary action at most; what destroys is not red before its confirmation.',
        'A `jl-page`, at one of the four widths: form, standard, wide or full.',
        'Labels are verbs from the shared words, in sentence case; no "OK".'
      )
    ),
    section(
      'Lists',
      text('See [Lists and tables](/patterns/collections).'),
      list(
        'The form fits the content: a table to compare, rows to read, cards to recognise.',
        'Search, filters, sort and the count, in that order; chips filter, segments switch.',
        'Rows are links; their actions are icon buttons with hints, never only on hover.',
        'Long lists have **Show more**; lists others change update by themselves.'
      )
    ),
    section(
      'Forms',
      text('See [Forms](/patterns/forms).'),
      list(
        'One way to save: a dialog, a page, autosave, or at once.',
        'Errors under their fields, precise, from the first submit on.',
        'Leaving with changes not saved asks first (`guardLeave`).'
      )
    ),
    section(
      'States and feedback',
      text(
        'See [Loading, empty and errors](/patterns/states), [Feedback](/patterns/feedback) and [Confirm and undo](/patterns/confirmations).'
      ),
      list(
        'A skeleton while loading, never a blank page: a `jl-load-state`.',
        'The right empty state (nothing yet, nothing matches, all done), with its action.',
        'A failed load shows in place of the content, with **Try again**.',
        'Every action shows its result; a toast names what happened.',
        'What cannot be undone asks, naming the consequence; what can be undone offers **Undo**.'
      )
    ),
    section(
      'States of things',
      text('See [Status](/patterns/status).'),
      list(
        "Statuses come from the app's one map, with the shared tones; blue only for what waits or runs.",
        'Recent times are relative; durations read as words, not "0.0 s".'
      )
    ),
    section(
      'Phones and access',
      text('See [Phones and touch](/patterns/phones) and [Accessibility](/design/accessibility).'),
      list(
        'Checked at 390px wide, in both themes.',
        'Phone tasks have their main action in a bar at the bottom, and 44px controls.',
        'Everything works with the keyboard; icon buttons have a hint; the focus shows.'
      )
    ),
  ],
  summary: 'What to check before a screen ships.',
  title: 'Checklist',
};
