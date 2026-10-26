import { toast } from 'jlib';

import type { JlButton, JlDialog, JlToaster, ToastOptions } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

const TONE_TOASTS: Record<string, ToastOptions> = {
  danger: { heading: 'Payment failed', text: 'The card was declined. Try another one.', tone: 'danger' },
  info: { heading: 'Update available', text: 'Version 2.4 brings offline mode.', tone: 'info' },
  neutral: { heading: 'Link copied', text: 'Anyone with the link can view the board.' },
  ok: { heading: 'Changes saved', text: 'Your profile is up to date.', tone: 'ok' },
  warn: { heading: 'Storage almost full', text: 'You have used 92% of 10 GB.', tone: 'warn' },
};

/** Calls `action` when the button of the example is pressed. */
function onPress(root: HTMLElement, selector: string, action: () => void): void {
  root.querySelector<JlButton>(selector)?.events.register('press', action);
}

export const doc: ComponentDoc = {
  className: 'JlToaster',
  description: `The toaster is the place where toasts appear: a corner or an edge of the window, the newest nearest the
edge, at most max at a time (older ones wait for newer ones to close). It sits in the top layer, so its toasts show
over open dialogs too, and it is a polite live region: screen readers read each new toast without being cut off.

Most pages never write one: import toast from jlib and call toast({ heading, text, tone }) from anywhere. It
finds the page's toaster, or puts one at the end of the body the first time, and returns a handle whose dismiss()
closes the toast early. Its toasts close after 5 seconds and have a close button, unless the options say
otherwise. Write a jl-toaster in the page yourself to choose the placement: toast() then uses it.`,
  examples: [
    {
      description: 'toast() from anywhere: the first call puts a toaster at the bottom right of the page.',
      html: `
        <div class="row">
          <jl-button class="tone-neutral" label="Neutral"></jl-button>
          <jl-button class="tone-ok" icon="circle-check" label="Saved"></jl-button>
          <jl-button class="tone-info" icon="info" label="Info"></jl-button>
          <jl-button class="tone-warn" icon="triangle-alert" label="Warning"></jl-button>
          <jl-button class="tone-danger" icon="circle-x" label="Error"></jl-button>
        </div>`,
      script: `
        import { toast } from 'jlib';

        root.querySelector('.tone-ok').events.register('press', () =>
          toast({ heading: 'Changes saved', text: 'Your profile is up to date.', tone: 'ok' })
        );
        root.querySelector('.tone-danger').events.register('press', () =>
          toast({ heading: 'Payment failed', text: 'The card was declined. Try another one.', tone: 'danger' })
        );
        // … one button per tone`,
      setup: (root) => {
        for (const [tone, options] of Object.entries(TONE_TOASTS)) {
          onPress(root, `.tone-${tone}`, () => toast(options));
        }
      },
      title: 'Each tone',
    },
    {
      description: 'An action such as Undo: onAction runs, then the toast closes.',
      html: `
        <div class="row">
          <jl-button class="archive" icon="inbox" label="Archive the message"></jl-button>
        </div>`,
      script: `
        root.querySelector('.archive').events.register('press', () =>
          toast({
            heading: 'Message archived',
            text: 'It moved to the Archive folder.',
            actionLabel: 'Undo',
            duration: 8000,
            onAction: () => toast({ heading: 'Message restored', tone: 'ok' }),
          })
        );`,
      setup: (root) =>
        onPress(root, '.archive', () =>
          toast({
            actionLabel: 'Undo',
            duration: 8000,
            heading: 'Message archived',
            onAction: () => toast({ heading: 'Message restored', tone: 'ok' }),
            text: 'It moved to the Archive folder.',
          })
        ),
      title: 'With an action',
    },
    {
      description: 'A toast that stays (duration 0) while the work runs, closed from code by its handle.',
      html: `
        <div class="row">
          <jl-button class="upload" variant="primary" icon="upload" label="Upload report.pdf"></jl-button>
        </div>`,
      script: `
        root.querySelector('.upload').events.register('press', () => {
          const pending = toast({ heading: 'Uploading report.pdf…', icon: 'upload', duration: 0, closable: false });
          setTimeout(() => {
            pending.dismiss();
            toast({ heading: 'report.pdf uploaded', text: '2.4 MB, shared with the team.', tone: 'ok' });
          }, 2000);
        });`,
      setup: (root) =>
        onPress(root, '.upload', () => {
          const pending = toast({
            closable: false,
            duration: 0,
            heading: 'Uploading report.pdf…',
            icon: 'upload',
          });
          setTimeout(() => {
            pending.dismiss();
            toast({ heading: 'report.pdf uploaded', text: '2.4 MB, shared with the team.', tone: 'ok' });
          }, 2000);
        }),
      title: 'Closing from code',
    },
    {
      description: 'A toaster of your own decides where its toasts go: notify() shows one in it.',
      html: `
        <div class="row">
          <jl-button class="top" label="Notify at the top"></jl-button>
        </div>
        <jl-toaster class="top-toaster" placement="top-center" max="2"></jl-toaster>`,
      script: `
        const toaster = root.querySelector('jl-toaster');
        root.querySelector('.top').events.register('press', () =>
          toaster.notify({ heading: 'Connected', text: 'Live updates are on.', tone: 'info' })
        );`,
      setup: (root) => {
        const toaster = root.querySelector<JlToaster>('jl-toaster.top-toaster');
        onPress(root, '.top', () =>
          toaster?.notify({ heading: 'Connected', text: 'Live updates are on.', tone: 'info' })
        );
      },
      title: 'Placement',
    },
    {
      description: 'In the top layer, toasts show over an open dialog.',
      html: `
        <div class="row">
          <jl-button class="open-settings" label="Open settings"></jl-button>
        </div>
        <jl-dialog class="settings" heading="Notifications" size="sm">
          <p>Save to see the toast over this dialog.</p>
          <jl-button slot="actions" class="save" variant="primary" label="Save"></jl-button>
        </jl-dialog>`,
      script: `
        const dialog = root.querySelector('jl-dialog');
        root.querySelector('.open-settings').events.register('press', () => dialog.show());
        root.querySelector('.save').events.register('press', () =>
          toast({ heading: 'Settings saved', tone: 'ok' })
        );`,
      setup: (root) => {
        const dialog = root.querySelector<JlDialog>('jl-dialog.settings');
        onPress(root, '.open-settings', () => dialog?.show());
        onPress(root, '.save', () => toast({ heading: 'Settings saved', tone: 'ok' }));
      },
      title: 'Over a dialog',
    },
  ],
  level: 'organism',
  methods: [
    {
      description: 'Shows a toast in this toaster: 5 seconds and a close button unless the options say otherwise.',
      name: 'notify',
      signature: 'notify(options: ToastOptions): ToastHandle',
    },
    {
      description:
        "A function, not a method: shows a toast in the page's toaster, made on first use. Options: heading, text, tone, icon, duration, closable, actionLabel, onAction.",
      name: 'toast',
      signature: 'toast(options: ToastOptions): { dismiss(): void }',
    },
  ],
  name: 'Toaster',
  playground: {
    attributes: { max: '3', placement: 'bottom-right' },
    setup: (element) => {
      const toaster = element as JlToaster;
      const sample = Object.values(TONE_TOASTS);
      const counter = { next: 0 };
      const button = document.createElement('jl-button') as JlButton;
      button.setAttribute('label', 'Show a toast');
      button.setAttribute('variant', 'primary');
      button.events.register('press', () => {
        const options = sample[counter.next % sample.length] ?? {};
        counter.next += 1;
        toaster.notify(options);
      });
      toaster.before(button);
    },
  },
  props: [
    {
      attribute: 'placement',
      control: {
        kind: 'select',
        options: ['bottom-right', 'bottom-center', 'bottom-left', 'top-right', 'top-center'],
      },
      default: "'bottom-right'",
      description: 'Where the toasts stack.',
      name: 'placement',
      type: "'top-right' | 'top-center' | 'bottom-right' | 'bottom-center' | 'bottom-left'",
    },
    {
      attribute: 'max',
      control: { kind: 'number', max: 20, min: 1 },
      default: '3',
      description: 'How many toasts show at once; the older ones wait.',
      name: 'max',
      type: 'number',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "'Notifications'",
      description: 'The name of the region for screen readers.',
      name: 'label',
      type: 'string',
    },
  ],
  slots: [{ description: 'The toasts; notify() and toast() add them here.', name: '' }],
  styling: [
    { description: 'The region in the top layer that holds the toasts.', name: 'base' },
    { description: 'The width of the toasts: 380px.', name: '--width' },
    { description: 'The distance from the edges of the window: 16px.', name: '--edge' },
  ],
  summary: 'The corner of the window where toasts stack, and toast() to show one from anywhere.',
  tag: 'jl-toaster',
};
