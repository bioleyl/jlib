import type { JlRadioGroup } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const PLANS = JSON.stringify([
  { description: 'One project, community support.', label: 'Hobby', value: 'hobby' },
  { description: 'Unlimited projects, email support.', label: 'Pro', value: 'pro' },
  { description: 'SSO, audit logs and a contract.', label: 'Enterprise', value: 'enterprise' },
]);

const SIZES = JSON.stringify([
  { label: 'Small', value: 's' },
  { label: 'Medium', value: 'm' },
  { label: 'Large', value: 'l' },
  { disabled: true, label: 'XL (sold out)', value: 'xl' },
]);

export const doc: ComponentDoc = {
  className: 'JlRadioGroup',
  description: `One choice among a few that should all stay in view: a plan, a size, a frequency. For a long list,
prefer a select.

It behaves as native radios: Tab reaches the chosen option (or the first one), the arrow keys move the choice and
skip disabled options, Space chooses the focused option. The label names the group for screen readers; with legend
it is also shown over the options. variant="cards" draws each option as a bordered card, for choices that deserve a
line of explanation.`,
  events: [{ description: 'Someone chose an option.', detail: 'string', name: 'change' }],
  examples: [
    {
      html: `
        <jl-radio-group label="Plan" legend value="pro" options='${PLANS}'></jl-radio-group>`,
      title: 'With descriptions',
    },
    {
      description: 'A disabled option is skipped by the arrow keys.',
      html: `
        <jl-radio-group label="Size" legend orientation="horizontal" value="m" options='${SIZES}'></jl-radio-group>`,
      title: 'Horizontal',
    },
    {
      html: `
        <jl-radio-group
          label="Plan"
          variant="cards"
          orientation="horizontal"
          value="pro"
          options='${PLANS}'
        ></jl-radio-group>`,
      title: 'Cards',
    },
    {
      html: `
        <div class="narrow">
          <jl-radio-group label="Plan" variant="cards" value="hobby" options='${PLANS}'></jl-radio-group>
        </div>`,
      title: 'Cards, stacked',
    },
    {
      html: `
        <jl-radio-group label="Frequency" legend disabled value="weekly"
          options='[{"value":"daily","label":"Daily"},{"value":"weekly","label":"Weekly"}]'></jl-radio-group>`,
      title: 'Disabled',
    },
    {
      description: 'The paragraph listens to change.',
      html: `
        <div class="stack">
          <jl-radio-group
            class="demo-theme"
            label="Theme"
            orientation="horizontal"
            value="system"
            options='[{"value":"light","label":"Light"},{"value":"dark","label":"Dark"},{"value":"system","label":"System"}]'
          ></jl-radio-group>
          <p class="muted demo-out">Theme: system.</p>
        </div>`,
      script: `
        const group = root.querySelector('.demo-theme');
        const out = root.querySelector('.demo-out');
        group.events.register('change', (value) => {
          out.textContent = \`Theme: \${value}.\`;
        });`,
      setup: (root) => {
        const group = root.querySelector<JlRadioGroup>('.demo-theme');
        const out = root.querySelector('.demo-out');
        group?.events.register('change', (value) => {
          if (out !== null) {
            out.textContent = `Theme: ${value}.`;
          }
        });
      },
      title: 'Listening',
    },
  ],
  level: 'molecule',
  methods: [
    {
      description: 'Focuses the chosen option, or the first one that can be chosen.',
      name: 'focus',
      signature: 'focus(options?: FocusOptions): void',
    },
    {
      description: 'Whether a required group has a choice.',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'Radio group',
  playground: {
    attributes: { label: 'Plan', legend: true, options: PLANS, value: 'pro' },
  },
  props: [
    {
      attribute: 'options',
      control: { kind: 'json' },
      default: '[]',
      description: 'The choices: value, label, and an optional description and disabled.',
      name: 'options',
      type: 'RadioOption[]',
    },
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The chosen value; empty while nothing is chosen.',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: "The group's name for screen readers.",
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'legend',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shows the label over the options.',
      name: 'legend',
      type: 'boolean',
    },
    {
      attribute: 'orientation',
      control: { kind: 'select', options: ['vertical', 'horizontal'] },
      default: "'vertical'",
      description: 'Options in a column or in a row.',
      name: 'orientation',
      type: "'vertical' | 'horizontal'",
    },
    {
      attribute: 'variant',
      control: { kind: 'select', options: ['plain', 'cards'] },
      default: "'plain'",
      description: 'A dot beside each label, or a bordered card per option.',
      name: 'variant',
      type: "'plain' | 'cards'",
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
      description: 'The form cannot be submitted until an option is chosen.',
      name: 'required',
      type: 'boolean',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'No option can be chosen or focused.',
      name: 'disabled',
      type: 'boolean',
    },
  ],
  styling: [
    { description: 'The radiogroup element around the options.', name: 'base' },
    { description: 'The size of the dots (18px).', name: '--dot' },
  ],
  summary: 'One choice among a few, all in view, as radios or as cards.',
  tag: 'jl-radio-group',
};
