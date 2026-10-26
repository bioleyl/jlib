import type { JlButton, JlDrawer } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

/** Opens the drawer of an example when its button is pressed. */
function openOnPress(root: HTMLElement, buttonSelector: string, drawerSelector: string): void {
  const drawer = root.querySelector<JlDrawer>(drawerSelector);
  root.querySelector<JlButton>(buttonSelector)?.events.register('press', () => drawer?.show());
}

/** Closes the drawer when one of its footer buttons is pressed. */
function closeOnFooter(root: HTMLElement, drawerSelector: string): void {
  const drawer = root.querySelector<JlDrawer>(drawerSelector);
  for (const button of root.querySelectorAll<JlButton>(`${drawerSelector} jl-button[slot="footer"]`)) {
    button.events.register('press', () => drawer?.close());
  }
}

export const doc: ComponentDoc = {
  className: 'JlDrawer',
  description: `A drawer keeps the page in view while a task happens beside it: editing a record, filters, settings,
a navigation menu on a phone. It is a modal on the browser's own dialog element: the page behind is inert, focus
stays inside, Escape and a click on the backdrop close it (unless persistent).

It slides from the right by default, from the left for navigation, or from the bottom as a sheet, with rounded top
corners and a handle, which suits phones. The content scrolls between a fixed header and footer: the heading and
the actions slot at the top, the footer slot for the buttons at the bottom. People who ask for less motion see it
appear without sliding.`,
  events: [
    { description: 'The drawer opened.', detail: 'undefined', name: 'open' },
    {
      description: 'The drawer closed: a button, Escape, the backdrop or close().',
      detail: 'undefined',
      name: 'close',
    },
  ],
  examples: [
    {
      description: 'A small form, its buttons in the footer and a quiet action in the header.',
      html: `
        <div class="row">
          <jl-button class="open-profile" variant="primary" icon="pencil" label="Edit profile"></jl-button>
        </div>
        <jl-drawer class="profile" heading="Edit profile" description="Changes show on your public page.">
          <div class="stack">
            <jl-field label="Full name" required>
              <jl-input value="Ada Lovelace" required></jl-input>
            </jl-field>
            <jl-field label="Email" hint="Only members of your workspace see it.">
              <jl-input type="email" value="ada@example.com" icon="mail"></jl-input>
            </jl-field>
            <jl-field label="Website">
              <jl-input type="url" placeholder="https://" icon="globe"></jl-input>
            </jl-field>
          </div>
          <jl-button slot="actions" variant="ghost" icon="external-link" hint="View public page" size="sm"></jl-button>
          <jl-button slot="footer" label="Cancel"></jl-button>
          <jl-button slot="footer" variant="primary" label="Save changes"></jl-button>
        </jl-drawer>`,
      script: `
        const drawer = root.querySelector('jl-drawer.profile');
        root.querySelector('.open-profile').events.register('press', () => drawer.show());
        for (const button of drawer.querySelectorAll('jl-button[slot="footer"]')) {
          button.events.register('press', () => drawer.close());
        }`,
      setup: (root) => {
        openOnPress(root, '.open-profile', 'jl-drawer.profile');
        closeOnFooter(root, 'jl-drawer.profile');
      },
      title: 'A form in a drawer',
    },
    {
      description: 'From the left, narrow: a navigation menu.',
      html: `
        <div class="row">
          <jl-button class="open-menu" icon="menu" label="Menu"></jl-button>
        </div>
        <jl-drawer class="menu" placement="left" size="sm" heading="Acme workspace">
          <div class="stack">
            <jl-button variant="ghost" icon="house" label="Home"></jl-button>
            <jl-button variant="ghost" icon="inbox" label="Inbox"></jl-button>
            <jl-button variant="ghost" icon="users" label="Team"></jl-button>
            <jl-button variant="ghost" icon="settings" label="Settings"></jl-button>
          </div>
        </jl-drawer>`,
      setup: (root) => openOnPress(root, '.open-menu', 'jl-drawer.menu'),
      title: 'From the left',
    },
    {
      description: 'From the bottom, as a sheet: rounded top corners and a handle.',
      html: `
        <div class="row">
          <jl-button class="open-share" icon="share" label="Share"></jl-button>
        </div>
        <jl-drawer class="share" placement="bottom" size="sm" heading="Share board" description="Anyone with the link can view it.">
          <div class="stack">
            <jl-input value="https://acme.app/b/q3-roadmap" readonly icon="link"></jl-input>
            <div class="row">
              <jl-button icon="copy" label="Copy link"></jl-button>
              <jl-button icon="mail" label="Email"></jl-button>
            </div>
          </div>
        </jl-drawer>`,
      setup: (root) => openOnPress(root, '.open-share', 'jl-drawer.share'),
      title: 'Bottom sheet',
    },
    {
      description: 'Persistent and large: Escape and the backdrop do nothing; only its own buttons close it.',
      html: `
        <div class="row">
          <jl-button class="open-review" label="Review the import"></jl-button>
        </div>
        <jl-drawer class="review" size="lg" heading="Import 128 contacts" persistent>
          <p>Check the columns before importing: the first row of the file is used as headings.</p>
          <jl-button slot="footer" label="Back"></jl-button>
          <jl-button slot="footer" variant="primary" label="Import"></jl-button>
        </jl-drawer>`,
      setup: (root) => {
        openOnPress(root, '.open-review', 'jl-drawer.review');
        closeOnFooter(root, 'jl-drawer.review');
      },
      title: 'Persistent',
    },
  ],
  level: 'organism',
  methods: [
    { description: 'Opens the drawer.', name: 'show', signature: 'show(): void' },
    { description: 'Closes the drawer.', name: 'close', signature: 'close(): void' },
  ],
  name: 'Drawer',
  playground: {
    attributes: { description: 'Narrow the list of projects.', heading: 'Filters', placement: 'right' },
    content:
      '<p>The content of the drawer.</p>\n<jl-button slot="footer" label="Reset"></jl-button>\n<jl-button slot="footer" variant="primary" label="Apply"></jl-button>',
    setup: (element) => {
      const drawer = element as JlDrawer;
      const opener = document.createElement('jl-button') as JlButton;
      opener.setAttribute('label', 'Open the drawer');
      opener.setAttribute('variant', 'primary');
      opener.events.register('press', () => drawer.show());
      drawer.before(opener);
      for (const button of drawer.querySelectorAll<JlButton>('jl-button')) {
        button.events.register('press', () => drawer.close());
      }
    },
  },
  props: [
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'The title.',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'description',
      control: { kind: 'text' },
      default: "''",
      description: 'A sentence under the title.',
      name: 'description',
      type: 'string',
    },
    {
      attribute: 'placement',
      control: { kind: 'select', options: ['right', 'left', 'bottom'] },
      default: "'right'",
      description: 'The edge it slides from.',
      name: 'placement',
      type: "'right' | 'left' | 'bottom'",
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The width: 320, 420 or 640 pixels; from the bottom, at most 40%, 60% or 88% of the height.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'open',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Whether it is open.',
      name: 'open',
      type: 'boolean',
    },
    {
      attribute: 'persistent',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Escape and the backdrop do not close it, and it has no close button.',
      name: 'persistent',
      type: 'boolean',
    },
  ],
  slots: [
    { description: 'The content; it scrolls between the header and the footer.', name: '' },
    { description: 'Buttons in the header, before the close button.', name: 'actions' },
    { description: 'The buttons at the bottom, on the right.', name: 'footer' },
  ],
  styling: [
    { description: 'The native dialog element.', name: 'base' },
    { description: 'The width (the maximum height from the bottom), set by size.', name: '--size' },
  ],
  summary:
    'A panel that slides over the page from an edge, for a task beside the page rather than in place of it.',
  tag: 'jl-drawer',
};
