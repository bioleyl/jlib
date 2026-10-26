import { list, section, table } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

export const overlays: PatternDoc = {
  components: ['jl-dialog', 'jl-drawer', 'jl-popover', 'jl-menu', 'jl-split-view'],
  icon: 'app-window',
  label: 'Dialogs and panels',
  lead: 'Each surface has its job. Chosen by that job, it tells people what will happen: a dialog comes back to where they were, a page has an address, a drawer keeps the list in view.',
  path: '/patterns/overlays',
  sections: [
    section(
      'Choose the surface',
      table(
        ['Surface', 'For', 'For example'],
        [
          'Page',
          'A thing people link to, come back to, or work in for a while.',
          'An order, an article, a run, a workflow.',
        ],
        [
          'Dialog (`jl-dialog`)',
          'A short task that ends where it began: make or change a small thing, choose, confirm.',
          'New user, edit a category, add a connection, cancel an order.',
        ],
        [
          'Drawer (`jl-drawer`)',
          'The details or settings of an item, beside the list or the canvas people keep in view.',
          "A step's settings beside the workflow, a quick look at a row.",
        ],
        [
          'Popover, menu (`jl-popover`, `jl-menu`)',
          'Choices tied to one control, gone at a click outside.',
          'The other actions of a row, the problems of a workflow, a list of data to insert.',
        ],
        ['Split view (`jl-split-view`)', 'A queue worked through one item after another.', 'Reviews to decide.']
      )
    ),
    section(
      'Dialogs',
      list(
        'The heading names the task: "New user", "Edit Rita Keller".',
        'It fits on one screen: one column, a few fields. A dialog that scrolls wants to be a page.',
        'Its actions in its footer, on the right: **Cancel**, then the primary at the end. A dialog that changes anything has its Cancel.',
        'Escape, its close button and a click outside close it; with changes, it asks first.',
        'Its errors in a `jl-alert` above the footer. Once saved, it closes and the page shows the result.',
        'No dialog over a dialog, but a confirmation.',
        'On a phone it takes the width of the screen.'
      )
    ),
    section(
      'Drawers and side panels',
      list(
        'They open from the right, beside the page when there is room for both, over it on a phone.',
        'They have a close button and close with Escape; the focus goes back to what opened them.',
        'What changes in them applies at once (autosave), or they have the footer of a dialog: never both.'
      )
    ),
    section(
      'Popovers and menus',
      list(
        'They open under the control that opens them, close with Escape and a click outside, and give the focus back.',
        'They hold choices or a short piece of information, never a form to fill.',
        'A menu of a row lists its actions with icons, the one that destroys last, after a line, in red.'
      )
    ),
  ],
  summary: 'When to use a page, a dialog, a drawer, a popover or a split view.',
  title: 'Dialogs and panels',
};
