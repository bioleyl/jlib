import { code, list, rules, section, table, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

export const status: PatternDoc = {
  components: ['jl-badge', 'jl-timeline', 'jl-steps'],
  icon: 'circle-dot',
  label: 'Status',
  lead: 'Orders, runs and reviews go through states. Each state has one name, one colour and one icon, defined once, and shown the same way wherever it appears.',
  path: '/patterns/status',
  sections: [
    section(
      'One map per kind of thing',
      text(
        'The states of a kind of thing live in one exhaustive map, which every list, page and timeline that shows them reads:'
      ),
      code(
        'ts',
        `
        import type { StatusLook } from '@syware/jlib';

        // A new status is a compile error until it has its look.
        export const ORDER_STATUS: Record<OrderStatus, StatusLook> = {
          submitted: { label: 'Sent', tone: 'info', icon: 'inbox', hint: 'Waiting for logistics to prepare it.' },
          preparing: { label: 'Preparing', tone: 'info', icon: 'list-checks', hint: 'Logistics is picking it.' },
          ready: { label: 'Ready', tone: 'ok', icon: 'package-check', hint: 'Ready to be handed over.' },
          cancelled: { label: 'Cancelled', tone: 'neutral', icon: 'ban', hint: 'Cancelled before it was handed over.' },
        };`
      ),
      text(
        'A `jl-badge` shows it, with its icon, its label and its hint as the tooltip, in a row, in the page header and in a timeline alike: `badge.showStatus(ORDER_STATUS[order.status])`.'
      )
    ),
    section(
      'Colours mean the same in every app',
      table(
        ['Tone', 'Means', 'For example'],
        ['`info`, blue', 'Waiting for a person, or happening now.', 'Sent, To review, Running, Preparing'],
        ['`ok`, green', 'Finished as it should.', 'Done, Approved, Ready, Handed over, Works'],
        [
          '`warn`, amber',
          'Needs attention, though nothing failed.',
          'Partly prepared, Low stock, 2 things to fix',
        ],
        ['`danger`, red', 'Failed, missing, or lost.', 'Failed, Out of stock, Closed incomplete'],
        [
          '`neutral`, grey',
          'Over without a result, off, or not started.',
          'Cancelled, Off, Inactive, Draft, Not tested',
        ]
      ),
      text(
        'Blue is the one accent of the design system: it marks what is live or waits for someone (see [Colour](/design/colour)). Roles, kinds and categories are not states: an "Administrator" or a "Test" badge is grey.'
      ),
      rules(
        {
          preview:
            '<jl-badge tone="info" icon="inbox" label="Sent"></jl-badge><jl-badge label="Administrator"></jl-badge><jl-badge label="Test run"></jl-badge>',
          text: 'Blue for the state that waits; the role and the kind in grey.',
        },
        {
          preview:
            '<jl-badge tone="info" icon="inbox" label="Sent"></jl-badge><jl-badge tone="accent" label="Administrator"></jl-badge><jl-badge tone="info" label="Test"></jl-badge>',
          text: 'Three blues for three meanings: nothing stands out.',
        }
      )
    ),
    section(
      'One name per state',
      list(
        'A state keeps its name in every view: a run "Waiting for review" in the list is not "To review" on its page and "Waiting" in its timeline.',
        'States are named for the people reading: "Sent", not "submitted"; "Ready", not "fulfilled".',
        'A state that waits for someone else says who: "Waiting for the customer care lead".',
        'Beside the state, when it began: "Done · 3 days ago".'
      )
    ),
    section(
      'Counts',
      list(
        'What waits for the reader (reviews, orders to prepare, unread notifications) is counted in a blue badge on its side nav entry, its tab and its filter.',
        'Problems are counted in red: "2 things to fix".',
        'No count at zero: the badge goes. Above 99, "99+".'
      )
    ),
    section(
      'Times and durations',
      list(
        'Recent times are relative ("just now", "5 min ago", "yesterday"); older ones are dates ("12 Mar"), with the full date and time as their tooltip.',
        'Durations in the units that read best: "< 1 sec", "33 secs", "3 mins", "2 hrs 10 mins". Never "0.0 s".',
        "Numbers, dates and amounts are formatted with `Intl`, in the reader's language: jlib's `formatRelativeTime(date, now, locale)` and `formatDuration(milliseconds, locale)` say times and durations this way."
      )
    ),
  ],
  summary: 'The names, colours and icons of states, the same in every view and every app.',
  title: 'Status',
};
