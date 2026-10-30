import type { ComponentDoc } from '../../types/docs.types';

const LINKS =
  '[{"label":"Overview","href":"#/components/navbar","active":true},{"label":"Projects","href":"#/components/navbar"},{"label":"Deployments","href":"#/components/navbar"},{"label":"Settings","href":"#/components/navbar"}]';

const BRAND = `<span slot="brand"><jl-icon name="rocket" size="20"></jl-icon>Orbit</span>`;

export const doc: ComponentDoc = {
  className: 'JlNavbar',
  description: `The bar at the top of an app or a site: the brand at the start (slot="brand"), the main links, and
actions at the end (slot="actions"): a sign-in button, a search, an avatar. Each link is { label, href, active? }; the
active one is the page people are on, in the accent colour.

The bar watches its own width, not the window's: narrower than 720 pixels, the links fold into a menu button that
opens them as a list under the bar, so the same navbar works in a full page and in a narrow column. sticky keeps it
at the top while the page scrolls.`,
  examples: [
    {
      html: `
        <jl-navbar links='${LINKS}'>
          ${BRAND}
          <jl-button slot="actions" variant="ghost" label="Sign in"></jl-button>
          <jl-button slot="actions" variant="primary" label="New project"></jl-button>
        </jl-navbar>`,
      title: 'Brand, links and actions',
    },
    {
      description: 'In a column narrower than 720 pixels, the links fold into the menu button: press it.',
      html: `
        <div class="narrow">
          <jl-navbar links='${LINKS}'>
            ${BRAND}
            <jl-button slot="actions" variant="primary" size="sm" label="New"></jl-button>
          </jl-navbar>
        </div>`,
      title: 'Folded links',
    },
    {
      description: 'Icon actions and no links: a bar for a single-page tool.',
      html: `
        <jl-navbar>
          ${BRAND}
          <jl-button slot="actions" variant="ghost" icon="search" hint="Search"></jl-button>
          <jl-button slot="actions" variant="ghost" icon="bell" hint="Notifications"></jl-button>
          <jl-button slot="actions" icon="user" hint="Account"></jl-button>
        </jl-navbar>`,
      title: 'Actions only',
    },
  ],
  level: 'organism',
  name: 'Navbar',
  playground: {
    attributes: { links: LINKS },
    content: `${BRAND}
<jl-button slot="actions" variant="primary" label="New project"></jl-button>`,
    width: 'full',
  },
  props: [
    {
      attribute: 'links',
      control: { kind: 'json' },
      default: '[]',
      description: 'The main links: { label, href, active? }.',
      name: 'links',
      type: 'NavbarLink[]',
    },
    {
      attribute: 'sticky',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Stays at the top of the window while the page scrolls.',
      name: 'sticky',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: "The navigation’s name for screen readers. Empty: jlib's own text, in the language shown.",
      name: 'label',
      type: 'string',
    },
  ],
  slots: [
    { description: 'The logo or the name of the app, at the start.', name: 'brand' },
    { description: 'Buttons, a search or an avatar, at the end.', name: 'actions' },
  ],
  styling: [
    { description: 'The header element of the bar.', name: 'base' },
    { description: 'The widest the bar’s content gets, centred (none).', name: '--max-width' },
  ],
  summary: 'The bar at the top of an app: brand, main links and actions, folding its links on a narrow width.',
  tag: 'jl-navbar',
};
