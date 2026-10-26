import type { JlNumberInput } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlNumberInput',
  description: `A number field with − and + buttons: a quantity, a count of seats, a percentage. The arrow keys step
it, Page Up and Page Down by ten steps, Home and End go to min and max when they are set.

People can also type: the text is read when they leave the field (or press Enter), kept between min and max, and
put back as it was when it is not a number. An empty field is null; with required, the form cannot be submitted
while it is empty. Decimal steps (0.1, 0.25) add up without float noise.`,
  events: [
    {
      description: 'The value changed: a step, a button, or text committed on Enter or when leaving the field.',
      detail: 'number | null',
      name: 'change',
    },
  ],
  examples: [
    {
      description: 'The buttons are disabled at the bounds.',
      html: `
        <div class="row">
          <jl-number-input label="Quantity" value="1" min="1" max="10" style="width: 140px"></jl-number-input>
          <jl-number-input label="Guests" value="10" min="1" max="10" style="width: 140px"></jl-number-input>
        </div>`,
      title: 'Bounds',
    },
    {
      html: `
        <div class="row">
          <jl-number-input label="Rating" value="4.5" min="0" max="5" step="0.5" style="width: 140px"></jl-number-input>
          <jl-number-input label="Ratio" value="0.2" step="0.1" style="width: 140px"></jl-number-input>
        </div>`,
      title: 'Decimal steps',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-number-input size="sm" label="Small" value="3"></jl-number-input>
          <jl-number-input label="Medium" value="3"></jl-number-input>
          <jl-number-input size="lg" label="Large" value="3"></jl-number-input>
        </div>`,
      title: 'Sizes',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-number-input label="Seats" placeholder="How many seats?"></jl-number-input>
          <jl-number-input label="Disabled" value="12" disabled></jl-number-input>
          <jl-number-input label="Invalid" value="0" invalid></jl-number-input>
        </div>`,
      title: 'Empty and states',
    },
    {
      description: 'The total listens to change.',
      html: `
        <div class="row">
          <jl-number-input class="demo-seats" label="Seats" value="3" min="1" max="50" style="width: 140px"></jl-number-input>
          <span class="muted demo-total">3 seats × 12 CHF = 36 CHF / month</span>
        </div>`,
      script: `
        const seats = root.querySelector('.demo-seats');
        const total = root.querySelector('.demo-total');
        seats.events.register('change', (count) => {
          const value = count ?? 0;
          total.textContent = \`\${value} seats × 12 CHF = \${value * 12} CHF / month\`;
        });`,
      setup: (root) => {
        const seats = root.querySelector<JlNumberInput>('.demo-seats');
        const total = root.querySelector('.demo-total');
        seats?.events.register('change', (count) => {
          const value = count ?? 0;
          if (total !== null) {
            total.textContent = `${value} seats × 12 CHF = ${value * 12} CHF / month`;
          }
        });
      },
      title: 'Listening',
    },
  ],
  level: 'molecule',
  methods: [
    {
      description: 'Adds count steps (negative to go down), within the bounds, and fires change.',
      name: 'stepBy',
      signature: 'stepBy(count: number): void',
    },
    { description: 'Focuses the field.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
    {
      description: 'Whether a required field has a number.',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'Number input',
  playground: {
    attributes: { label: 'Quantity', max: '10', min: '0', value: '1' },
    width: 180,
  },
  props: [
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: 'null',
      description: 'The number; null while the field is empty.',
      name: 'value',
      type: 'number | null',
    },
    {
      attribute: 'min',
      control: { kind: 'text' },
      default: 'null',
      description: 'The lowest value; none when null.',
      name: 'min',
      type: 'number | null',
    },
    {
      attribute: 'max',
      control: { kind: 'text' },
      default: 'null',
      description: 'The highest value; none when null.',
      name: 'max',
      type: 'number | null',
    },
    {
      attribute: 'step',
      control: { kind: 'number', min: 0 },
      default: '1',
      description: 'What a button or an arrow key adds or takes away.',
      name: 'step',
      type: 'number',
    },
    {
      attribute: 'placeholder',
      control: { kind: 'text' },
      default: "''",
      description: 'Shown while empty.',
      name: 'placeholder',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The height.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'name',
      default: "''",
      description: "The field's name in the form's data.",
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'label',
      default: "''",
      description: 'The accessible name, when no visible label names the field.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'required',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The form cannot be submitted while it is empty.',
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
      description: 'Drawn in the danger colour, for an error the page found.',
      name: 'invalid',
      type: 'boolean',
    },
  ],
  styling: [{ description: 'The frame around the field and its buttons.', name: 'base' }],
  summary: 'A number field with − and + buttons, arrow keys and bounds.',
  tag: 'jl-number-input',
};
