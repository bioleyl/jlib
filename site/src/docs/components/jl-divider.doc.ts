import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlDivider',
  description: `A divider separates groups that belong to the same surface: sections of a form, items of a menu, the
buttons of a toolbar. Between surfaces, a card's border or some space usually reads better.

It is a separator for screen readers, named by its label when it has one.`,
  examples: [
    {
      html: `
        <div class="stack narrow">
          <span>Profile</span>
          <jl-divider></jl-divider>
          <span>Notifications</span>
        </div>`,
      title: 'A line',
    },
    {
      description: 'A word on the line; at the start or the end, it reads as a section heading.',
      html: `
        <div class="stack narrow">
          <jl-divider label="or"></jl-divider>
          <jl-divider label="Today" align="start"></jl-divider>
          <jl-divider label="Earlier" align="end"></jl-divider>
        </div>`,
      title: 'With a label',
    },
    {
      description: 'Up and down, between items of a row: it takes the height of the row.',
      html: `
        <div class="row">
          <jl-button variant="ghost" size="sm" icon="pencil" hint="Edit"></jl-button>
          <jl-button variant="ghost" size="sm" icon="copy" hint="Duplicate"></jl-button>
          <jl-divider vertical></jl-divider>
          <jl-button variant="ghost" size="sm" icon="trash" hint="Delete"></jl-button>
          <jl-divider vertical></jl-divider>
          <span class="muted">Saved 2 min ago</span>
        </div>`,
      title: 'Vertical',
    },
    {
      description: 'The usual place of a labelled divider: between two ways to sign in.',
      html: `
        <div class="stack narrow">
          <jl-button icon="globe" label="Continue with SSO" block></jl-button>
          <jl-divider label="or"></jl-divider>
          <jl-input type="email" placeholder="you@company.com" label="Email"></jl-input>
          <jl-button variant="primary" label="Continue with email" block></jl-button>
        </div>`,
      title: 'In a form',
    },
  ],
  level: 'atom',
  name: 'Divider',
  playground: { attributes: { label: 'or' } },
  props: [
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'A word on the line.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'vertical',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Up and down, for rows.',
      name: 'vertical',
      type: 'boolean',
    },
    {
      attribute: 'align',
      control: { kind: 'select', options: ['center', 'start', 'end'] },
      default: "'center'",
      description: 'Where the label sits.',
      name: 'align',
      type: "'start' | 'center' | 'end'",
    },
  ],
  styling: [
    { description: 'The separator.', name: 'base' },
    { description: 'The line colour.', name: '--color' },
    { description: 'The line width.', name: '--thickness' },
    { description: 'The space between the line and the label.', name: '--gap' },
  ],
  summary: 'A line between groups of content, across or up and down, with an optional label.',
  tag: 'jl-divider',
};
