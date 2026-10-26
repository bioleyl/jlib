import type { JlBadge, JlSwitch } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlSwitch',
  description: `An on/off setting that applies as soon as it flips: dark mode, notifications, a feature flag. For a
choice that a button confirms later, prefer a checkbox.

Screen readers announce it as a switch, on or off. In a form, the form gets its value ("on" unless set) while it is
on, and nothing while it is off, as with a checkbox.`,
  events: [{ description: 'Someone turned it on or off.', detail: 'boolean', name: 'change' }],
  examples: [
    {
      html: `
        <div class="stack">
          <jl-switch label="Off"></jl-switch>
          <jl-switch label="On" checked></jl-switch>
          <jl-switch label="Disabled" disabled></jl-switch>
          <jl-switch label="Disabled and on" disabled checked></jl-switch>
        </div>`,
      title: 'States',
    },
    {
      description: 'sm for dense panels and table rows.',
      html: `
        <div class="row">
          <jl-switch size="sm" label="Small" checked></jl-switch>
          <jl-switch label="Medium" checked></jl-switch>
        </div>`,
      title: 'Sizes',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-switch
            label="Deploy previews"
            description="Build every pull request and post a link to it."
            checked
          ></jl-switch>
          <jl-switch
            label="Protect the main branch"
            description="Changes need a review before they merge."
          ></jl-switch>
        </div>`,
      title: 'With a description',
    },
    {
      description: 'The status follows the switch: it listens to change.',
      html: `
        <div class="row">
          <jl-switch class="demo-live" label="Maintenance mode"></jl-switch>
          <jl-badge class="demo-status" label="Live" tone="ok" dot></jl-badge>
        </div>`,
      script: `
        const toggle = root.querySelector('.demo-live');
        const status = root.querySelector('.demo-status');
        toggle.events.register('change', (on) => {
          status.label.set(on ? 'Paused' : 'Live');
          status.tone.set(on ? 'warn' : 'ok');
        });`,
      setup: (root) => {
        const toggle = root.querySelector<JlSwitch>('.demo-live');
        const status = root.querySelector<JlBadge>('.demo-status');
        toggle?.events.register('change', (on) => {
          status?.label.set(on ? 'Paused' : 'Live');
          status?.tone.set(on ? 'warn' : 'ok');
        });
      },
      title: 'Listening',
    },
  ],
  level: 'atom',
  methods: [
    {
      description: 'Flips the state, as a click would, and fires change.',
      name: 'toggle',
      signature: 'toggle(): void',
    },
    { description: 'Focuses the switch.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
  ],
  name: 'Switch',
  playground: {
    attributes: { checked: true, label: 'Dark mode' },
  },
  props: [
    {
      attribute: 'checked',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Whether it is on. The attribute is also what a form reset goes back to.',
      name: 'checked',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The text beside the switch.',
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
      attribute: 'size',
      control: { kind: 'select', options: ['md', 'sm'] },
      default: "'md'",
      description: 'The size of the track.',
      name: 'size',
      type: "'sm' | 'md'",
    },
    {
      attribute: 'value',
      default: "'on'",
      description: 'What the form gets while it is on.',
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
    { description: 'The label around the switch and its text.', name: 'base' },
    { description: 'The track width (36px, 28px when small).', name: '--track-width' },
    { description: 'The track height (20px, 16px when small).', name: '--track-height' },
    { description: 'The thumb size (14px, 10px when small).', name: '--thumb' },
  ],
  summary: 'An on/off setting that applies at once.',
  tag: 'jl-switch',
};
