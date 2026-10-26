import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlLink',
  description: `A link is the browser's own <a>, styled: it goes somewhere, where a button does something. In running
text, keep the default variant: its underline tells it apart without colour. quiet suits lists and cards, where
the context says it is a link; muted suits footers and secondary navigation.

external opens the page in a new tab, without giving it a handle on this one (rel="noopener noreferrer"), and says
so with an icon and, for screen readers, with words.`,
  examples: [
    {
      html: `
        <div class="row">
          <jl-link href="#/components/link" label="Default"></jl-link>
          <jl-link href="#/components/link" label="Quiet" variant="quiet"></jl-link>
          <jl-link href="#/components/link" label="Muted" variant="muted"></jl-link>
        </div>`,
      title: 'Variants',
    },
    {
      description: 'Opens in a new tab, safely, with an icon that says so.',
      html: `
        <div class="row">
          <jl-link href="https://github.com/bioleyl/jadis" label="Jadis on GitHub" external></jl-link>
          <jl-link href="https://lucide.dev" label="Lucide icons" variant="quiet" external></jl-link>
        </div>`,
      title: 'External',
    },
    {
      description: 'Links take the size of the text around them.',
      html: `
        <p>jlib is built on <jl-link href="https://github.com/bioleyl/jadis" external>Jadis</jl-link>, a thin layer over
        native Web Components. Read the <jl-link href="#/getting-started">getting started guide</jl-link>, then browse
        <jl-link href="#/components">all components</jl-link>.</p>`,
      title: 'In text',
    },
    {
      html: `
        <div class="row muted">
          <span>© 2026 jlib</span>
          <jl-link href="#/" label="Privacy" variant="muted"></jl-link>
          <jl-link href="#/" label="Terms" variant="muted"></jl-link>
          <jl-link href="#/" label="Status" variant="muted"></jl-link>
        </div>`,
      title: 'In a footer',
    },
  ],
  level: 'atom',
  name: 'Link',
  playground: { attributes: { href: 'https://github.com/bioleyl/jadis', label: 'Read the docs' } },
  props: [
    {
      attribute: 'href',
      control: { kind: 'text' },
      default: "''",
      description: 'Where it goes.',
      name: 'href',
      type: 'string',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The text, when there is no slotted content.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'variant',
      control: { kind: 'select', options: ['default', 'quiet', 'muted'] },
      default: "'default'",
      description: 'Underlined accent, accent underlined on hover, or secondary text.',
      name: 'variant',
      type: "'default' | 'quiet' | 'muted'",
    },
    {
      attribute: 'external',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Opens in a new tab with rel="noopener noreferrer", and shows an icon.',
      name: 'external',
      type: 'boolean',
    },
    {
      attribute: 'target',
      control: { kind: 'text' },
      default: "''",
      description: 'Where it opens, as the target of an <a>; external links default to _blank.',
      name: 'target',
      type: 'string',
    },
  ],
  slots: [{ description: 'The text, with markup if needed.', name: '' }],
  styling: [
    { description: 'The <a> inside.', name: 'base' },
    { description: 'The text colour.', name: '--color' },
    { description: 'The text colour under the pointer.', name: '--hover' },
    { description: 'The underline colour at rest.', name: '--underline' },
  ],
  summary: 'A link in text, a list or a footer, with safe external links.',
  tag: 'jl-link',
};
