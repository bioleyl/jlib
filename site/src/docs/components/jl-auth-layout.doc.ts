import type { ComponentDoc } from '../../types/docs.types';

const POINTS = JSON.stringify([
  'Build workflows from steps, without code',
  'Review what the workflow proposes, with everything it read',
  'Every decision is kept: who, when, what changed, and why',
]);

const BRAND = `<span slot="brand" style="display: inline-flex; align-items: center; gap: 10px; font-weight: 800; font-size: 20px; letter-spacing: -0.02em">
            <jl-app-icon icon="workflow"></jl-app-icon>
            <span>sw<span style="color: var(--jl-brand)">ai</span></span>
          </span>`;

const FORM = `<div style="display: grid; gap: 16px; width: min(360px, 100%)">
            <div style="display: grid; gap: 4px">
              <strong style="font-size: 22px">Sign in</strong>
              <span class="muted">Use the account your administrator gave you.</span>
            </div>
            <jl-field label="Username"><jl-input autocomplete="username"></jl-input></jl-field>
            <jl-field label="Password"><jl-input type="password" autocomplete="current-password"></jl-input></jl-field>
            <jl-button variant="primary" label="Sign in" block></jl-button>
          </div>`;

export const doc: ComponentDoc = {
  className: 'JlAuthLayout',
  description: `The sign-in screen every SyWare app shares. On the left, a dark panel: the app's brand (slot brand,
its icon and wordmark), a headline whose words between asterisks take the brand's blue, a sentence, three points and
where the app comes from, with the SyWare mark large and faint in the corner. On the right, the form: the default
slot, centred.

The panel stays dark in both themes: it takes jlib's dark tokens itself, so what is slotted in it reads light on
dark. On a phone it shrinks to a band with the brand, above the form. Use it for signing in, choosing a first
password, or anything else before the app opens. See the Accounts and settings pattern.`,
  examples: [
    {
      html: `
        <div style="overflow: hidden; border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg)">
          <jl-auth-layout style="--min-height: 560px" pitch="Workflows that *ask* before they act." text="Automate the repetitive work. Whenever a decision matters, the workflow pauses and a person approves, corrects or rejects it." points='${POINTS}'>
            ${BRAND}
            ${FORM}
          </jl-auth-layout>
        </div>`,
      title: 'Signing in',
    },
  ],
  level: 'template',
  name: 'Auth layout',
  playground: {
    attributes: {
      origin: 'Made in Switzerland by SyWare',
      pitch: 'Order like a shop. *Pick with your phone.*',
      points: '["Order in a few taps, always for a job number","Pick with your phone, with barcodes or without"]',
      style: '--min-height: 480px',
      text: 'Employees order what their job needs, logistics prepares it, and the stock stays right.',
    },
    content: `<span slot="brand" style="display: inline-flex; align-items: center; gap: 10px; font-weight: 800; font-size: 20px">
  <jl-app-icon icon="package"></jl-app-icon><span>sw<span style="color: var(--jl-brand)">stock</span></span>
</span>
<jl-button variant="primary" label="Sign in"></jl-button>`,
    height: 520,
    width: 'full',
  },
  props: [
    {
      attribute: 'pitch',
      control: { kind: 'text' },
      default: "''",
      description: "What the app does, in a few words; *words* between asterisks take the brand's blue.",
      name: 'pitch',
      type: 'string',
    },
    {
      attribute: 'text',
      control: { kind: 'text' },
      default: "''",
      description: 'One or two sentences under the headline.',
      name: 'text',
      type: 'string',
    },
    {
      attribute: 'points',
      control: { kind: 'json' },
      default: '[]',
      description: 'What the app is good at, three at most.',
      name: 'points',
      type: 'string[]',
    },
    {
      attribute: 'origin',
      control: { kind: 'text' },
      default: "'Made in Switzerland by SyWare'",
      description: 'Where the app comes from, at the foot of the panel; empty shows nothing.',
      name: 'origin',
      type: 'string',
    },
  ],
  slots: [
    { description: 'The form, centred beside the panel.', name: '' },
    { description: "The app's brand: its icon and wordmark.", name: 'brand' },
  ],
  styling: [
    { description: 'The grid of the panel and the form.', name: 'base' },
    { description: 'The dark panel.', name: 'story' },
    { description: 'The side that holds the form.', name: 'side' },
    { description: 'Its least height: the whole screen (100dvh).', name: '--min-height' },
  ],
  summary: 'The sign-in screen every SyWare app shares: the brand on a dark panel, the form beside it.',
  tag: 'jl-auth-layout',
};
