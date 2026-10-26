import type { ComponentDoc } from '../../types/docs.types';

const TONE_OPTIONS = ['accent', 'ok', 'warn', 'danger'];

export const doc: ComponentDoc = {
  className: 'JlProgressRing',
  description: `The circular progress fits where a bar has no room: a card's corner, a table cell, a button, a list
row. With show-value, the percentage sits in its centre (from about 40 pixels).

Without a value it turns: the work has no known end. Name it with label, for screen readers.`,
  examples: [
    {
      html: `
        <div class="row">
          <jl-progress-ring value="25"></jl-progress-ring>
          <jl-progress-ring value="50"></jl-progress-ring>
          <jl-progress-ring value="75"></jl-progress-ring>
          <jl-progress-ring value="100" tone="ok"></jl-progress-ring>
        </div>`,
      title: 'Values',
    },
    {
      description: 'Any size and thickness, in pixels; the percentage in the centre.',
      html: `
        <div class="row">
          <jl-progress-ring value="62" size="16" thickness="2.5" label="Syncing"></jl-progress-ring>
          <jl-progress-ring value="62" size="24" thickness="3"></jl-progress-ring>
          <jl-progress-ring value="62" size="48" show-value></jl-progress-ring>
          <jl-progress-ring value="62" size="72" thickness="6" show-value></jl-progress-ring>
          <jl-progress-ring value="62" size="96" thickness="8" show-value></jl-progress-ring>
        </div>`,
      title: 'Sizes and value',
    },
    {
      html: `
        <div class="row">
          <jl-progress-ring value="70" size="48" show-value></jl-progress-ring>
          <jl-progress-ring value="70" size="48" tone="ok" show-value></jl-progress-ring>
          <jl-progress-ring value="70" size="48" tone="warn" show-value></jl-progress-ring>
          <jl-progress-ring value="70" size="48" tone="danger" show-value></jl-progress-ring>
        </div>`,
      title: 'Tones',
    },
    {
      description: 'No value: it turns.',
      html: `
        <div class="row">
          <jl-progress-ring size="20" thickness="2.5" label="Loading"></jl-progress-ring>
          <jl-progress-ring label="Loading"></jl-progress-ring>
        </div>`,
      title: 'Indeterminate',
    },
    {
      description: 'A quota at a glance, beside what it measures.',
      html: `
        <jl-card class="narrow" heading="Storage" description="4.2 GB of 5 GB used">
          <jl-progress-ring slot="actions" value="84" size="44" tone="warn" show-value label="Storage used"></jl-progress-ring>
          <span class="muted">Free some space or upgrade before the end of the month.</span>
        </jl-card>`,
      title: 'In a card',
    },
  ],
  level: 'atom',
  name: 'Progress ring',
  playground: { attributes: { 'show-value': true, size: '64', thickness: '6', value: '62' } },
  props: [
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: 'null',
      description: 'How much is done, out of max. Without it, the ring turns.',
      name: 'value',
      type: 'number | null',
    },
    {
      attribute: 'max',
      control: { kind: 'number', min: 1 },
      default: '100',
      description: 'The value of a finished task.',
      name: 'max',
      type: 'number',
    },
    {
      attribute: 'size',
      control: { kind: 'number', max: 160, min: 12 },
      default: '40',
      description: 'The width and height, in pixels.',
      name: 'size',
      type: 'number',
    },
    {
      attribute: 'thickness',
      control: { kind: 'number', max: 20, min: 1, step: 0.5 },
      default: '4',
      description: 'The width of the stroke, in pixels.',
      name: 'thickness',
      type: 'number',
    },
    {
      attribute: 'tone',
      control: { kind: 'select', options: TONE_OPTIONS },
      default: "'accent'",
      description: 'The colour of the arc.',
      name: 'tone',
      type: "'accent' | 'ok' | 'warn' | 'danger'",
    },
    {
      attribute: 'show-value',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Prints the percentage in the centre.',
      name: 'showValue',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'Its name for screen readers ("Progress" when empty).',
      name: 'label',
      type: 'string',
    },
  ],
  styling: [
    { description: 'The ring and its percentage.', name: 'base' },
    { description: 'The colour of the arc, beyond the tones.', name: '--color' },
    { description: 'The colour of the track under the arc.', name: '--track' },
  ],
  summary: 'A ring that shows how much of a task is done, for small places.',
  tag: 'jl-progress-ring',
};
