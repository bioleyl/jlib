import type { JlButton, JlToast } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlToast',
  description: `A toast says something happened, without stopping anyone: saved, copied, failed, a new version. Most pages
never write one: they call toast() and the page's toaster stacks it in a corner (see Toaster). Write a jl-toast
yourself to show one in place, in a panel or in a preview.

With a duration it closes by itself; a thin line at the bottom shows the time left, and pauses while the pointer
or the focus is on the toast, so nobody loses a message while reading it. An action button (Undo, Retry, View)
emits action and closes the toast. Every way it closes ends with dismiss.`,
  events: [
    { description: 'The action button was pressed; the toast then closes.', detail: 'undefined', name: 'action' },
    {
      description: 'The toast closed: its close button, its action, its time, or dismiss().',
      detail: 'undefined',
      name: 'dismiss',
    },
  ],
  examples: [
    {
      description:
        "The tone tints the toast, as it does jl-alert, and colours its time line; each tone has its own icon, filled in the tone's colour, unless one is given.",
      html: `
        <div class="stack narrow">
          <jl-toast heading="Link copied" text="Anyone with the link can view the board."></jl-toast>
          <jl-toast tone="ok" heading="Changes saved" text="Your profile is up to date."></jl-toast>
          <jl-toast tone="info" heading="Update available" text="Version 2.4 brings offline mode."></jl-toast>
          <jl-toast tone="warn" heading="Storage almost full" text="You have used 92% of 10 GB."></jl-toast>
          <jl-toast tone="danger" heading="Payment failed" text="The card was declined. Try another one."></jl-toast>
        </div>`,
      title: 'Tones',
    },
    {
      description: 'An action and a close button. The action emits action, then the toast closes.',
      html: `
        <div class="stack narrow">
          <jl-toast class="undo" heading="Message archived" action-label="Undo" closable></jl-toast>
          <jl-toast tone="danger" icon="upload" heading="Upload failed" text="report-q3.pdf could not be sent." action-label="Retry" closable></jl-toast>
          <p class="muted undo-answer">Press Undo or close a toast.</p>
        </div>`,
      script: `
        const answer = root.querySelector('.undo-answer');
        for (const toast of root.querySelectorAll('jl-toast')) {
          toast.events.register('action', () => (answer.textContent = \`Action: \${toast.actionLabel.get()}\`));
          toast.events.register('dismiss', () => (answer.textContent += ' (dismissed)'));
        }`,
      setup: (root) => {
        const answer = root.querySelector('.undo-answer');
        for (const toast of root.querySelectorAll<JlToast>('jl-toast')) {
          toast.events.register('action', () => {
            if (answer !== null) {
              answer.textContent = `Action: ${toast.actionLabel.get()}`;
            }
          });
          toast.events.register('dismiss', () => {
            if (answer !== null) {
              answer.textContent += ' (dismissed)';
            }
          });
        }
      },
      title: 'With an action',
    },
    {
      description: 'With a duration (here 6 seconds) it closes by itself; hover it to pause the line.',
      html: `
        <div class="stack narrow">
          <jl-toast class="timed" tone="ok" heading="Invite sent" text="ada@example.com can join in the next 7 days." duration="6000" closable></jl-toast>
          <div class="row">
            <jl-button class="again" icon="refresh" label="Show it again"></jl-button>
          </div>
        </div>`,
      script: `
        const toast = root.querySelector('jl-toast.timed');
        root.querySelector('.again').events.register('press', () => toast.show());`,
      setup: (root) => {
        const toast = root.querySelector<JlToast>('jl-toast.timed');
        root.querySelector<JlButton>('.again')?.events.register('press', () => toast?.show());
      },
      title: 'Closing by itself',
    },
    {
      description: 'The default slot takes more than a line of text.',
      html: `
        <div class="narrow">
          <jl-toast tone="info" icon="users" heading="3 people joined Design review" closable>
            <p class="muted">Mila, Ben and Zoë accepted your invitation.</p>
          </jl-toast>
        </div>`,
      title: 'Rich content',
    },
  ],
  level: 'molecule',
  methods: [
    {
      description: 'Closes the toast: it leaves, hides, then emits dismiss.',
      name: 'dismiss',
      signature: 'dismiss(): void',
    },
    {
      description: 'Shows a dismissed toast again, its time counted from the start.',
      name: 'show',
      signature: 'show(): void',
    },
  ],
  name: 'Toast',
  playground: {
    attributes: {
      'action-label': 'Undo',
      closable: true,
      heading: 'Changes saved',
      text: 'Your profile is up to date.',
      tone: 'ok',
    },
  },
  props: [
    {
      attribute: 'tone',
      control: { kind: 'select', options: ['neutral', 'ok', 'warn', 'danger', 'info'] },
      default: "'neutral'",
      description: 'The colour of the icon and of the time line.',
      name: 'tone',
      type: "'neutral' | 'ok' | 'warn' | 'danger' | 'info'",
    },
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'The first line, in bold.',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'text',
      control: { kind: 'text' },
      default: "''",
      description: 'The line under the heading.',
      name: 'text',
      type: 'string',
    },
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "''",
      description: "An icon name; the tone's icon when empty.",
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'closable',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shows a close button.',
      name: 'closable',
      type: 'boolean',
    },
    {
      attribute: 'action-label',
      control: { kind: 'text' },
      default: "''",
      description: 'The text of a quiet button that emits action, then closes the toast.',
      name: 'actionLabel',
      type: 'string',
    },
    {
      attribute: 'duration',
      control: { kind: 'number', min: 0, step: 1000 },
      default: '0',
      description: 'How long it stays, in milliseconds; 0 keeps it until it is closed. Hover and focus pause it.',
      name: 'duration',
      type: 'number',
    },
    {
      attribute: 'working',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shows a progress bar under the text, while the work the toast tells about runs.',
      name: 'working',
      type: 'boolean',
    },
    {
      attribute: 'progress',
      control: { kind: 'number', max: 100, min: 0, step: 10 },
      default: 'null',
      description: 'How far that work is, in percent; without it, the bar runs back and forth.',
      name: 'progress',
      type: 'number | null',
    },
  ],
  slots: [{ description: 'More content under the text.', name: '' }],
  styling: [{ description: 'The toast box.', name: 'base' }],
  summary: 'A short notification that something happened, with an optional action, that can close by itself.',
  tag: 'jl-toast',
};
