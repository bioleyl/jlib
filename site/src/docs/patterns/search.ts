import { list, preview, section, table, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

const SHORTCUTS = `
  <div class="stack" style="gap: 8px">
    <div class="row"><jl-kbd keys="mod+k"></jl-kbd><span class="muted">Search and do anything</span></div>
    <div class="row"><jl-kbd keys="j"></jl-kbd><jl-kbd keys="k"></jl-kbd><span class="muted">Next and previous in a queue</span></div>
    <div class="row"><jl-kbd keys="escape"></jl-kbd><span class="muted">Close what floats</span></div>
  </div>`;

export const search: PatternDoc = {
  components: ['jl-command-palette', 'jl-search-button', 'jl-kbd', 'jl-search'],
  icon: 'command',
  label: 'Search and shortcuts',
  lead: 'Ctrl K (⌘K on a Mac) opens the same command palette in every app: it finds anything by its name or number, and does anything the person may do, without leaving the keyboard.',
  path: '/patterns/search',
  sections: [
    section(
      'The command palette',
      list(
        '`jl-command-palette`, opened from anywhere by `Ctrl K` (`⌘K`), by the `jl-search-button` at the top of the side nav, and by the same button, `compact`, in the top bar of a phone.',
        'Its placeholder says what it finds: "Search orders, articles, pages…".',
        'It searches as people type, by name, number, reference, barcode or id, with the words in any order.',
        'When nothing matches: "Nothing matches “x”. Try a number, a name or a page."'
      )
    ),
    section(
      'What it finds',
      text('Groups in this order, each holding only what the person may open or do:'),
      table(
        ['Group', 'Holds'],
        ['Waiting for you', 'What needs the person now: reviews to decide, orders to prepare.'],
        [
          'The things of the app',
          'Orders, articles, workflows, runs, by name or number. One opens on its page, or where the role works on it: an order to prepare opens its picking.',
        ],
        ['Go to', 'Every page of the side nav.'],
        ['Actions', 'What can be done from anywhere: "New order…", "Dark theme", "Sign out".']
      ),
      text('An action that opens a form ends with an ellipsis: "New workflow…".')
    ),
    section(
      'Keys every app shares',
      preview(SHORTCUTS),
      table(
        ['Keys', 'Do'],
        ['`Ctrl K`, `⌘K`', 'Open the command palette.'],
        ['`Escape`', 'Close what floats; leave an edit without keeping it.'],
        ['`Enter`', 'Send the form; open the row in focus.'],
        ['`Ctrl Enter`, `⌘Enter`', 'Send the form from a text area.'],
        ['`/`', 'Go to the search of the list on the page.'],
        ['`J` and `K`, `↓` and `↑`', 'The next and the previous item of a queue.'],
        ['`?`', 'Show the keys of the page.']
      ),
      text(
        'Inside components (menus, tabs, tables), the keys are the ones of [Accessibility](/design/accessibility).'
      )
    ),
    section(
      'Single keys',
      list(
        'A key with no modifier acts only in a queue where it is the main work: `A` approves and `R` rejects in a review inbox.',
        'Never while the focus is in a field, and never for what destroys.',
        'Shown beside the buttons they press, with `jl-kbd`; hidden on touch screens.',
        'The same key does the same thing in every app.'
      )
    ),
  ],
  summary: 'The command palette on Ctrl K, and the keys every app shares.',
  title: 'Search and shortcuts',
};
