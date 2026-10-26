import type { ComponentDoc } from '../../types/docs.types';

const ORDERS = `
          <jl-list-item heading="Order #3" description="Sara Monnier · 3 articles" meta="18 h ago" href="#">
            <jl-badge slot="end" tone="info" icon="inbox" label="Sent"></jl-badge>
          </jl-list-item>
          <jl-list-item heading="Order #2" description="Tom Berset · 3 articles" meta="19 h ago" href="#">
            <jl-badge slot="end" tone="ok" icon="check" label="Ready"></jl-badge>
          </jl-list-item>`;

export const doc: ComponentDoc = {
  className: 'JlPage',
  description: `A page is what a route of an app shows: its header, then its content. The header holds a back link
named after the page it leads to ("← Orders", never "← Back"), the heading, a sentence on what the page is for (or,
for one thing, the facts that identify it), its status in the meta slot, and its actions.

The content is centred at one of four widths, from the tokens: form (720px) for a column of fields, standard
(1120px) for most pages, wide (1400px) for tables and grids, and full for work surfaces. The padding shrinks on a
narrow screen.

With app-name, the page names the browser tab after its heading, the most specific first: "Order #3 · swstock". Set
the heading once the subject has loaded, and the tab follows. See the Page layout and Navigation patterns.`,
  events: [{ description: 'The back link was followed.', detail: 'undefined', name: 'back' }],
  examples: [
    {
      description: 'A collection: the heading, what it is for, and the one primary action.',
      html: `
        <jl-page heading="Orders" description="Prepare, hand over, keep track." style="border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg)">
          <jl-button slot="actions" variant="primary" icon="plus" label="New order"></jl-button>
          <div style="border: 1px solid var(--jl-line); border-radius: var(--jl-radius)">${ORDERS}
          </div>
        </jl-page>`,
      title: 'A list page',
    },
    {
      description: 'One thing: a back link named after its list, the facts and the status under the heading.',
      html: `
        <jl-page heading="Order #3" description="Job CH-2026-0160 · Sara Monnier · 25 Oct, 22:47" back="#" back-label="Orders" style="border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg)">
          <jl-badge slot="meta" tone="info" icon="inbox" label="Sent" hint="Waiting for logistics to prepare it."></jl-badge>
          <jl-button slot="actions" icon="circle-x" label="Cancel order"></jl-button>
          <jl-button slot="actions" variant="primary" icon="list" label="Prepare"></jl-button>
          <jl-card heading="Articles">
            <p class="muted">Bornes Wago 221-413 · 2 boxes</p>
          </jl-card>
        </jl-page>`,
      title: 'A page of one thing',
    },
    {
      description: 'width="form": a column of fields, the heading over them.',
      html: `
        <jl-page heading="My account" width="form" style="border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg)">
          <jl-field label="Name"><jl-input value="Marie Rochat"></jl-input></jl-field>
          <jl-field label="Email"><jl-input type="email" value="marie@alpine.local"></jl-input></jl-field>
          <div><jl-button variant="primary" label="Save"></jl-button></div>
        </jl-page>`,
      title: 'A form',
    },
  ],
  level: 'template',
  name: 'Page',
  playground: {
    attributes: {
      back: '#',
      'back-label': 'Orders',
      description: 'Job CH-2026-0160 · Sara Monnier · 25 Oct, 22:47',
      heading: 'Order #3',
      width: 'standard',
    },
    content: `<jl-badge slot="meta" tone="info" icon="inbox" label="Sent"></jl-badge>
<jl-button slot="actions" variant="primary" label="Prepare"></jl-button>
<p class="muted">The content of the page.</p>`,
    width: 'full',
  },
  props: [
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'The name of the thing or of the collection: "Order #3", "Orders".',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'description',
      control: { kind: 'text' },
      default: "''",
      description: 'One sentence on what the page is for, or the facts that identify its subject.',
      name: 'description',
      type: 'string',
    },
    {
      attribute: 'width',
      control: { kind: 'select', options: ['standard', 'form', 'wide', 'full'] },
      default: "'standard'",
      description: 'The widest the page gets: --jl-page-standard, --jl-page-form, --jl-page-wide, or all of it.',
      name: 'width',
      type: "'standard' | 'form' | 'wide' | 'full'",
    },
    {
      attribute: 'back',
      control: { kind: 'text' },
      default: "''",
      description: 'Where the back link leads; no back link without it.',
      name: 'back',
      type: 'string',
    },
    {
      attribute: 'back-label',
      control: { kind: 'text' },
      default: "''",
      description: 'The name of the page it leads to: "Orders". "Back" when missing, which says less.',
      name: 'backLabel',
      type: 'string',
    },
    {
      attribute: 'app-name',
      default: "''",
      description:
        'The app\'s name: the page then writes document.title, "Order #3 · swstock". Without it, the tab keeps its title.',
      name: 'appName',
      type: 'string',
    },
  ],
  slots: [
    { description: 'The content of the page.', name: '' },
    { description: "The page's actions, beside the heading: the primary last.", name: 'actions' },
    { description: 'The status and the facts, under the description.', name: 'meta' },
    { description: 'A breadcrumb for deeper pages, in place of or beside the back link.', name: 'breadcrumb' },
  ],
  styling: [
    { description: 'The column that holds the header and the content.', name: 'base' },
    { description: 'The widest the page gets; the width attribute sets it.', name: '--page-width' },
  ],
  summary: 'A page of an app: its header with a named back link, then its content at one of four widths.',
  tag: 'jl-page',
};
