import type { ComponentDoc } from '../../types/docs.types';

const TONE_OPTIONS = ['neutral', 'accent', 'ok', 'warn', 'danger', 'info'];

export const doc: ComponentDoc = {
  className: 'JlBadge',
  description: `Badges label a state in a word or two. Keep the accent for what is live or waits for someone, and the
semantic tones for what they mean: ok for done, warn for a real warning, danger for a failure.`,
  examples: [
    {
      html: `
        <div class="row">
          <jl-badge label="Draft"></jl-badge>
          <jl-badge tone="accent" label="In review"></jl-badge>
          <jl-badge tone="ok" label="Published"></jl-badge>
          <jl-badge tone="warn" label="Expiring"></jl-badge>
          <jl-badge tone="danger" label="Failed"></jl-badge>
          <jl-badge tone="info" label="New"></jl-badge>
        </div>`,
      title: 'Tones',
    },
    {
      description: 'A dot marks a live state; an icon says the state at a glance.',
      html: `
        <div class="row">
          <jl-badge tone="accent" label="Running" dot></jl-badge>
          <jl-badge tone="ok" label="Online" dot></jl-badge>
          <jl-badge tone="ok" icon="check" label="Verified"></jl-badge>
          <jl-badge tone="danger" icon="circle-x" label="3 errors"></jl-badge>
        </div>`,
      title: 'Dot and icon',
    },
    {
      html: `
        <div class="row">
          <jl-badge tone="neutral" label="v0.1" solid></jl-badge>
          <jl-badge tone="accent" label="Beta" solid></jl-badge>
          <jl-badge tone="danger" label="12" solid></jl-badge>
        </div>`,
      title: 'Solid',
    },
  ],
  level: 'atom',
  name: 'Badge',
  playground: { attributes: { dot: true, label: 'Running', tone: 'accent' } },
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
      attribute: 'tone',
      control: { kind: 'select', options: TONE_OPTIONS },
      default: "'neutral'",
      description: 'The colour, by meaning.',
      name: 'tone',
      type: "'neutral' | 'accent' | 'ok' | 'warn' | 'danger' | 'info'",
    },
    {
      attribute: 'dot',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'A dot before the label, for live states.',
      name: 'dot',
      type: 'boolean',
    },
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "''",
      description: 'An icon before the label; it replaces the dot.',
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'solid',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Filled with the tone, for what must stand out.',
      name: 'solid',
      type: 'boolean',
    },
  ],
  slots: [{ description: 'Extra content after the label.', name: '' }],
  styling: [{ description: 'The pill.', name: 'base' }],
  summary: 'A short status, coloured by its tone.',
  tag: 'jl-badge',
};
