import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlAccountButton',
  description: `The account button shows the person signed in, where an app's frame keeps them: at the foot of the
side nav on a computer, in the top bar on a phone. Their avatar, their name, and a line under it, usually their role.

With an href it is a link to their account page; without one it is a button that fires press, to open a menu
(My account, Sign out). compact keeps the avatar alone, the name as its tooltip. See the Navigation pattern.`,
  events: [{ description: 'It was pressed, or its link followed.', detail: 'undefined', name: 'press' }],
  examples: [
    {
      description: 'At the foot of a side nav, a link to My account.',
      html: `
        <div style="width: 240px; padding: 8px; border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg)">
          <jl-account-button name="Marie Rochat" description="Administrator" href="#"></jl-account-button>
        </div>`,
      title: 'In a side nav',
    },
    {
      description: 'compact, in the top bar of a phone.',
      html: `
        <div class="row" style="justify-content: space-between; width: 320px; padding: 8px 12px; border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg)">
          <strong>swstock</strong>
          <span class="row" style="gap: 4px">
            <jl-search-button compact></jl-search-button>
            <jl-account-button name="Sara Monnier" description="Employee" compact href="#"></jl-account-button>
          </span>
        </div>`,
      title: 'Compact',
    },
  ],
  level: 'molecule',
  name: 'Account button',
  playground: {
    attributes: { compact: false, description: 'Administrator', href: '#', name: 'Marie Rochat', src: '' },
    width: 240,
  },
  props: [
    {
      attribute: 'name',
      control: { kind: 'text' },
      default: "''",
      description: 'Their name; their initials make the avatar without a picture.',
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'description',
      control: { kind: 'text' },
      default: "''",
      description: 'The line under the name: their role, their company.',
      name: 'description',
      type: 'string',
    },
    {
      attribute: 'src',
      control: { kind: 'text' },
      default: "''",
      description: 'Their picture.',
      name: 'src',
      type: 'string',
    },
    {
      attribute: 'href',
      control: { kind: 'text' },
      default: "''",
      description: 'Their account page: the button becomes a link.',
      name: 'href',
      type: 'string',
    },
    {
      attribute: 'compact',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The avatar alone.',
      name: 'compact',
      type: 'boolean',
    },
  ],
  styling: [{ description: 'The button, or the link.', name: 'base' }],
  summary: 'The person signed in, in the frame of an app: avatar, name and role, opening their account.',
  tag: 'jl-account-button',
};
