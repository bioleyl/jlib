import { JlBadge } from '@syware/jlib';

import type { StatusLook } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const ORDER_STATUS: Record<string, StatusLook> = {
  cancelled: { hint: 'Cancelled before it was handed over.', icon: 'x', label: 'Cancelled', tone: 'neutral' },
  ready: { hint: 'Ready to be handed over.', icon: 'check', label: 'Ready', tone: 'ok' },
  submitted: { hint: 'Waiting for logistics to prepare it.', icon: 'inbox', label: 'Sent', tone: 'info' },
};

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
    {
      description:
        'One map per kind of thing gives each state its word, tone, icon and hint; showStatus() takes one. Hover a badge for its hint.',
      html: `
        <div class="row demo-statuses"></div>`,
      script: `
        const ORDER_STATUS = {
          submitted: { label: 'Sent', tone: 'info', icon: 'inbox', hint: 'Waiting for logistics to prepare it.' },
          ready: { label: 'Ready', tone: 'ok', icon: 'check', hint: 'Ready to be handed over.' },
          cancelled: { label: 'Cancelled', tone: 'neutral', icon: 'x', hint: 'Cancelled before it was handed over.' },
        };
        for (const look of Object.values(ORDER_STATUS)) {
          const badge = new JlBadge();
          badge.showStatus(look);
          root.querySelector('.demo-statuses').append(badge);
        }`,
      setup: (root) => {
        for (const look of Object.values(ORDER_STATUS)) {
          const badge = new JlBadge();
          badge.showStatus(look);
          root.querySelector('.demo-statuses')?.append(badge);
        }
      },
      title: 'States from a map',
    },
  ],
  level: 'atom',
  methods: [
    {
      description: "Shows a state as an app's map of states describes it: its label, tone, icon and hint.",
      name: 'showStatus',
      signature: 'showStatus(look: StatusLook): void',
    },
  ],
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
    {
      attribute: 'hint',
      control: { kind: 'text' },
      default: "''",
      description: 'What the state means, as a tooltip: "Waiting for logistics to prepare it."',
      name: 'hint',
      type: 'string',
    },
  ],
  slots: [{ description: 'Extra content after the label.', name: '' }],
  styling: [{ description: 'The pill.', name: 'base' }],
  summary: 'A short status, coloured by its tone.',
  tag: 'jl-badge',
};
