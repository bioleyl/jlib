import type { JlCheckbox } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlCheckbox',
  description: `A box to tick for a yes or no that is confirmed later, with a button: accept the terms, choose the
columns to export. For a setting that applies at once, prefer a switch.

It takes part in forms like a native checkbox: while checked, the form gets its value ("on" unless set), and with
required the form cannot be submitted until it is checked. Clicking the label toggles it too. indeterminate draws a
dash, for a box that stands for a list whose items are partly checked; the next click decides.`,
  events: [{ description: 'Someone checked or unchecked the box.', detail: 'boolean', name: 'change' }],
  examples: [
    {
      html: `
        <div class="stack">
          <jl-checkbox label="Unchecked"></jl-checkbox>
          <jl-checkbox label="Checked" checked></jl-checkbox>
          <jl-checkbox label="Indeterminate" indeterminate></jl-checkbox>
          <jl-checkbox label="Disabled" disabled></jl-checkbox>
          <jl-checkbox label="Disabled and checked" disabled checked></jl-checkbox>
        </div>`,
      title: 'States',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-checkbox
            label="Weekly digest"
            description="A summary of the activity in your projects, every Monday."
            checked
          ></jl-checkbox>
          <jl-checkbox
            label="Product news"
            description="New features and improvements, about once a month."
          ></jl-checkbox>
        </div>`,
      title: 'With a description',
    },
    {
      description: 'The default slot takes a label with a link or emphasis.',
      html: `
        <jl-checkbox required>
          I accept the <a href="#/components/checkbox">terms of service</a>
        </jl-checkbox>`,
      title: 'Rich label',
    },
    {
      description: 'The parent box is indeterminate while only some of its items are checked.',
      html: `
        <div class="stack demo-all">
          <jl-checkbox class="parent" label="All columns"></jl-checkbox>
          <div class="stack" style="padding-left: 28px">
            <jl-checkbox class="child" label="Name" checked></jl-checkbox>
            <jl-checkbox class="child" label="Email"></jl-checkbox>
            <jl-checkbox class="child" label="Last seen"></jl-checkbox>
          </div>
        </div>`,
      script: `
        const parent = root.querySelector('.parent');
        const children = [...root.querySelectorAll('.child')];
        const sync = () => {
          const checked = children.filter((child) => child.checked.get()).length;
          parent.checked.set(checked === children.length);
          parent.indeterminate.set(checked > 0 && checked < children.length);
        };
        parent.events.register('change', (checked) => {
          for (const child of children) child.checked.set(checked);
        });
        for (const child of children) child.events.register('change', sync);
        sync();`,
      setup: (root) => {
        const parent = root.querySelector<JlCheckbox>('.parent');
        const children = [...root.querySelectorAll<JlCheckbox>('.child')];
        if (parent === null) {
          return;
        }
        const sync = (): void => {
          const checked = children.filter((child) => child.checked.get()).length;
          parent.checked.set(checked === children.length);
          parent.indeterminate.set(checked > 0 && checked < children.length);
        };
        parent.events.register('change', (checked) => {
          for (const child of children) {
            child.checked.set(checked);
          }
        });
        for (const child of children) {
          child.events.register('change', sync);
        }
        sync();
      },
      title: 'Select all',
    },
  ],
  level: 'atom',
  methods: [
    {
      description: 'Flips the state, as a click would, and fires change.',
      name: 'toggle',
      signature: 'toggle(): void',
    },
    { description: 'Focuses the box.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
    {
      description: 'Whether a required box is checked.',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'Checkbox',
  playground: {
    attributes: { description: 'About once a month, never more.', label: 'Email me about new releases' },
  },
  props: [
    {
      attribute: 'checked',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Whether the box is ticked. The attribute is also what a form reset goes back to.',
      name: 'checked',
      type: 'boolean',
    },
    {
      attribute: 'indeterminate',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Draws a dash: neither checked nor unchecked, until the next click.',
      name: 'indeterminate',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The text beside the box.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'description',
      control: { kind: 'text' },
      default: "''",
      description: 'A smaller line under the label.',
      name: 'description',
      type: 'string',
    },
    {
      attribute: 'value',
      default: "'on'",
      description: 'What the form gets while the box is checked.',
      name: 'value',
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
      description: 'The form cannot be submitted until it is checked.',
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
  ],
  slots: [{ description: 'A richer label, with a link or emphasis.', name: '' }],
  styling: [
    { description: 'The label around the box and its text.', name: 'base' },
    { description: 'The size of the box (18px).', name: '--box' },
  ],
  summary: 'A box to tick, with its label beside it.',
  tag: 'jl-checkbox',
};
