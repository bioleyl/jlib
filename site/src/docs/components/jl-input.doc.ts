import type { JlInput } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const TYPE_OPTIONS = ['text', 'email', 'password', 'number', 'search', 'tel', 'url', 'date', 'time'];

export const doc: ComponentDoc = {
  className: 'JlInput',
  description: `A text field that takes part in forms like a native one: give it a name and its value is in the form's
data, required stops the submission, a reset brings back the value written in the HTML.

Pair it with jl-field for a visible label, a hint and an error. Its value is a Jadis change handler: read it with
value.get(), write it with value.set().`,
  events: [
    { description: 'Each change as people type.', detail: 'string', name: 'input' },
    {
      description: 'Enter was pressed in the field: to submit, or to pick a first result.',
      detail: 'string',
      name: 'enter',
    },
    {
      description: 'The value was committed: Enter, leaving the field, or the clear button.',
      detail: 'string',
      name: 'change',
    },
  ],
  examples: [
    {
      description: 'A password field gets a button to show what was typed.',
      html: `
        <div class="stack narrow">
          <jl-input placeholder="Your name"></jl-input>
          <jl-input type="email" icon="mail" placeholder="you@example.com"></jl-input>
          <jl-input type="password" value="hunter2" placeholder="Password"></jl-input>
        </div>`,
      title: 'Kinds',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-input size="sm" placeholder="Small"></jl-input>
          <jl-input placeholder="Medium"></jl-input>
          <jl-input size="lg" placeholder="Large"></jl-input>
        </div>`,
      title: 'Sizes',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-input value="https://" clearable placeholder="Website">
            <jl-icon slot="start" name="globe"></jl-icon>
          </jl-input>
          <jl-input type="number" value="72" placeholder="Weight">
            <span slot="end">kg</span>
          </jl-input>
        </div>`,
      title: 'Adornments and clear button',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-input value="Read only" readonly></jl-input>
          <jl-input value="Disabled" disabled></jl-input>
          <jl-input value="not-an-email" invalid></jl-input>
        </div>`,
      title: 'States',
    },
    {
      description: 'The value follows the typing; the paragraph listens to input.',
      html: `
        <div class="stack narrow">
          <jl-input class="demo-live" placeholder="Type something" clearable></jl-input>
          <p class="muted demo-out">Nothing typed yet.</p>
        </div>`,
      script: `
        const input = root.querySelector('.demo-live');
        const out = root.querySelector('.demo-out');
        input.events.register('input', (value) => {
          out.textContent = value === '' ? 'Nothing typed yet.' : \`\${value.length} characters\`;
        });`,
      setup: (root) => {
        const input = root.querySelector<JlInput>('.demo-live');
        const out = root.querySelector('.demo-out');
        input?.events.register('input', (value) => {
          if (out !== null) {
            out.textContent = value === '' ? 'Nothing typed yet.' : `${value.length} characters`;
          }
        });
      },
      title: 'Listening',
    },
  ],
  level: 'atom',
  methods: [
    { description: 'Focuses the native field.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
    { description: 'Selects the whole text.', name: 'select', signature: 'select(): void' },
    {
      description: 'Whether the value meets its constraints (required, pattern…).',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'Input',
  playground: { attributes: { clearable: true, icon: 'search', placeholder: 'Search projects' } },
  props: [
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The text.',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'type',
      control: { kind: 'select', options: TYPE_OPTIONS },
      default: "'text'",
      description: 'The kind of text, as a native input.',
      name: 'type',
      type: 'InputType',
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
      attribute: 'name',
      default: "''",
      description: "The field's name in the form's data.",
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "''",
      description: 'An icon at the start.',
      name: 'icon',
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
      attribute: 'clearable',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'A button empties the field while it holds text.',
      name: 'clearable',
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
      attribute: 'readonly',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Can be read and copied, not changed.',
      name: 'readonly',
      type: 'boolean',
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
      attribute: 'invalid',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Drawn in the danger colour, for an error the page found.',
      name: 'invalid',
      type: 'boolean',
    },
    {
      attribute: 'label',
      default: "''",
      description: 'The accessible name, when no visible label names the field.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'autocomplete',
      default: "''",
      description: 'As a native input.',
      name: 'autocomplete',
      type: 'string',
    },
    { attribute: 'min', default: "''", description: 'As a native input.', name: 'min', type: 'string' },
    { attribute: 'max', default: "''", description: 'As a native input.', name: 'max', type: 'string' },
    { attribute: 'step', default: "''", description: 'As a native input.', name: 'step', type: 'string' },
    {
      attribute: 'minlength',
      default: "''",
      description: 'As a native input.',
      name: 'minlength',
      type: 'string',
    },
    {
      attribute: 'maxlength',
      default: "''",
      description: 'As a native input.',
      name: 'maxlength',
      type: 'string',
    },
    { attribute: 'pattern', default: "''", description: 'As a native input.', name: 'pattern', type: 'string' },
  ],
  slots: [
    { description: 'Before the text: a prefix, an icon.', name: 'start' },
    { description: 'After the text: a unit, a button.', name: 'end' },
  ],
  styling: [{ description: 'The frame around the field.', name: 'base' }],
  summary: 'A single-line text field that takes part in forms.',
  tag: 'jl-input',
};
