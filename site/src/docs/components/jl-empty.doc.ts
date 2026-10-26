import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlEmpty',
  description: `An empty state replaces a list, a table or a page that has nothing to show yet. It says why, in a
sentence, and offers the way out: the button that creates the first item, or clears the filters that hid them all.

md suits a page or a section; sm suits a card or a panel.`,
  examples: [
    {
      html: `
        <jl-empty icon="folder" heading="No projects yet" description="Projects keep your pages, files and people together. Create one to start.">
          <jl-button variant="primary" icon="plus" label="New project"></jl-button>
          <jl-button label="Import"></jl-button>
        </jl-empty>`,
      title: 'A first use',
    },
    {
      description: 'When filters hide everything, offer to clear them.',
      html: `
        <jl-empty icon="search" heading="No results for “invoice 2019”" description="Check the spelling, or search all folders.">
          <jl-button variant="ghost" label="Clear the search"></jl-button>
        </jl-empty>`,
      title: 'No results',
    },
    {
      description: 'sm, inside a card.',
      html: `
        <jl-card class="narrow" heading="Notifications">
          <jl-empty size="sm" icon="bell" heading="You are all caught up" description="New mentions and replies show here."></jl-empty>
        </jl-card>`,
      title: 'Small, in a card',
    },
  ],
  level: 'molecule',
  name: 'Empty state',
  playground: {
    attributes: {
      description: 'Projects keep your pages, files and people together.',
      heading: 'No projects yet',
      icon: 'folder',
    },
    content: '<jl-button variant="primary" icon="plus" label="New project"></jl-button>',
    width: 440,
  },
  props: [
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "'inbox'",
      description: 'The icon in the circle; none shows no icon.',
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'What is empty, or why.',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'description',
      control: { kind: 'text' },
      default: "''",
      description: 'A sentence that says what to do.',
      name: 'description',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['md', 'sm'] },
      default: "'md'",
      description: 'md for a page or a section, sm for a card or a panel.',
      name: 'size',
      type: "'sm' | 'md'",
    },
  ],
  slots: [{ description: 'The buttons that fill it.', name: '' }],
  styling: [{ description: 'The empty state.', name: 'base' }],
  summary: 'What a list, a table or a page shows when it has nothing yet, and the way to fill it.',
  tag: 'jl-empty',
};
