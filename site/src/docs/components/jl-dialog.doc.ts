import type { JlButton, JlDialog } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

/** Opens the dialog of an example when its button is pressed. */
function openOnPress(root: HTMLElement, buttonSelector: string, dialogSelector: string): void {
  const button = root.querySelector<JlButton>(buttonSelector);
  const dialog = root.querySelector<JlDialog>(dialogSelector);
  button?.events.register('press', () => dialog?.show());
}

/** Closes the dialog when one of its action buttons is pressed. */
function closeOnActions(root: HTMLElement, dialogSelector: string): void {
  const dialog = root.querySelector<JlDialog>(dialogSelector);
  for (const button of root.querySelectorAll<JlButton>(`${dialogSelector} jl-button`)) {
    button.events.register('press', () => dialog?.close());
  }
}

export const doc: ComponentDoc = {
  className: 'JlDialog',
  description: `A modal on the browser's own dialog element: the page behind is inert, focus stays inside, Escape and a
click on the backdrop close it (unless persistent). Put the content in the default slot and the buttons in the
actions slot; the footer only shows when there are some.

Open it with the open attribute, or show() from code; it emits close however it closed.`,
  events: [
    { description: 'The dialog opened.', detail: 'undefined', name: 'open' },
    {
      description: 'The dialog closed: a button, Escape, the backdrop or close().',
      detail: 'undefined',
      name: 'close',
    },
  ],
  examples: [
    {
      html: `
        <div class="row">
          <jl-button class="open-basic" variant="primary" label="Invite people"></jl-button>
        </div>
        <jl-dialog class="basic" heading="Invite people" description="They get an email with a link to join the project.">
          <div class="stack">
            <jl-input type="email" icon="mail" placeholder="name@example.com"></jl-input>
            <p class="muted">Separate several addresses with commas.</p>
          </div>
          <jl-button slot="actions" label="Cancel"></jl-button>
          <jl-button slot="actions" variant="primary" label="Send invites"></jl-button>
        </jl-dialog>`,
      script: `
        const dialog = root.querySelector('jl-dialog.basic');
        root.querySelector('.open-basic').events.register('press', () => dialog.show());
        for (const button of dialog.querySelectorAll('jl-button')) {
          button.events.register('press', () => dialog.close());
        }`,
      setup: (root) => {
        openOnPress(root, '.open-basic', 'jl-dialog.basic');
        closeOnActions(root, 'jl-dialog.basic');
      },
      title: 'A dialog with actions',
    },
    {
      description: 'Persistent: Escape and the backdrop do nothing; only its own buttons close it.',
      html: `
        <div class="row">
          <jl-button class="open-danger" variant="danger" icon="trash" label="Delete project"></jl-button>
        </div>
        <jl-dialog class="danger" size="sm" heading="Delete this project?" persistent>
          <p>The project and its 24 files are deleted for everyone. This cannot be undone.</p>
          <jl-button slot="actions" label="Keep it"></jl-button>
          <jl-button slot="actions" variant="danger" label="Delete"></jl-button>
        </jl-dialog>`,
      script: `
        const dialog = root.querySelector('jl-dialog.danger');
        root.querySelector('.open-danger').events.register('press', () => dialog.show());`,
      setup: (root) => {
        openOnPress(root, '.open-danger', 'jl-dialog.danger');
        closeOnActions(root, 'jl-dialog.danger');
      },
      title: 'Confirmation',
    },
    {
      html: `
        <div class="row">
          <jl-button class="open-large" label="Open a large dialog"></jl-button>
        </div>
        <jl-dialog class="large" size="lg" heading="Release notes" description="Version 0.1">
          <div class="stack">
            <p>The first release of jlib: atoms, molecules, organisms and templates on native Web Components.</p>
            <jl-code-block language="bash" code="npm install @syware/jlib @jadis/core"></jl-code-block>
          </div>
        </jl-dialog>`,
      setup: (root) => openOnPress(root, '.open-large', 'jl-dialog.large'),
      title: 'Sizes',
    },
  ],
  level: 'organism',
  methods: [
    { description: 'Opens the dialog.', name: 'show', signature: 'show(): void' },
    { description: 'Closes the dialog.', name: 'close', signature: 'close(): void' },
  ],
  name: 'Dialog',
  playground: {
    attributes: { description: 'A short sentence under the heading.', heading: 'Dialog heading' },
    content:
      '<p>The content of the dialog.</p>\n<jl-button slot="actions" label="Cancel"></jl-button>\n<jl-button slot="actions" variant="primary" label="Confirm"></jl-button>',
    height: 160,
    setup: (element) => {
      const dialog = element as JlDialog;
      const opener = document.createElement('jl-button') as JlButton;
      opener.setAttribute('label', 'Open the dialog');
      opener.setAttribute('variant', 'primary');
      opener.events.register('press', () => dialog.show());
      dialog.before(opener);
      for (const button of dialog.querySelectorAll<JlButton>('jl-button')) {
        button.events.register('press', () => dialog.close());
      }
    },
  },
  props: [
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'The title.',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'description',
      control: { kind: 'text' },
      default: "''",
      description: 'A sentence under the title.',
      name: 'description',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg', 'full'] },
      default: "'md'",
      description: 'The width: 400, 520, 820 pixels, or the whole window.',
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'full'",
    },
    {
      attribute: 'open',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Whether it is open.',
      name: 'open',
      type: 'boolean',
    },
    {
      attribute: 'persistent',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Escape and the backdrop do not close it, and it has no close button.',
      name: 'persistent',
      type: 'boolean',
    },
  ],
  slots: [
    { description: 'The content.', name: '' },
    { description: 'The buttons, at the bottom right.', name: 'actions' },
  ],
  styling: [{ description: 'The native dialog element.', name: 'base' }],
  summary: 'A modal window over the page, for a task or a decision that needs full attention.',
  tag: 'jl-dialog',
};
