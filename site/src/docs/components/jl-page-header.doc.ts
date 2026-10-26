import type { ComponentDoc } from '../../types/docs.types';

const BREADCRUMB = `<nav slot="breadcrumb" aria-label="Breadcrumb" class="row" style="gap: 6px">
            <jl-link href="#/components" label="Projects" variant="muted"></jl-link>
            <jl-icon name="chevron-right" size="14"></jl-icon>
            <jl-link href="#/components/page-header" label="Apollo" variant="muted"></jl-link>
            <jl-icon name="chevron-right" size="14"></jl-icon>
            <span aria-current="page">Settings</span>
          </nav>`;

export const doc: ComponentDoc = {
  className: 'JlPageHeader',
  description: `The page header opens a page: its heading (an h1) and what it is for, a breadcrumb above, the page's
actions beside the heading and a row of badges or facts under the description. On a phone, the actions wrap under
the heading.

divided draws a line under it, between the header and the content.`,
  examples: [
    {
      html: `
        <jl-page-header heading="Invoices" description="Every invoice sent to your customers, paid or not.">
          <jl-button slot="actions" icon="download" label="Export"></jl-button>
          <jl-button slot="actions" variant="primary" icon="plus" label="New invoice"></jl-button>
        </jl-page-header>`,
      title: 'Heading and actions',
    },
    {
      description: 'A breadcrumb above, badges and facts under the description, and a line under it all.',
      html: `
        <jl-page-header heading="Project settings" description="Who can open Apollo, how it deploys, and where its data lives." divided>
          ${BREADCRUMB}
          <jl-button slot="actions" variant="ghost" icon="share" label="Share"></jl-button>
          <jl-button slot="actions" variant="primary" label="Save changes"></jl-button>
          <jl-badge slot="meta" tone="ok" label="Live" dot></jl-badge>
          <jl-badge slot="meta" label="Pro plan"></jl-badge>
          <span slot="meta" class="muted">Updated 3 hours ago by Ada</span>
        </jl-page-header>`,
      title: 'Complete',
    },
    {
      description: 'A team: its avatars in the meta row, and actions that wrap on narrow screens.',
      html: `
        <jl-page-header heading="Design team" description="Five people who own the product's look, from tokens to illustrations.">
          <jl-avatar-group slot="meta" size="sm" max="4" items='[{"name":"Ada Lovelace"},{"name":"Grace Hopper"},{"name":"Alan Turing"},{"name":"Radia Perlman"},{"name":"Ken Thompson"}]'></jl-avatar-group>
          <jl-button slot="actions" icon="plus" label="Invite"></jl-button>
          <jl-button slot="actions" variant="ghost" icon="settings" hint="Team settings"></jl-button>
        </jl-page-header>`,
      title: 'With people',
    },
  ],
  level: 'organism',
  name: 'Page header',
  playground: {
    attributes: {
      description: 'Every invoice sent to your customers, paid or not.',
      divided: true,
      heading: 'Invoices',
    },
    content: `<jl-button slot="actions" icon="download" label="Export"></jl-button>
<jl-button slot="actions" variant="primary" icon="plus" label="New invoice"></jl-button>
<jl-badge slot="meta" tone="accent" label="128 this month"></jl-badge>`,
    width: 'full',
  },
  props: [
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'The title of the page, as its h1.',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'description',
      control: { kind: 'text' },
      default: "''",
      description: 'What the page is for, under the heading.',
      name: 'description',
      type: 'string',
    },
    {
      attribute: 'divided',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'A line under the header.',
      name: 'divided',
      type: 'boolean',
    },
  ],
  slots: [
    { description: 'A breadcrumb or a back link, above the heading.', name: 'breadcrumb' },
    { description: "The page's buttons, beside the heading (under it on a phone).", name: 'actions' },
    { description: 'Badges and facts in a row under the description.', name: 'meta' },
  ],
  styling: [{ description: 'The header.', name: 'base' }],
  summary: 'The top of a page: breadcrumb, heading, description, actions and a row of badges.',
  tag: 'jl-page-header',
};
