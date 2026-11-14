import { SIDE_NAV_COLLAPSIBLES } from '@syware/jlib';

import sideNavCode from '../typing/jl-side-nav.code.ts?raw';
import sideNavJsx from '../typing/jl-side-nav.jsx.tsx?raw';

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
          { id: 'design-system', label: 'Design system and its documentation site' },
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

// A header for the side navs that fold: the page hides its name in the rail (jl-side-nav[rail]).
const BRAND = `
              <div slot="header" class="brand">
                <jl-icon name="rocket" size="18"></jl-icon><span class="brand-name">Launchpad</span>
              </div>
            `;
const FRAME = 'height: 540px; border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg)';

export const doc: ComponentDoc = {
  className: 'JlSideNav',
  description: `The navigation down the side of an app: sections under small headings, items with an icon and a badge,
and items with children that open with a chevron. value is the active item: it is drawn in the accent colour, and
the parents above it open to show it.

collapsed turns it into a rail of icons, for when the content needs the room: the labels become tooltips (and stay
for screen readers), badges become dots, and a parent leads to its first child. collapsible lets people do it: handle
makes the side nav's edge the control, a short grip that lights the whole edge under the pointer, to drag towards the
fold and back in one move (a press alone does nothing; from the keyboard, Enter folds it); button puts a quiet
icon button at its bottom; knob stands a small round button on the edge line, under the header, its chevron pointing
where the side nav will go. none, the default, gives no control: the app folds it with one of its own, setting collapsed. Whatever
collapsible is, hotkey names keys that fold and unfold it from anywhere in the page (mod+b: Ctrl+B, ⌘B on a Mac);
there are none until the app names some. collapse says
so for the app to remember it on the device. In the drawer of a narrow jl-app-shell, the side nav shows whole, without
the handle or the keys. While it shows
as a rail, the host carries the rail attribute, for styles around it: jl-side-nav[rail].

Every item is a link (with an href) or a button, so the Tab key reaches it; Up and Down move between the visible
items, Right opens a parent and Left closes it. Items without an href fire select; put the side nav in the nav slot
of jl-app-shell for the whole frame. A list longer than the nav scrolls between the header slot and the bottom, which
stay in place.`,
  events: [
    { description: 'An item was chosen: its id.', detail: 'Id', name: 'select' },
    {
      description:
        'People folded the side nav into its rail (true) or unfolded it (false), with its handle or its keys.',
      detail: 'boolean',
      name: 'collapse',
    },
  ],
  examples: [
    {
      description:
        'Badges, a nested group, and the active item inside it; a label too long for the nav ends in “…”.',
      html: `
        <div style="${FRAME}; width: 260px">
          <jl-side-nav value="mobile-app" sections='${SECTIONS}'></jl-side-nav>
        </div>`,
      title: 'Sections and nesting',
    },
    {
      description:
        'collapsible="handle" with hotkey="mod+b": a drag of its edge, or Ctrl+B, folds it into a rail of icons (hover one for its label), and unfolds it. The second has collapsible="button": an icon button at its bottom instead; the third collapsible="knob": a round button on its edge line, under the header. The page hides the header’s name in the rail.',
      html: `
        <style>
          /* A set height: the items stand at the same place whether the name shows or not. */
          .brand { display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 10px; font-weight: 700; }
          /* Folded into its rail, the side nav keeps the brand's icon alone, over the items' icons. */
          jl-side-nav[rail] .brand { justify-content: center; padding-inline: 0; }
          jl-side-nav[rail] .brand-name { display: none; }
        </style>
        <div class="row" style="align-items: start">
          <div style="${FRAME}">
            <jl-side-nav collapsible="handle" hotkey="mod+b" collapsed value="inbox" sections='${SECTIONS}'>${BRAND}</jl-side-nav>
          </div>
          <div style="${FRAME}">
            <jl-side-nav collapsible="button" value="inbox" sections='${SECTIONS}'>${BRAND}</jl-side-nav>
          </div>
          <div style="${FRAME}">
            <jl-side-nav collapsible="knob" value="inbox" sections='${SECTIONS}'>${BRAND}</jl-side-nav>
          </div>
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
      type: 'SideNavSection<Id>[]',
    },
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The id of the active item.',
      name: 'value',
      type: "Id | ''",
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
      control: { kind: 'select', options: SIDE_NAV_COLLAPSIBLES },
      default: "'none'",
      description:
        'What people fold the side nav into its rail with: none (the app sets collapsed itself), an icon button at its bottom, a handle along its edge, or a round knob on its edge line under the header. The attribute written bare gives the handle.',
      name: 'collapsible',
      type: "'none' | 'button' | 'handle' | 'knob'",
    },
    {
      attribute: 'collapse-label',
      default: "''",
      description:
        "What the handle says (its hint, and to screen readers) while the side nav is open. Empty: jlib's own text, in the language shown.",
      name: 'collapseLabel',
      type: 'string',
    },
    {
      attribute: 'expand-label',
      default: "''",
      description: "What it says while the side nav is a rail. Empty: jlib's own text, in the language shown.",
      name: 'expandLabel',
      type: 'string',
    },
    {
      attribute: 'hotkey',
      default: "''",
      description:
        'Keys that fold and unfold it from anywhere in the page, whatever collapsible is: mod+b is ⌘B on a Mac and Ctrl+B elsewhere. Empty (or none): no keys. The control’s hint names them. Of several side navs with keys in a page, the first takes the press.',
      name: 'hotkey',
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
      default: "''",
      description: "The name of the navigation for screen readers. Empty: jlib's own text, in the language shown.",
      name: 'label',
      type: 'string',
    },
  ],
  slots: [
    {
      description: 'Above the sections, and stays there while they scroll: a brand, a workspace switcher.',
      name: 'header',
    },
    {
      description: 'At the bottom, and stays there while the sections scroll: the account, a help link.',
      name: 'footer',
    },
  ],
  styling: [
    { description: 'The width when expanded (248px).', name: '--width' },
    { description: 'The width of the rail (60px).', name: '--rail-width' },
    { description: 'The nav element inside.', name: 'base' },
  ],
  summary: 'The navigation down the side of an app, with nested items and a collapsed rail.',
  tag: 'jl-side-nav',
  typing: {
    code: sideNavCode,
    description:
      "Typed by its ids, JlSideNav<'jobs' | 'people' | 'teams' | 'settings'> takes items of those ids only, nested ones included, and gives select and value as one of them: the editor completes them and refuses another.",
    jsx: sideNavJsx,
  },
};
