import { list, rules, section, table, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

export const feedback: PatternDoc = {
  components: ['jl-toaster', 'jl-toast', 'jl-progress', 'jl-steps', 'jl-badge'],
  icon: 'bell',
  label: 'Feedback',
  lead: 'Every action gets an answer people can see. Most often the page itself changes; when it cannot show the result, or the result happens elsewhere, a toast says so.',
  path: '/patterns/feedback',
  sections: [
    section(
      'The result first',
      text(
        'The best answer is the change itself: the row appears, the switch turns on, the status becomes **Sent**. A toast adds only what the page cannot show.'
      ),
      table(
        ['After', 'The answer'],
        ['A change in view (a switch, a row edited in a dialog)', 'The change itself, and no toast.'],
        [
          'A change out of view, or after moving on (an order sent from its basket)',
          'A toast naming it: "Order #12 sent".',
        ],
        [
          'Work that runs on its own (a test run, an import)',
          'Its progress where it started, and a toast when it ends.',
        ],
        [
          'A change that can be taken back (removed from the basket)',
          'A toast with **Undo**. See [Confirm and undo](/patterns/confirmations).',
        ],
        ['A failure', 'See [Loading, empty and errors](/patterns/states).']
      )
    ),
    section(
      'Toasts',
      list(
        "One helper per app, a `notify()` over jlib's `toast()`, with the same durations everywhere.",
        'The heading says what happened, to what: "Order #12 sent", "“Answer support emails” is on". Not "Saved." or "Success".',
        'A second line only when it helps with what comes next: "Give them their temporary password."',
        'One action at most: **Undo**, **Open**, **See activity**.',
        "They last 5 seconds, 8 with an action or for an error (jlib's defaults); hovering or focusing one pauses it.",
        "Bottom right on a computer (the toaster's default), bottom centre above the tab bar on a phone.",
        "Never the only report of a form's error, and never for what asks a decision: that belongs in the page or a dialog."
      ),
      rules(
        {
          preview:
            '<jl-toast tone="ok" heading="Order #12 sent" text="You get a notification when it is ready."></jl-toast>',
          text: 'What happened, to what, and what comes next.',
        },
        {
          preview: '<jl-toast tone="ok" heading="Success!"></jl-toast>',
          text: 'What succeeded? And the exclamation mark only adds noise.',
        }
      )
    ),
    section(
      'Progress',
      table(
        ['It takes', 'Show'],
        ['Under a second', '`loading` on the button pressed.'],
        ['A few seconds', 'The same, then the result on the page.'],
        [
          'Longer, or in steps',
          'The steps as they go (`jl-steps`, `jl-progress`), and what happens now, in words: "Reading the document…".',
        ],
        [
          'In the background',
          'Its status in its list ("Running"), live, and a toast when it ends if people have moved on.',
        ]
      )
    ),
    section(
      'Live updates',
      list(
        'What others change updates by itself: statuses, queues, counts, notifications. Through server-sent events when the server sends them; otherwise a request every 30 seconds while the tab is visible, and at once when it becomes visible again.',
        'The counts of what waits (in the side nav, the tabs, the home page) follow without a reload.',
        'A live change never moves what people are reading or pointing at, and never closes what they opened.'
      )
    ),
    section(
      'Changes shown in advance',
      list(
        'A small change the server has no reason to refuse (a switch, "mark as read") shows at once; if the server refuses it after all, it goes back, with a toast that says why.',
        'An action with consequences (a decision, sending, paying) waits for the server: `loading` until it answers.'
      )
    ),
  ],
  summary: 'The result on the page first, toasts, progress and live updates.',
  title: 'Feedback',
};
