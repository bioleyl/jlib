import { code, list, rules, section, table, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

const SKELETON_ROW = `
  <div class="row" style="flex-wrap: nowrap">
    <jl-skeleton shape="circle" width="32px" height="32px"></jl-skeleton>
    <div class="stack" style="flex: 1; gap: 6px">
      <jl-skeleton width="60%"></jl-skeleton>
      <jl-skeleton width="35%"></jl-skeleton>
    </div>
  </div>`;

const SKELETON = `<div class="stack" style="width: 100%; max-width: 360px; gap: 16px">${SKELETON_ROW.repeat(3)}</div>`;

export const states: PatternDoc = {
  components: ['jl-load-state', 'jl-skeleton', 'jl-empty', 'jl-alert', 'jl-spinner'],
  icon: 'loader',
  label: 'Loading, empty, errors',
  lead: 'A page is never blank and never silent. While it loads, it shows its shape; when it has nothing, it says why and what comes next; when something fails, it says what and offers a way on.',
  path: '/patterns/states',
  sections: [
    section(
      'Loading',
      list(
        'The page header shows at once: its title is known from the address. Only the content waits.',
        'Nothing in the first 300 milliseconds, then a skeleton (`jl-skeleton`) shaped like what is coming: rows for a list, cards for a grid, lines for a text.',
        'A refresh keeps the content on screen until the new one arrives: no skeletons at every live update.',
        'An action shows that it runs on its own button (`loading`); a long one shows its steps. See [Feedback](/patterns/feedback).'
      ),
      text(
        '`jl-load-state` does all of it: wrap the content in it and call `load({ fetch, draw, isEmpty })`. It waits, shows the skeleton, then the content, the empty state of its `empty` slot, or the error with **Try again**; a later `load()` keeps the content while it refreshes.'
      ),
      code(
        'ts',
        `
        const list = this._refs.state; // a <jl-load-state> around the rows, with a <jl-empty slot="empty">
        await list.load({
          fetch: () => api.orders.list(filters),
          draw: (orders) => this.drawRows(orders),
          isEmpty: (orders) => orders.length === 0,
        });`
      ),
      rules(
        { preview: SKELETON, text: 'The shape of what is coming: the page does not jump when it arrives.' },
        {
          preview: '<jl-spinner size="32" label="Loading"></jl-spinner>',
          text: 'A spinner in an empty page says that something happens, not what.',
        }
      )
    ),
    section(
      'Empty states',
      text(
        'An empty collection shows a `jl-empty`: an icon, a heading, a sentence, and an action when there is one to take. Three cases, three kinds of words:'
      ),
      table(
        ['Case', 'It says', 'For example'],
        [
          'Nothing yet',
          'What will be here, and how it gets here; the action that makes the first one, when the person may.',
          '"No articles yet. Articles are what employees order from the shop." **New article**',
        ],
        [
          'Nothing matches',
          'What found nothing, and the way back.',
          '"No article matches “cable”. Try another word or another category." **Clear the search**',
        ],
        [
          'All done',
          'That the work is done, calmly.',
          '"You are all caught up. New reviews show up here as workflows send them."',
        ]
      ),
      rules(
        {
          preview:
            '<jl-empty icon="package" heading="No articles yet" description="Articles are what employees order from the shop."><jl-button variant="primary" icon="plus" label="New article"></jl-button></jl-empty>',
          text: 'What would be here, and the way to the first one.',
        },
        {
          preview: '<span class="muted">None set up yet.</span>',
          text: 'A bare line says neither what would be here nor how to get it.',
        }
      ),
      list(
        'Inside a card or a narrow panel, `size="sm"`.',
        'Never "Nothing here" for an empty list: that is what a missing page says.'
      )
    ),
    section(
      'Errors',
      text(
        'An error shows where its cause is, says what happened in plain words, and offers the way on. See [Writing](/design/writing) for the words.'
      ),
      table(
        ['What failed', 'Shown', 'With'],
        ['An answer in a form', 'Under its field', 'How to put it right.'],
        [
          'Saving a form or a dialog',
          "In a `jl-alert` at the top of the form, or above the dialog's buttons",
          'What the server said; the fields keep their values.',
        ],
        [
          'An action from a row, a switch, a menu',
          'In a danger toast',
          'What failed and why; a change shown in advance goes back.',
        ],
        [
          'Loading a page or a list',
          'In place of the content: the error of `jl-load-state`',
          '"The orders could not be loaded", and **Try again**.',
        ],
        [
          'A thing that does not exist',
          'In place of the page',
          '"This order does not exist", and a link to the list.',
        ],
        ['A page of another role', 'In place of the page', '"For administrators", and who to ask.'],
        [
          'The server out of reach',
          'In a bar at the top of the main area, until it is back',
          '"No connection: changes are not saved until it comes back." It tries again by itself.',
        ]
      ),
      rules(
        {
          preview:
            '<jl-empty icon="circle-alert" heading="The orders could not be loaded" description="The server did not answer. Nothing was changed."><jl-button icon="refresh" label="Try again"></jl-button></jl-empty>',
          text: 'In place of what is missing, with what to do.',
        },
        {
          preview: '<jl-toast tone="danger" heading="The server answered 500."></jl-toast>',
          text: 'A toast over an empty page: it goes, the page stays blank, and "500" means nothing to the reader.',
        }
      )
    ),
    section(
      'Not found, not allowed',
      list(
        'An unknown address: "This page does not exist", and a link home.',
        'A thing that is gone: "This order does not exist. It may have been deleted, or the link is wrong.", and a link to its list.',
        'A page of another role: "For administrators. Ask an administrator of your company to …".',
        'Each is a state of the page, where people can read it, not a toast followed by a jump to another page.'
      )
    ),
    section(
      'Sessions and connections',
      list(
        'A session that ends leads to the sign-in page with the reason, "Your session ended. Sign in again to carry on.", then back to the page people were on.',
        'Work in progress is kept: an editor saves its draft on the device before leaving.',
        'When the server is out of reach, one bar says so, not a toast for each request that failed.'
      )
    ),
  ],
  summary: 'What a page shows before, without and instead of its content.',
  title: 'Loading, empty and errors',
};
