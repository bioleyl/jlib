import { list, note, preview, rules, section, table, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

const NAV_SECTIONS = JSON.stringify([
  {
    items: [
      { badge: 4, icon: 'list-checks', id: 'orders', label: 'Orders' },
      { icon: 'package', id: 'stock', label: 'Stock' },
      { badge: 2, icon: 'bell', id: 'notifications', label: 'Notifications' },
    ],
  },
  {
    items: [
      { icon: 'users', id: 'users', label: 'Users' },
      { icon: 'settings', id: 'settings', label: 'Settings' },
    ],
    label: 'Administration',
  },
]);

const SIDE_NAV = `
  <div style="display: grid; width: 270px; height: 470px; border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg); overflow: hidden; background: var(--jl-surface)">
    <jl-side-nav value="orders" sections='${NAV_SECTIONS}'>
      <div slot="header" style="display: grid; gap: 12px; padding: 4px 4px 10px">
        <div style="display: grid; padding: 0 6px; line-height: 1.3">
          <strong style="font-size: 16px">sw<span style="color: var(--jl-brand)">stock</span></strong>
          <span class="muted" style="font-size: 12px">Alpine Électricité SA</span>
        </div>
        <jl-search-button></jl-search-button>
      </div>
      <div slot="footer" style="padding: 6px; border-top: 1px solid var(--jl-line)">
        <jl-account-button name="Marie Rochat" description="Administrator" href="#"></jl-account-button>
      </div>
    </jl-side-nav>
  </div>`;

export const navigation: PatternDoc = {
  components: [
    'jl-app-shell',
    'jl-side-nav',
    'jl-search-button',
    'jl-account-button',
    'jl-tab-bar',
    'jl-page',
    'jl-breadcrumb',
    'jl-command-palette',
  ],
  icon: 'panel-left',
  label: 'Navigation',
  lead: 'Every SyWare app has the same frame: the same places for the product, the search, the destinations and the person, on a computer and on a phone. Learn it in one app, and find your way in all of them.',
  path: '/patterns/navigation',
  sections: [
    section(
      'The frame on a computer',
      text(
        'From 960px wide, `jl-app-shell` shows a side nav (`jl-side-nav`) and no top bar: the page header is the first thing at the top of the content. The side nav reads from top to bottom:'
      ),
      preview(
        SIDE_NAV,
        'The product and its company, the search, the destinations with their counts, the administration, and the person.'
      ),
      table(
        ['Place', 'What goes there'],
        [
          'Top',
          "The product's wordmark, a link to its home page. In an app that several companies share, the company's name under it.",
        ],
        [
          'Search',
          'A `jl-search-button`, which opens the command palette and shows its keys, `Ctrl K` (`⌘K` on a Mac). See [Search and shortcuts](/patterns/search).',
        ],
        [
          'Destinations',
          'The places people work in, seven at most, the most used first, each with an icon. What waits for the person carries a count: **Review inbox 3**, **Notifications 2**, **Basket 4**.',
        ],
        [
          'Administration',
          'A group under the label **Administration** for what only administrators manage: users, connections, the settings of the company, its history. Absent for everyone else.',
        ],
        [
          'Bottom',
          'The person, a `jl-account-button`: avatar, name and role. It opens their account: **My account** and **Sign out**. See [Accounts and settings](/patterns/accounts).',
        ]
      ),
      text(
        'What people need everywhere lives in the frame, not in icons scattered in a corner of the page. A basket, notifications or an inbox are destinations with a count: they have a name screen readers can say, and the same place in every app.'
      ),
      text(
        'A work surface that needs the width (an editor, a canvas) folds the side nav into a rail of icons, and gives it back when people leave.'
      )
    ),
    section(
      'The frame on a phone',
      text('Under 960px the side nav becomes a drawer, and two bars take its place:'),
      list(
        "**A top bar** (the shell's `header` slot): the menu button, the wordmark, then on the right the search and the person, `jl-search-button` and `jl-account-button` with `compact`. Never a bar with the menu button alone: people must see which app they are in.",
        "**A tab bar** (`jl-tab-bar`, in the shell's `tabs` slot) along the bottom: the destinations of the daily work, four at most, in the order of the side nav and with their counts. **More** opens the drawer for the rest.",
        'The drawer holds the same side nav as on a computer: nothing is only on a phone, nothing only on a computer.'
      ),
      text(
        "Choose the tabs for each role's daily work, not one per page: an employee who orders gets **Shop**, **Basket** and **My orders**; a reviewer gets **Home**, **Review inbox** and **Activity**."
      )
    ),
    section(
      'Page titles',
      text(
        'The browser shows `document.title` in its tabs, its history and its bookmarks. It names what the page shows, the most specific first, then the app:'
      ),
      table(
        ['Page', 'Title'],
        ['A collection', '`Orders · swstock`'],
        ['One thing', '`Order #3 · swstock`, `Answer support emails · swai`'],
        ['A form', '`New article · swstock`'],
        ['Sign-in', '`Sign in · swai`']
      ),
      text(
        "`jl-page` writes it from its heading when given `app-name`: set the heading once the subject has loaded; until then, it is the name of the collection. A title that is always the app's name makes ten tabs look alike."
      )
    ),
    section(
      'Addresses',
      list(
        'Every view people could bookmark, share or come back to has its own address: a page, a tab of a page, the item opened in a split view (`#/inbox/rev_42`).',
        'The search, the filters and the sort of a list are in its address (`#/activity?status=failed`): Back returns to the same list, and a link shows what its sender saw.',
        'What opens a page is a link: a row, a card or a button with an `href` (`jl-list-item` and `jl-button` take one), so it opens in a new tab with a middle click. Buttons without one do things.',
        'An address that worked once keeps working: a renamed page sends its old address on to the new one.'
      )
    ),
    section(
      'Back links',
      text(
        'A page under another (an order under Orders, a run under Activity) shows a back link above its title: `jl-page` draws it from `back` and `back-label`. It names where it goes, and returns to the list as it was, with its filters.'
      ),
      rules(
        {
          preview: '<jl-button variant="ghost" size="sm" icon="arrow-left" label="Orders"></jl-button>',
          text: 'Named after the page it returns to.',
        },
        {
          preview: '<jl-button variant="ghost" size="sm" icon="arrow-left" label="Back"></jl-button>',
          text: '"Back" does not say where, and is not the same as the browser\'s Back.',
        }
      ),
      list(
        'Two levels or more (a company, its site, a room) take a `jl-breadcrumb` instead.',
        'A page of the side nav has no back link: the side nav shows where it is.',
        'A full-screen editor starts its toolbar with the back link as an icon button, its hint naming the page: "All workflows".'
      )
    ),
    section(
      'Roles',
      list(
        '**Hide** what a role can never use: a reviewer sees no Administration group and no **New workflow** button.',
        '**Disable, with the reason**, what the person could do in other conditions: the reason in the button\'s hint, or beside it ("15 of 15 users").',
        '**Say so** when an address leads to a page of another role: "For administrators", and who to ask. A missing page and a forbidden one are different answers; neither is a blank page.',
        '**Mark what is read-only**: a "View only" badge in the page header, and the values shown as text, not as a form of disabled fields.',
        'The role shows under the name at the bottom of the side nav, and on My account with one sentence on what it allows.'
      ),
      note(
        'The things of another company are never "forbidden": they do not exist for this person, and the app answers as for a missing page.'
      )
    ),
  ],
  summary: 'The frame of an app, page titles and addresses, back links and roles.',
  title: 'Navigation',
};
