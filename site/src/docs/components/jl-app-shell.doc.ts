import type { ComponentDoc } from '../../types/docs.types';

const SECTIONS = JSON.stringify([
  {
    items: [
      { icon: 'house', id: 'home', label: 'Home' },
      { badge: 4, icon: 'inbox', id: 'inbox', label: 'Inbox' },
    ],
  },
  {
    items: [
      {
        children: [
          { id: 'website', label: 'Website' },
          { id: 'mobile-app', label: 'Mobile app' },
        ],
        icon: 'folder',
        id: 'projects',
        label: 'Projects',
      },
      { icon: 'chart', id: 'reports', label: 'Reports' },
      { icon: 'settings', id: 'settings', label: 'Settings' },
    ],
    label: 'Workspace',
  },
]);

// Inline styles rather than the example classes: the playground shows the same content, outside the examples.
const HEADER = `
  <div slot="header" style="display: flex; align-items: center; gap: 12px">
    <strong style="display: flex; align-items: center; gap: 8px"><jl-icon name="rocket" size="18"></jl-icon> Launchpad</strong>
    <jl-input icon="search" size="sm" placeholder="Search" label="Search" style="flex: 0 1 240px; margin-left: auto"></jl-input>
    <jl-button variant="ghost" icon="bell" hint="Notifications"></jl-button>
  </div>`;

const NAV = `
  <jl-side-nav slot="nav" value="website" sections='${SECTIONS}'></jl-side-nav>`;

const MAIN = `
  <div style="display: grid; gap: 12px; max-width: 640px; padding: 24px; line-height: 1.55">
    <h2 style="margin: 0; font-size: 20px">Website</h2>
    <p style="margin: 0; color: var(--jl-muted)">The main area scrolls on its own: the top bar and the sidebar stay.</p>
    <jl-code-block language="bash" code="npm run build"></jl-code-block>
    <p style="margin: 0">Last deployed two hours ago from the main branch. Previews are built for every pull request
    and kept for a week; production deploys wait for a review.</p>
    <p style="margin: 0">Visitors this week: 12,480, up 8% on last week. Most come from search, then from the
    newsletter.</p>
    <p style="margin: 0">Three alerts are open: one for the image service, two for slow pages on mobile.</p>
    <p style="margin: 0">Domains: example.com and www.example.com, with certificates renewed automatically.</p>
    <p style="margin: 0">Environment variables: 14, of which 3 are secrets shared with the preview builds.</p>
    <p style="margin: 0">Build minutes this month: 312 of 1,000. The longest build took four minutes, the
    shortest forty seconds.</p>
    <p style="margin: 0; color: var(--jl-muted)">The end of the page.</p>
  </div>`;

const ASIDE = `
  <div slot="aside" style="display: grid; gap: 8px; width: 220px; padding: 20px 16px; font-size: 13px">
    <strong>Details</strong>
    <span style="color: var(--jl-muted)">Owner: Ada Lovelace</span>
    <span style="color: var(--jl-muted)">Region: Zurich</span>
    <jl-badge tone="ok" dot label="Healthy" style="justify-self: start"></jl-badge>
  </div>`;

const TABS = `
  <jl-tab-bar slot="tabs" value="home" more="More" items='${JSON.stringify([
    { href: '#home', icon: 'house', id: 'home', label: 'Home' },
    { badge: 4, href: '#inbox', icon: 'inbox', id: 'inbox', label: 'Inbox' },
    { href: '#reports', icon: 'chart', id: 'reports', label: 'Reports' },
  ])}'></jl-tab-bar>`;

const FRAME =
  'height: 420px; border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg); overflow: hidden';

