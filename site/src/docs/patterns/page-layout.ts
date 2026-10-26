import { list, preview, rules, section, table, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

const HEADER = `
  <jl-page heading="Order #3" description="Job CH-2026-0160 · Sara Monnier · 25 Oct, 22:47" back="#" back-label="Orders" style="width: 100%; background: var(--jl-surface); border: 1px solid var(--jl-line); border-radius: var(--jl-radius)">
    <jl-badge slot="meta" tone="info" icon="inbox" label="Sent" hint="Waiting for logistics to prepare it."></jl-badge>
    <span slot="meta" class="muted">Waiting for logistics</span>
    <jl-button slot="actions" icon="ban" label="Cancel order"></jl-button>
    <jl-button slot="actions" variant="primary" icon="list-checks" label="Prepare"></jl-button>
    <p class="muted">The content of the page.</p>
  </jl-page>`;

const CARD_GOOD = `
  <jl-card heading="Waiting for you" style="width: 100%; max-width: 380px">
    <jl-list-item heading="Refund request from Léa Dubois" description="Answer support emails · 3 days ago" href="#"></jl-list-item>
    <jl-list-item heading="Reply to Maria Rossi" description="Answer support emails · 3 days ago" href="#"></jl-list-item>
  </jl-card>`;

const CARD_BAD = `
  <jl-card heading="Waiting for you" style="width: 100%; max-width: 380px">
    <jl-card heading="Refund request from Léa Dubois" description="Answer support emails"></jl-card>
  </jl-card>`;

export const pageLayout: PatternDoc = {
  components: ['jl-page', 'jl-page-header', 'jl-card', 'jl-stat', 'jl-split-view'],
  icon: 'panels-top-left',
  label: 'Page layout',
  lead: 'Before anything else, a page answers three questions: what is this, what state is it in, and what can I do here. Its header answers them, in the same place on every page.',
  path: '/patterns/page-layout',
  sections: [
    section(
      'The page header',
      text(
        'Every page is a `jl-page`: its header (a `jl-page-header`), then its content. Given `back`, `back-label` and `app-name`, it draws the back link and names the browser tab.'
      ),
      preview(HEADER, 'Where it sits, what it is, its state and what identifies it, and what can be done.'),
      table(
        ['Part', 'What it holds'],
        ['Back link', 'Where the page sits, for a page under another. See [Navigation](/patterns/navigation).'],
        [
          'Title',
          'The name of the thing (`Order #3`, `Answer support emails`) or of the collection (`Orders`). A greeting only on the home page.',
        ],
        [
          'Description',
          'On a collection, one sentence on what it is for: "Every run of every workflow: what started it, what it did, and how it ended." On one thing, the facts that identify it: its job, who, when.',
        ],
        [
          'Status',
          'One badge, among the facts (the `meta` slot); never above the title, away from what it qualifies.',
        ],
        [
          'Actions',
          'On the right: one primary at most, at the end, one or two others before it, and the rest in a **More** menu. See [Actions](/patterns/actions).',
        ]
      )
    ),
    section(
      'Widths',
      text(
        'Lines stay readable and controls stay near what they act on. Four widths cover every page, the `width` of `jl-page`:'
      ),
      table(
        ['Width', 'At most', 'For'],
        ['`form`', '`--jl-page-form`, 720px', 'One column of fields: a form page, settings, My account.'],
        ['`standard`', '`--jl-page-standard`, 1120px', "Collections, one thing's page, the home page."],
        ['`wide`', '`--jl-page-wide`, 1400px', 'Tables with many columns, grids of cards, boards.'],
        ['`full`', 'The whole main area', 'Work surfaces: an editor, a canvas, the split view of a queue.']
      ),
      list(
        'The header takes the width of its page: the title of a form sits over its fields, not at the far left of the window.',
        'The side padding is `--jl-space-10` (40px), `--jl-space-4` (16px) on phones; the header starts `--jl-space-8` (32px) from the top.',
        'Pages are centred in the main area. Nothing scrolls sideways, but a wide table inside its own frame.'
      )
    ),
    section(
      'Sections and cards',
      list(
        'A page made of parts divides them with `h2` sections.',
        'A card (`jl-card`) frames a part that stands on its own: a group of settings, a short list with its own link ("See all").',
        "A card's header holds its title on the left, and its one link or action on the right.",
        'No card inside a card: inside one, divide with lines and headings.'
      ),
      rules(
        { preview: CARD_GOOD, text: 'A card holds rows; lines divide them.' },
        { preview: CARD_BAD, text: 'Frames in frames: the eye counts borders instead of reading.' }
      )
    ),
    section(
      'Home pages',
      text('The home page is for the person who has just signed in. In this order:'),
      list(
        'What waits for them, with the action that starts it: "3 decisions wait for you", **Start reviewing**. Nothing at all when nothing waits.',
        'Four numbers at most on how things go (`jl-stat`), each a link to the list behind it.',
        'What happened lately, a few rows, and a link to the whole list.'
      ),
      text(
        'A role with one daily task (an employee who orders) has no home page: the app opens on that task, the first destination of its side nav.'
      )
    ),
    section(
      'Queues and work surfaces',
      list(
        'A queue worked through one by one (reviews to decide, orders to prepare) is a split view (`jl-split-view`): the list on the left, the opened item on the right, and the next item opening after each decision.',
        'On a phone it becomes two pages: the list, then the item with a back link to it.',
        'An editor takes the whole main area, folds the side nav into a rail, and has a toolbar of its own: the back link, the name, the save state, then its actions.'
      )
    ),
  ],
  summary: 'The page header, the widths, sections and cards, home pages and work surfaces.',
  title: 'Page layout',
};
