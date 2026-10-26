import type { JlRating } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const WORDS = ['No rating', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export const doc: ComponentDoc = {
  className: 'JlRating',
  description: `A score out of a few stars (or hearts, or any icon). A click sets it, and a click on the score already
given clears it; hovering shows the score a click would give. From the keyboard it is a slider: the arrows add or
take one, Home and End go to the ends, a digit sets that many.

Use readonly to show a score people cannot change, such as an average. The filled icons take the accent colour;
set --color on the element for another.`,
  events: [{ description: 'People gave a score, or cleared it (0).', detail: 'number', name: 'change' }],
  examples: [
    {
      html: `
        <div class="stack">
          <jl-rating size="sm" value="2" label="Small"></jl-rating>
          <jl-rating value="3" label="Medium"></jl-rating>
          <jl-rating size="lg" value="4" label="Large"></jl-rating>
        </div>`,
      title: 'Sizes',
    },
    {
      description: 'A score to read, not to give: the icons do not react.',
      html: `
        <div class="row">
          <jl-rating value="4" readonly label="Average rating"></jl-rating>
          <span class="muted">4.2 out of 5 · 128 reviews</span>
        </div>`,
      title: 'Read only',
    },
    {
      description: 'Any icon, any length of scale, any colour through --color.',
      html: `
        <div class="stack">
          <jl-rating icon="heart" value="3" label="Love it" style="--color: var(--jl-danger)"></jl-rating>
          <jl-rating icon="zap" max="10" value="7" size="sm" label="Energy"></jl-rating>
        </div>`,
      title: 'Other icons and scales',
    },
    {
      description: 'The word follows change; press the chosen star again to clear it.',
      html: `
        <div class="row">
          <jl-rating class="demo-review" value="3" label="Your review"></jl-rating>
          <span class="muted demo-review-out">Good</span>
        </div>`,
      script: `
        const words = ['No rating', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
        const rating = root.querySelector('.demo-review');
        const out = root.querySelector('.demo-review-out');
        rating.events.register('change', (value) => {
          out.textContent = words[value];
        });`,
      setup: (root) => {
        const rating = root.querySelector<JlRating>('.demo-review');
        const out = root.querySelector('.demo-review-out');
        rating?.events.register('change', (value) => {
          if (out !== null) {
            out.textContent = WORDS[value] ?? '';
          }
        });
      },
      title: 'Listening',
    },
    {
      html: `
        <div class="row">
          <jl-rating value="2" disabled label="Disabled"></jl-rating>
          <jl-rating value="0" invalid required label="Required"></jl-rating>
        </div>`,
      title: 'States',
    },
  ],
  level: 'atom',
  methods: [
    { description: 'Focuses the scale.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
    {
      description: 'Whether a required rating has a score.',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'Rating',
  playground: { attributes: { label: 'Your rating', value: '3' } },
  props: [
    {
      attribute: 'value',
      control: { kind: 'number', max: 10, min: 0 },
      default: '0',
      description: 'The score; 0 for none.',
      name: 'value',
      type: 'number',
    },
    {
      attribute: 'max',
      control: { kind: 'number', max: 10, min: 1 },
      default: '5',
      description: 'How many icons the scale has (up to 10).',
      name: 'max',
      type: 'number',
    },
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "'star'",
      description: 'The icon drawn for each step.',
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The icons: 16, 20 or 26 pixels.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'readonly',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shows the score without letting people change it.',
      name: 'readonly',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "'Rating'",
      description: 'The name screen readers give the scale.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'name',
      default: "''",
      description: "The field's name in the form's data.",
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'required',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The form cannot be submitted without a score.',
      name: 'required',
      type: 'boolean',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Cannot be changed or focused.',
      name: 'disabled',
      type: 'boolean',
    },
    {
      attribute: 'invalid',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The empty icons in the danger colour, for an error the page found.',
      name: 'invalid',
      type: 'boolean',
    },
  ],
  styling: [
    { description: 'The colour of the filled icons; the accent by default.', name: '--color' },
    { description: 'The colour of the empty icons.', name: '--empty' },
    { description: 'The row of icons (the slider).', name: 'base' },
  ],
  summary: 'A row of stars to give a score, or to show one.',
  tag: 'jl-rating',
};
