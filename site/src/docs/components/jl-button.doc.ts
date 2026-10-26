import type { JlButton } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlButton',
  description: `Use primary for the one action a view is about, secondary (the default) for the others, ghost for
quiet actions in toolbars and lists, and danger for what destroys data.

Listen to press rather than click: it only fires while the button can be pressed, so a disabled or loading
button never runs its action. In a form, type="submit" and type="reset" act on the form around the button, even
across shadow roots.`,
  events: [
    { description: 'The button was pressed while enabled and not loading.', detail: 'undefined', name: 'press' },
  ],
  examples: [
    {
      html: `
        <div class="row">
          <jl-button variant="primary" label="Save changes"></jl-button>
          <jl-button label="Cancel"></jl-button>
          <jl-button variant="ghost" label="Learn more"></jl-button>
          <jl-button variant="danger" label="Delete"></jl-button>
        </div>`,
      title: 'Variants',
    },
    {
      description: 'sm in dense panels, md by default, lg where a thumb presses it.',
      html: `
        <div class="row">
          <jl-button size="sm" label="Small"></jl-button>
          <jl-button label="Medium"></jl-button>
          <jl-button size="lg" label="Large"></jl-button>
        </div>`,
      title: 'Sizes',
    },
    {
      description: 'An icon before or after the label; with an icon alone, the hint names the button.',
      html: `
        <div class="row">
          <jl-button variant="primary" icon="plus" label="New project"></jl-button>
          <jl-button icon-end="arrow-right" label="Continue"></jl-button>
          <jl-button variant="ghost" icon="settings" hint="Settings"></jl-button>
          <jl-button icon="trash" hint="Delete" variant="danger"></jl-button>
        </div>`,
      title: 'With icons',
    },
    {
      description: 'While loading, a spinner replaces the icon and presses are ignored.',
      html: `
        <div class="row">
          <jl-button variant="primary" label="Saving" loading></jl-button>
          <jl-button label="Disabled" disabled></jl-button>
          <jl-button class="demo-load" icon="refresh" label="Press to load"></jl-button>
        </div>`,
      script: `
        const button = root.querySelector('.demo-load');
        button.events.register('press', () => {
          button.loading.set(true);
          setTimeout(() => button.loading.set(false), 1500);
        });`,
      setup: (root) => {
        const button = root.querySelector<JlButton>('.demo-load');
        button?.events.register('press', () => {
          button.loading.set(true);
          setTimeout(() => button.loading.set(false), 1500);
        });
      },
      title: 'Loading and disabled',
    },
    {
      html: `<jl-button variant="primary" label="Create account" block></jl-button>`,
      title: 'Full width',
    },
  ],
  level: 'atom',
  name: 'Button',
  playground: {
    attributes: { label: 'Save changes', variant: 'primary' },
  },
  props: [
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The text.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'variant',
      control: { kind: 'select', options: ['secondary', 'primary', 'ghost', 'danger'] },
      default: "'secondary'",
      description: 'The look, by importance.',
      name: 'variant',
      type: "'secondary' | 'primary' | 'ghost' | 'danger'",
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The height: 30, 36 or 44 pixels.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "''",
      description: 'An icon name, drawn before the label.',
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'icon-end',
      control: { kind: 'text' },
      default: "''",
      description: 'An icon name, drawn after the label.',
      name: 'iconEnd',
      type: 'string',
    },
    {
      attribute: 'hint',
      control: { kind: 'text' },
      default: "''",
      description: 'The tooltip, and the accessible name of a button with only an icon.',
      name: 'hint',
      type: 'string',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Cannot be pressed.',
      name: 'disabled',
      type: 'boolean',
    },
    {
      attribute: 'loading',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shows a spinner and ignores presses.',
      name: 'loading',
      type: 'boolean',
    },
    {
      attribute: 'block',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Takes the whole width.',
      name: 'block',
      type: 'boolean',
    },
    {
      attribute: 'type',
      control: { kind: 'select', options: ['button', 'submit', 'reset'] },
      default: "'button'",
      description: 'What it does in a form.',
      name: 'type',
      type: "'button' | 'submit' | 'reset'",
    },
  ],
  slots: [{ description: 'Rich content for the label, when text is not enough.', name: '' }],
  styling: [{ description: 'The native button inside.', name: 'base' }],
  summary: 'A button for actions, from the main one of a page to quiet ones in a toolbar.',
  tag: 'jl-button',
};
