import type { JlSideNav } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const SECTIONS = JSON.stringify([
  {
    items: [
      { icon: 'house', id: 'home', label: 'Home' },
      { badge: 12, icon: 'inbox', id: 'inbox', label: 'Inbox' },
      { icon: 'bell', id: 'activity', label: 'Activity' },
    ],
  },
  {
    items: [
      {
        children: [
          { id: 'website', label: 'Website' },
          { badge: 'New', id: 'mobile-app', label: 'Mobile app' },
          { id: 'design-system', label: 'Design system' },
        ],
        icon: 'folder',
        id: 'projects',
        label: 'Projects',
      },
      { icon: 'chart', id: 'reports', label: 'Reports' },
      { icon: 'users', id: 'team', label: 'Team' },
    ],
    label: 'Workspace',
  },
  {
    items: [
      { icon: 'settings', id: 'settings', label: 'Settings' },
      { icon: 'credit-card', id: 'billing', label: 'Billing' },
    ],
    label: 'Account',
  },
]);

const FRAME = 'height: 540px; border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg)';

export const doc: ComponentDoc = {
  className: 'JlSideNav',
  description: `The navigation down the side of an app: sections under small headings, items with an icon and a badge,
and items with children that open with a chevron. value is the active item: it is drawn in the accent colour, and
the parents above it open to show it.

collapsed turns it into a rail of icons, for when the content needs the room: the labels become tooltips (and stay
for screen readers), badges become dots, and a parent leads to its first child. collapsible lets people do it: a
button at the bottom folds the side nav into its rail and unfolds it, and collapse says so for the app to remember it
on the device. In the drawer of a narrow jl-app-shell, the side nav shows whole and the button hides. While it shows
as a rail, the host carries the rail attribute, for styles around it: jl-side-nav[rail].

Every item is a link (with an href) or a button, so the Tab key reaches it; Up and Down move between the visible
items, Right opens a parent and Left closes it. Items without an href fire select; put the side nav in the nav slot
of jl-app-shell for the whole frame.`,
  events: [
    { description: 'An item was chosen: its id.', detail: 'string', name: 'select' },
    {
      description: 'People folded the side nav into its rail (true) or unfolded it (false), with its button.',
      detail: 'boolean',
      name: 'collapse',
    },
  ],
  examples: [
    {
      description: 'Badges, a nested group, and the active item inside it.',
      html: `
        <div style="${FRAME}; width: 260px">
          <jl-side-nav value="mobile-app" sections='${SECTIONS}'></jl-side-nav>
        </div>`,
      title: 'Sections and nesting',
    },
    {
      description:
        'collapsible: the button at the bottom folds it into a rail of icons (hover one for its label), and unfolds it.',
      html: `
        <div style="${FRAME}">
          <jl-side-nav collapsible collapsed value="inbox" sections='${SECTIONS}'></jl-side-nav>
        </div>`,
      title: 'Collapsed rail',
    },
    {
      description: 'A brand in the header slot, the account in the footer slot; the sentence listens to select.',
      html: `
        <div class="row" style="align-items: start">
          <div style="${FRAME}; width: 260px">
            <jl-side-nav class="demo-select" value="home" sections='${SECTIONS}'>
              <div slot="header" class="row" style="gap: 8px; padding: 4px 10px 8px; font-weight: 700">
                <jl-icon name="rocket" size="18"></jl-icon> Launchpad
              </div>
              <div slot="footer" class="row" style="gap: 8px; padding: 10px; border-top: 1px solid var(--jl-line)">
                <jl-icon name="user" size="16"></jl-icon>
                <span class="muted">ada@example.com</span>
              </div>
            </jl-side-nav>
          </div>
          <p class="muted demo-select-out">On home.</p>
        </div>`,
      script: `
        const nav = root.querySelector('.demo-select');
        const out = root.querySelector('.demo-select-out');
        nav.events.register('select', (id) => {
          out.textContent = \`On \${id}.\`;
        });`,
      setup: (root) => {
        const nav = root.querySelector<JlSideNav>('.demo-select');
        const out = root.querySelector('.demo-select-out');
        nav?.events.register('select', (id) => {
          if (out !== null) {
            out.textContent = `On ${id}.`;
          }
        });
      },
      title: 'Header, footer and listening',
    },
  ],
  level: 'organism',
  methods: [
    {
      description: 'Opens or closes a parent item; force sets the state instead of flipping it.',
      name: 'toggleItem',
      signature: 'toggleItem(id: string, force?: boolean): void',
    },
  ],
  name: 'Side nav',
  playground: { attributes: { sections: SECTIONS, value: 'website' }, width: 260 },
  props: [
    {
      attribute: 'sections',
      control: { kind: 'json' },
      default: '[]',
      description:
        'The sections: an optional label, and items with id, label, icon, href (and target: _blank for a new tab), badge and children.',
      name: 'sections',
      type: 'SideNavSection[]',
    },
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The id of the active item.',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'collapsed',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'A narrow rail of icons, with the labels as tooltips.',
      name: 'collapsed',
      type: 'boolean',
    },
    {
      attribute: 'collapsible',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'A button at the bottom that folds the side nav into its rail and unfolds it.',
      name: 'collapsible',
      type: 'boolean',
    },
    {
      attribute: 'collapse-label',
      default: "'Collapse the menu'",
      description: 'The fold button’s text while the side nav is open.',
      name: 'collapseLabel',
      type: 'string',
    },
    {
      attribute: 'expand-label',
      default: "'Expand the menu'",
      description: 'Its hint while the side nav is a rail.',
      name: 'expandLabel',
      type: 'string',
    },
    {
      attribute: 'in-drawer',
      default: 'false',
      description:
        'Set by jl-app-shell while the side nav is its drawer: it shows whole there, and its fold button hides.',
      name: 'inDrawer',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "'Main'",
      description: 'The name of the navigation for screen readers.',
      name: 'label',
      type: 'string',
    },
  ],
  slots: [
    { description: 'Above the sections: a brand, a workspace switcher.', name: 'header' },
    { description: 'At the bottom: the account, a help link.', name: 'footer' },
  ],
  styling: [
    { description: 'The width when expanded (248px).', name: '--width' },
    { description: 'The width of the rail (60px).', name: '--rail-width' },
    { description: 'The nav element inside.', name: 'base' },
  ],
  summary: 'The navigation down the side of an app, with nested items and a collapsed rail.',
  tag: 'jl-side-nav',
};
