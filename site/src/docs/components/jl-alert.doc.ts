import type { JlAlert, JlButton } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const TONE_OPTIONS = ['info', 'ok', 'warn', 'danger', 'neutral', 'accent'];

export const doc: ComponentDoc = {
  className: 'JlAlert',
  description: `An alert is a message in the flow of the page, coloured by its tone: info for a tip, ok for a success,
warn for something to check, danger for a failure. For a message that comes and goes on its own, use a toast.

Warnings and failures are role="alert", which interrupts a screen reader; the other tones are role="status", which
waits for a pause. Each tone has its icon: a sign filled in the tone's colour (the accent's sparkles stay drawn as
lines); icon names another one, drawn as lucide draws it, and icon="none" shows none.`,
  events: [
    {
      description: 'The × of a dismissible alert was pressed; the alert is now hidden.',
      detail: 'undefined',
      name: 'dismiss',
    },
  ],
  examples: [
    {
      html: `
        <div class="stack">
          <jl-alert>A new version is available. It installs the next time the app starts.</jl-alert>
          <jl-alert tone="ok">Your changes are saved.</jl-alert>
          <jl-alert tone="warn">Your card expires at the end of the month.</jl-alert>
          <jl-alert tone="danger">The import failed: 3 rows have no email address.</jl-alert>
          <jl-alert tone="neutral">This project is archived. It can be read, not changed.</jl-alert>
          <jl-alert tone="accent">Try the new editor: it is faster, and works offline.</jl-alert>
        </div>`,
      title: 'Tones',
    },
    {
      html: `
        <div class="stack">
          <jl-alert tone="danger" heading="The payment did not go through">
            The bank declined the card ending in 4242. Check its details or use another card.
          </jl-alert>
          <jl-alert tone="ok" heading="Domain verified" icon="shield-check">
            example.com now sends email signed with your key.
          </jl-alert>
        </div>`,
      title: 'With a heading',
    },
    {
      description: 'Buttons in slot="actions", under the text.',
      html: `
        <jl-alert tone="warn" heading="Two-factor authentication is off">
          Anyone with your password can sign in. Turn it on to protect your account.
          <jl-button slot="actions" size="sm" variant="primary" label="Turn on"></jl-button>
          <jl-button slot="actions" size="sm" variant="ghost" label="Remind me later"></jl-button>
        </jl-alert>`,
      title: 'With actions',
    },
    {
      description: 'The × hides the alert and fires dismiss.',
      html: `
        <div class="stack">
          <jl-alert class="demo-dismiss" tone="info" dismissible>You can now invite guests to a project.</jl-alert>
          <jl-alert tone="neutral" icon="none" dismissible>No icon, and an ×.</jl-alert>
          <div class="row"><jl-button class="demo-again" size="sm" icon="refresh" label="Show again"></jl-button></div>
        </div>`,
      script: `
        const alert = root.querySelector('.demo-dismiss');
        root.querySelector('.demo-again').events.register('press', () => {
          alert.hidden = false;
        });`,
      setup: (root) => {
        const alert = root.querySelector<JlAlert>('.demo-dismiss');
        root.querySelector<JlButton>('.demo-again')?.events.register('press', () => {
          if (alert !== null) {
            alert.hidden = false;
          }
        });
      },
      title: 'Dismissible',
    },
  ],
  level: 'molecule',
  methods: [
    {
      description: 'Hides the alert as its × does, and fires dismiss.',
      name: 'dismiss',
      signature: 'dismiss(): void',
    },
  ],
  name: 'Alert',
  playground: {
    attributes: { dismissible: true, heading: 'Scheduled maintenance', tone: 'info' },
    content: 'The app will be read-only on Sunday from 02:00 to 03:00 UTC.',
    width: 520,
  },
  props: [
    {
      attribute: 'tone',
      control: { kind: 'select', options: TONE_OPTIONS },
      default: "'info'",
      description: 'The colour and the icon, by meaning; warn and danger interrupt screen readers.',
      name: 'tone',
      type: "'info' | 'ok' | 'warn' | 'danger' | 'neutral' | 'accent'",
    },
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'A bold line above the text.',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "''",
      description: "An icon instead of the tone's own; none shows no icon.",
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'dismissible',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shows an × that hides the alert and fires dismiss.',
      name: 'dismissible',
      type: 'boolean',
    },
  ],
  slots: [
    { description: 'The message.', name: '' },
    { description: 'Buttons under the message.', name: 'actions' },
  ],
  styling: [{ description: 'The alert.', name: 'base' }],
  summary: 'A message in the page, coloured by its tone: a tip, a success, a warning, a failure.',
  tag: 'jl-alert',
};
