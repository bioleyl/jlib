import type { JlTabBar } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const ITEMS = JSON.stringify([
  { href: '#home', icon: 'house', id: 'home', label: 'Home' },
  { badge: 3, href: '#inbox', icon: 'inbox', id: 'inbox', label: 'Inbox' },
  { href: '#search', icon: 'search', id: 'search', label: 'Search' },
  { href: '#account', icon: 'user', id: 'account', label: 'Account' },
]);

const SHORT_ITEMS = JSON.stringify([
  { href: '#home', icon: 'house', id: 'home', label: 'Home' },
  { badge: 128, href: '#orders', icon: 'package', id: 'orders', label: 'Orders' },
  { badge: 'New', href: '#reports', icon: 'chart', id: 'reports', label: 'Reports' },
]);

const BUTTON_ITEMS = JSON.stringify([
  { icon: 'list', id: 'list', label: 'List' },
  { icon: 'layout-grid', id: 'grid', label: 'Grid' },
  { icon: 'calendar', id: 'calendar', label: 'Calendar' },
]);

const PHONE =
  'max-width: 390px; border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg); overflow: hidden';

export const doc: ComponentDoc = {
  className: 'JlTabBar',
  description: `On a phone, the main places of an app belong under the thumb, not behind a menu at the top. A tab bar
holds three to five of them, an icon over a short label; keep the rest in the side navigation, and give the bar a
more button that opens it.

Items with an href are real links, so the browser's history and a long press work as people expect; items without
one are buttons. Both fire select and become the value; set value yourself when the page changes some other way.
The current item is drawn in the accent, on a pill, so it does not rely on colour alone. A badge counts what waits
there: numbers above 99 show as 99+.

In a jl-app-shell, put it in slot="tabs": the shell shows it only when narrow, keeps it under its drawer, and
opens the drawer on more.`,
  events: [
    { description: 'An item was pressed: its id. It is now the value.', detail: 'string', name: 'select' },
    { description: 'The more button was pressed.', detail: 'undefined', name: 'more' },
  ],
  examples: [
    {
      description: 'Links with icons and a count; the current one is drawn in the accent.',
      html: `
        <div style="${PHONE}">
          <jl-tab-bar value="inbox" items='${ITEMS}'></jl-tab-bar>
        </div>`,
      title: 'Main places',
    },
    {
      description: 'The other places behind a last button: in an app shell, it opens the drawer.',
      html: `
        <div class="stack" style="max-width: 390px">
          <div style="${PHONE}; max-width: none">
            <jl-tab-bar class="demo-more" value="home" more="More" items='${SHORT_ITEMS}'></jl-tab-bar>
          </div>
          <span class="muted demo-said">Press More.</span>
        </div>`,
      script: `
        root.querySelector('.demo-more').events.register('more', () => {
          root.querySelector('.demo-said').textContent = 'more fired: open the navigation.';
        });`,
      setup: (root) => {
        root.querySelector<JlTabBar>('.demo-more')?.events.register('more', () => {
          const said = root.querySelector('.demo-said');
          if (said !== null) {
            said.textContent = 'more fired: open the navigation.';
          }
        });
      },
      title: 'With more',
    },
    {
      description: 'Without href, the items are buttons: select says which one, for views switched in place.',
      html: `
        <div class="stack" style="max-width: 390px">
          <div style="${PHONE}; max-width: none">
            <jl-tab-bar class="demo-select" value="list" label="Views" items='${BUTTON_ITEMS}'></jl-tab-bar>
          </div>
          <span class="muted demo-view">Showing the list.</span>
        </div>`,
      script: `
        root.querySelector('.demo-select').events.register('select', (id) => {
          root.querySelector('.demo-view').textContent = \`Showing the \${id}.\`;
        });`,
      setup: (root) => {
        root.querySelector<JlTabBar>('.demo-select')?.events.register('select', (id) => {
          const view = root.querySelector('.demo-view');
          if (view !== null) {
            view.textContent = `Showing the ${id}.`;
          }
        });
      },
      title: 'Buttons',
    },
  ],
  level: 'organism',
  name: 'Tab bar',
  playground: {
    attributes: { items: ITEMS, more: 'More', value: 'home' },
    width: 390,
  },
  props: [
    {
      attribute: 'items',
      control: { kind: 'json' },
      default: '[]',
      description: 'The places: id, label, icon, and an optional href and badge.',
      name: 'items',
      type: 'TabBarItem[]',
    },
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The id of the current item.',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'more',
      control: { kind: 'text' },
      default: "''",
      description: 'The label of a last button for the other places, which fires more; empty shows none.',
      name: 'more',
      type: 'string',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "'Shortcuts'",
      description: 'The name of the navigation for screen readers.',
      name: 'label',
      type: 'string',
    },
  ],
  styling: [
    { description: 'The least height of the bar, above the safe area (60px).', name: '--height' },
    { description: 'The bar.', name: 'base' },
  ],
  summary: 'The bar along the bottom of a phone: the main places of an app, one tap away.',
  tag: 'jl-tab-bar',
};