export const doc: ComponentDoc = {
  className: 'JlAppShell',
  description: `The frame of an app: a top bar across (slot header), a sidebar (slot nav), the main area (the default
slot) and an optional panel on the right (slot aside). Only the main area scrolls; the bars stay. The shell takes
the height of its container, so give that one a height: 100dvh for a whole page, a fixed height in a preview.

The shell measures its own width, not the window's (a container query): narrower than 960 pixels, the sidebar
becomes a drawer that slides over the content with a scrim, a menu button appears at the start of the top bar, and
the right panel steps aside. The drawer opens with that button, with nav-open, or with toggleNav(); Escape, the
scrim, following a link or a select from the nav (a jl-side-nav's) closes it.

On phones, the main places go in a bar along the bottom (slot tabs, a jl-tab-bar): it shows only when narrow, and
its more button opens the drawer with the rest. A shell that fills the window then writes the bar's height on the
document as --jl-shell-bottom: toasts keep above it by themselves, and a page's floating bar or button can too, with
bottom: calc(var(--jl-shell-bottom, 0px) + 16px).`,
  events: [
    {
      description: 'People opened or closed the drawer: whether it is open.',
      detail: 'boolean',
      name: 'navtoggle',
    },
  ],
  examples: [
    {
      description:
        'Top bar, side nav, content and a details panel. The preview is drawn at 80%, so the shell is wide enough for its sidebar.',
      html: `
        <div style="${FRAME}">
          <div style="zoom: 0.8; height: 525px">
            <jl-app-shell>${HEADER}${NAV}${MAIN}${ASIDE}
            </jl-app-shell>
          </div>
        </div>`,
      title: 'An app',
    },
    {
      description: 'Narrow, the sidebar waits in a drawer: press the menu button.',
      html: `
        <div style="${FRAME}; max-width: 400px">
          <jl-app-shell>${HEADER}${NAV}${MAIN}
          </jl-app-shell>
        </div>`,
      title: 'Narrow: a drawer',
    },
    {
      description: 'On a phone, the main places along the bottom; More opens the drawer with the others.',
      html: `
        <div style="${FRAME}; max-width: 390px; height: 520px">
          <jl-app-shell>${HEADER}${NAV}${MAIN}${TABS}
          </jl-app-shell>
        </div>`,
      title: 'Narrow: a tab bar',
    },
    {
      description: 'Without a nav, the content takes the whole width; without a header, the top bar goes too.',
      html: `
        <div style="${FRAME}; height: 260px">
          <jl-app-shell>${HEADER}${MAIN}
          </jl-app-shell>
        </div>`,
      title: 'Only a header',
    },
  ],
  level: 'template',
  methods: [
    {
      description: 'Opens or closes the drawer; force sets the state instead of flipping it.',
      name: 'toggleNav',
      signature: 'toggleNav(force?: boolean): void',
    },
  ],
  name: 'App shell',
  playground: {
    attributes: { style: 'height: 380px' },
    content: `${HEADER}${NAV}${MAIN}${ASIDE}`,
    width: 'full',
  },
  props: [
    {
      attribute: 'nav-open',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Whether the drawer is open, when the shell is narrow; wide, the sidebar always shows.',
      name: 'navOpen',
      type: 'boolean',
    },
    {
      attribute: 'narrow-header',
      control: { kind: 'boolean' },
      default: 'false',
      description:
        "Shows the top bar only when the shell is narrow, with the menu button and the header slot (the app's name); wide, the side nav's header names the app, as the navigation pattern lays it out.",
      name: 'narrowHeader',
      type: 'boolean',
    },
  ],
  slots: [
    {
      description: 'The top bar: a brand, a search, the account. The menu button comes before it when narrow.',
      name: 'header',
    },
    { description: 'The sidebar, such as a jl-side-nav; a drawer when narrow.', name: 'nav' },
    { description: 'The main area, which scrolls.', name: '' },
    { description: 'A panel on the right, for details; hidden when narrow.', name: 'aside' },
    { description: 'A bar along the bottom, such as a jl-tab-bar; shown only when narrow.', name: 'tabs' },
  ],
  styling: [
    { description: 'The least height of the top bar (56px).', name: '--header-height' },
    { description: 'The widest the drawer gets (300px, or 86% of the shell).', name: '--drawer-width' },
    { description: 'The grid of the whole frame.', name: 'base' },
    { description: 'The top bar.', name: 'header' },
    { description: 'The sidebar, or the drawer.', name: 'nav' },
    { description: 'The main area.', name: 'main' },
    { description: 'The right panel.', name: 'aside' },
    { description: 'The bottom bar.', name: 'tabs' },
  ],
  summary:
    'The frame of an app: top bar, sidebar, scrolling main area and side panel, with a drawer and a tab bar when narrow.',
  tag: 'jl-app-shell',
};
