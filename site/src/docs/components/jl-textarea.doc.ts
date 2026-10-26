import type { JlTextarea } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlTextarea',
  description: `A text field of several lines that takes part in forms like a native textarea: give it a name and its
value is in the form's data, required stops the submission, a reset brings back the value written in the HTML.

rows sets the height. With autosize the field grows with its text, from rows up to max-rows lines, and scrolls
after that. A maxlength stops the typing at that length and shows a counter under the field.`,
  events: [
    { description: 'Each change as people type.', detail: 'string', name: 'input' },
    {
      description: 'The text was committed: the field lost the focus after a change.',
      detail: 'string',
      name: 'change',
    },
  ],
  examples: [
    {
      description: 'rows sets the height; the field can be resized by its corner.',
      html: `
        <div class="stack narrow">
          <jl-textarea placeholder="A short note" rows="2"></jl-textarea>
          <jl-textarea placeholder="Describe the issue" rows="5"></jl-textarea>
        </div>`,
      title: 'Rows',
    },
    {
      description: 'It starts at two lines, grows as you type, and scrolls past six.',
      html: `
        <div class="narrow">
          <jl-textarea autosize rows="2" max-rows="6" placeholder="Write a message…"></jl-textarea>
        </div>`,
      title: 'Autosize',
    },
    {
      description: 'The counter turns to the warning colour once the limit is reached.',
      html: `
        <div class="narrow">
          <jl-textarea
            maxlength="120"
            label="Bio"
            value="Designer and developer in Lausanne. I build quiet tools for busy teams."
          ></jl-textarea>
        </div>`,
      title: 'Character counter',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-textarea value="Read only: it can be selected and copied." readonly rows="2"></jl-textarea>
          <jl-textarea value="Disabled" disabled rows="2"></jl-textarea>
          <jl-textarea value="Too short" invalid rows="2"></jl-textarea>
        </div>`,
      title: 'States',
    },
    {
      description: 'The paragraph listens to input and counts the words.',
      html: `
        <div class="stack narrow">
          <jl-textarea class="demo-words" autosize placeholder="Type a few words"></jl-textarea>
          <p class="muted demo-count">0 words</p>
        </div>`,
      script: `
        const area = root.querySelector('.demo-words');
        const count = root.querySelector('.demo-count');
        area.events.register('input', (text) => {
          const words = text.trim() === '' ? 0 : text.trim().split(/\\s+/).length;
          count.textContent = \`\${words} \${words === 1 ? 'word' : 'words'}\`;
        });`,
      setup: (root) => {
        const area = root.querySelector<JlTextarea>('.demo-words');
        const count = root.querySelector('.demo-count');
        area?.events.register('input', (text) => {
          const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
          if (count !== null) {
            count.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
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
      description: 'Whether the value meets its constraints (required, maxlength).',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'Textarea',
  playground: {
    attributes: { autosize: true, 'max-rows': '8', maxlength: '200', placeholder: 'Tell us about your project' },
  },
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
      attribute: 'placeholder',
      control: { kind: 'text' },
      default: "''",
      description: 'Shown while empty.',
      name: 'placeholder',
      type: 'string',
    },
    {
      attribute: 'rows',
      control: { kind: 'number', max: 20, min: 1 },
      default: '3',
      description: 'The height in lines; the least an autosized field shows.',
      name: 'rows',
      type: 'number',
    },
    {
      attribute: 'autosize',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Grows with the text instead of scrolling, up to max-rows.',
      name: 'autosize',
      type: 'boolean',
    },
    {
      attribute: 'max-rows',
      control: { kind: 'number', max: 30, min: 0 },
      default: '0',
      description: 'The most lines an autosized field grows to before it scrolls; 0 for no limit.',
      name: 'maxRows',
      type: 'number',
    },
    {
      attribute: 'maxlength',
      control: { kind: 'text' },
      default: "''",
      description: 'The most characters it takes; shows a counter under the field.',
      name: 'maxlength',
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
      attribute: 'readonly',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Can be read and copied, not changed.',
      name: 'readonly',
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
  styling: [{ description: 'The frame around the text area.', name: 'base' }],
  summary: 'A text field of several lines that can grow with its text and count its characters.',
  tag: 'jl-textarea',
};
