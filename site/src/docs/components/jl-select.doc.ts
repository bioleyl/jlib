import type { JlSelect } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const REGIONS = JSON.stringify([
  { group: 'Europe', label: 'Frankfurt', value: 'eu-central' },
  { group: 'Europe', label: 'Zurich', value: 'eu-south' },
  { group: 'Americas', label: 'Virginia', value: 'us-east' },
  { group: 'Americas', label: 'Oregon', value: 'us-west' },
  { disabled: true, group: 'Asia', label: 'Tokyo (full)', value: 'ap-north' },
]);

export const doc: ComponentDoc = {
  className: 'JlSelect',
  description: `A choice among a list, on the browser's own select: the list opens the way the platform does it
(a sheet on phones), the keyboard works as people expect, and the form gets the chosen value.

Give the choices as JSON in options (an option with a group goes under that heading), or write option and optgroup
elements inside the element, as for a native select: they are copied in when it connects. A placeholder shows
while nothing is chosen and cannot be picked back; with required, it stops the submission.`,
  events: [{ description: 'Someone chose an option.', detail: 'string', name: 'change' }],
  examples: [
    {
      description: 'Options with a group gather under its heading; a disabled one shows but cannot be chosen.',
      html: `
        <div class="narrow">
          <jl-select
            label="Region"
            placeholder="Choose a region"
            options='${REGIONS}'
          ></jl-select>
        </div>`,
      title: 'From JSON, with groups',
    },
    {
      description: 'Written as for a native select; the selected option is the value.',
      html: `
        <div class="narrow">
          <jl-select label="Time zone" value="Europe/Zurich">
            <optgroup label="Europe">
              <option value="Europe/London">London</option>
              <option value="Europe/Zurich">Zurich</option>
            </optgroup>
            <optgroup label="Asia">
              <option value="Asia/Tokyo">Tokyo</option>
            </optgroup>
          </jl-select>
        </div>`,
      title: 'From option elements',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-select size="sm" label="Small" value="b" options='[{"value":"a","label":"Small"},{"value":"b","label":"Small, chosen"}]'></jl-select>
          <jl-select label="Medium" options='[{"value":"a","label":"Medium"}]'></jl-select>
          <jl-select size="lg" label="Large" options='[{"value":"a","label":"Large"}]'></jl-select>
        </div>`,
      title: 'Sizes',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-select label="Disabled" disabled options='[{"value":"a","label":"Disabled"}]'></jl-select>
          <jl-select label="Invalid" invalid placeholder="Nothing chosen" options='[{"value":"a","label":"A"}]'></jl-select>
        </div>`,
      title: 'States',
    },
    {
      description: 'The paragraph listens to change.',
      html: `
        <div class="stack narrow">
          <jl-select
            class="demo-sort"
            label="Sort by"
            value="recent"
            options='[{"value":"recent","label":"Most recent"},{"value":"name","label":"Name"},{"value":"size","label":"Size"}]'
          ></jl-select>
          <p class="muted demo-out">Sorted by recent.</p>
        </div>`,
      script: `
        const select = root.querySelector('.demo-sort');
        const out = root.querySelector('.demo-out');
        select.events.register('change', (value) => {
          out.textContent = \`Sorted by \${value}.\`;
        });`,
      setup: (root) => {
        const select = root.querySelector<JlSelect>('.demo-sort');
        const out = root.querySelector('.demo-out');
        select?.events.register('change', (value) => {
          if (out !== null) {
            out.textContent = `Sorted by ${value}.`;
          }
        });
      },
      title: 'Listening',
    },
  ],
  level: 'atom',
  methods: [
    { description: 'Focuses the native select.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
    {
      description: 'Whether a required select has a choice.',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'Select',
  playground: {
    attributes: { label: 'Region', options: REGIONS, placeholder: 'Choose a region' },
  },
  props: [
    {
      attribute: 'options',
      control: { kind: 'json' },
      default: '[]',
      description: 'The choices; empty: the option elements written inside are used.',
      name: 'options',
      type: 'SelectOption[]',
    },
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The chosen value. One no option has shows the placeholder, or else the first option.',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'placeholder',
      control: { kind: 'text' },
      default: "''",
      description: 'Shown while nothing is chosen; it cannot be picked back.',
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
      description: 'The form cannot be submitted while the placeholder shows.',
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
  slots: [
    { description: 'option and optgroup elements, copied into the select when no options are given.', name: '' },
  ],
  styling: [{ description: 'The frame around the select.', name: 'base' }],
  summary: "A choice among a list, on the browser's own select.",
  tag: 'jl-select',
};
