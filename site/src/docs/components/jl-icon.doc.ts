import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlIcon',
  description: `Icons come from lucide and follow the text colour, so they take the tone of whatever holds them. About eighty
names are built in (see the Icons page); add any other lucide icon with registerIcons.

An icon is decorative by default and hidden from screen readers. Give it a label only when it carries meaning on
its own, with no text beside it.`,
  examples: [
    {
      html: `
        <div class="row">
          <jl-icon name="house"></jl-icon>
          <jl-icon name="search"></jl-icon>
          <jl-icon name="settings"></jl-icon>
          <jl-icon name="bell"></jl-icon>
          <jl-icon name="user"></jl-icon>
          <jl-icon name="mail"></jl-icon>
          <jl-icon name="calendar"></jl-icon>
          <jl-icon name="heart"></jl-icon>
        </div>`,
      title: 'Built-in icons',
    },
    {
      html: `
        <div class="row">
          <jl-icon name="rocket" size="14"></jl-icon>
          <jl-icon name="rocket" size="18"></jl-icon>
          <jl-icon name="rocket" size="24"></jl-icon>
          <jl-icon name="rocket" size="32"></jl-icon>
        </div>`,
      title: 'Sizes',
    },
    {
      description: 'An icon takes the colour of its text: set color on it or on what holds it.',
      html: `
        <div class="row">
          <jl-icon name="circle-check" size="20" style="color: var(--jl-ok)"></jl-icon>
          <jl-icon name="triangle-alert" size="20" style="color: var(--jl-warn)"></jl-icon>
          <jl-icon name="circle-x" size="20" style="color: var(--jl-danger)"></jl-icon>
          <jl-icon name="info" size="20" style="color: var(--jl-accent)"></jl-icon>
        </div>`,
      title: 'Colour',
    },
    {
      description: 'With a label, the icon is an image with a name for screen readers.',
      html: `<jl-icon name="lock" label="Private" size="20"></jl-icon>`,
      title: 'Meaningful icon',
    },
  ],
  level: 'atom',
  methods: [
    {
      description: 'Adds icons by name to the ones every jl-icon knows. Import it from jlib.',
      name: 'registerIcons',
      signature: 'registerIcons(icons: Record<string, IconNode>): void',
    },
  ],
  name: 'Icon',
  playground: { attributes: { name: 'sparkles', size: '24' } },
  props: [
    {
      attribute: 'name',
      control: { kind: 'text' },
      default: "''",
      description: 'The icon to draw. An unknown name draws a neutral mark.',
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'number', max: 64, min: 10, step: 2 },
      default: '16',
      description: 'Width and height, in pixels.',
      name: 'size',
      type: 'number',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'What screen readers say. Without it the icon is decorative.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'filled',
      control: { kind: 'boolean' },
      default: 'false',
      description:
        'A sign in a shape (circle-check, circle-x, info, triangle-alert) drawn as a solid badge: the shape in the colour, the sign cut out of it.',
      name: 'filled',
      type: 'boolean',
    },
  ],
  styling: [{ description: 'The colour of the sign of a filled icon: the surface colour.', name: '--cutout' }],
  summary: 'A lucide icon by name, sized in pixels and coloured by its text.',
  tag: 'jl-icon',
};
