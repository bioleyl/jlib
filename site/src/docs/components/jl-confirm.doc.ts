import { confirmDialog } from 'jlib';

import type { ConfirmOptions, JlButton, JlConfirm } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

/** Asks when the button is pressed, and writes the answer in the example. */
function askOnPress(root: HTMLElement, buttonSelector: string, ask: () => Promise<boolean>): void {
  const answer = root.querySelector('.answer');
  root.querySelector<JlButton>(buttonSelector)?.events.register('press', async () => {
    const confirmed = await ask();
    if (answer !== null) {
      answer.textContent = `The answer: ${confirmed}`;
    }
  });
}

const DELETE_PROJECT: ConfirmOptions = {
  cancelLabel: 'Keep it',
  confirmLabel: 'Delete project',
  heading: 'Delete “Q3 roadmap”?',
  text: 'The project and its 24 files are deleted for everyone. This cannot be undone.',
  tone: 'danger',
};

const PUBLISH: ConfirmOptions = {
  confirmLabel: 'Publish',
  heading: 'Publish the release notes?',
  text: 'Everyone following the project gets an email.',
};

export const doc: ComponentDoc = {
  className: 'JlConfirm',
  description: `A yes-or-no question before something that matters: deleting, publishing, leaving with unsaved
changes. confirmDialog() asks it in one line of code and resolves the answer: true when confirmed, false when
cancelled with the button, Escape or a click outside. It makes a jl-confirm, adds it to the page, and removes it
once answered.

The danger tone draws the confirm button in red and starts the focus on Cancel, so a quick Enter never destroys
anything; the accent tone starts on the confirm button. Write the jl-confirm element yourself to ask the same
question several times, with ask().`,
  events: [
    { description: 'The question was confirmed.', detail: 'undefined', name: 'confirm' },
    {
      description: 'The question was cancelled: its button, Escape or the backdrop.',
      detail: 'undefined',
      name: 'cancel',
    },
  ],
  examples: [
    {
      description: 'confirmDialog() resolves the answer; the dialog goes away once answered.',
      html: `
        <div class="row">
          <jl-button class="delete" variant="danger" icon="trash" label="Delete project"></jl-button>
          <span class="muted answer">No answer yet.</span>
        </div>`,
      script: `
        import { confirmDialog } from 'jlib';

        const answer = root.querySelector('.answer');
        root.querySelector('.delete').events.register('press', async () => {
          const confirmed = await confirmDialog({
            heading: 'Delete “Q3 roadmap”?',
            text: 'The project and its 24 files are deleted for everyone. This cannot be undone.',
            confirmLabel: 'Delete project',
            cancelLabel: 'Keep it',
            tone: 'danger',
          });
          answer.textContent = \`The answer: \${confirmed}\`;
        });`,
      setup: (root) => askOnPress(root, '.delete', () => confirmDialog(DELETE_PROJECT)),
      title: 'Asking with confirmDialog()',
    },
    {
      description: 'The accent tone, for a decision that destroys nothing.',
      html: `
        <div class="row">
          <jl-button class="publish" variant="primary" icon="rocket" label="Publish"></jl-button>
          <span class="muted answer">No answer yet.</span>
        </div>`,
      script: `
        const confirmed = await confirmDialog({
          heading: 'Publish the release notes?',
          text: 'Everyone following the project gets an email.',
          confirmLabel: 'Publish',
        });`,
      setup: (root) => askOnPress(root, '.publish', () => confirmDialog(PUBLISH)),
      title: 'Accent',
    },
    {
      description: 'The element in the page, asked again at each press; rich content goes in its slot.',
      html: `
        <div class="row">
          <jl-button class="leave" icon="log-out" label="Leave the workspace"></jl-button>
          <span class="muted answer">No answer yet.</span>
        </div>
        <jl-confirm class="leave-question" heading="Leave Acme?" confirm-label="Leave" tone="danger">
          <p class="muted">You lose access to its 12 projects. An admin can invite you back.</p>
        </jl-confirm>`,
      script: `
        const question = root.querySelector('jl-confirm');
        root.querySelector('.leave').events.register('press', async () => {
          answer.textContent = \`The answer: \${await question.ask()}\`;
        });`,
      setup: (root) => {
        const question = root.querySelector<JlConfirm>('jl-confirm.leave-question');
        askOnPress(root, '.leave', () => question?.ask() ?? Promise.resolve(false));
      },
      title: 'As an element',
    },
  ],
  level: 'organism',
  methods: [
    {
      description: 'Opens the question; resolves true when confirmed, false otherwise.',
      name: 'ask',
      signature: 'ask(): Promise<boolean>',
    },
    {
      description:
        'A function, not a method: asks in a new jl-confirm and removes it once answered. Options: heading, text, confirmLabel, cancelLabel, tone.',
      name: 'confirmDialog',
      signature: 'confirmDialog(options: ConfirmOptions): Promise<boolean>',
    },
  ],
  name: 'Confirm',
  playground: {
    attributes: {
      'confirm-label': 'Discard',
      heading: 'Discard your changes?',
      text: 'The edits since your last save are lost.',
      tone: 'danger',
    },
    setup: (element) => {
      const question = element as JlConfirm;
      const opener = document.createElement('jl-button') as JlButton;
      opener.setAttribute('label', 'Ask');
      opener.setAttribute('variant', 'primary');
      opener.events.register('press', () => void question.ask());
      question.before(opener);
    },
  },
  props: [
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'The question.',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'text',
      control: { kind: 'text' },
      default: "''",
      description: 'What follows from the answer.',
      name: 'text',
      type: 'string',
    },
    {
      attribute: 'confirm-label',
      control: { kind: 'text' },
      default: "'Confirm'",
      description: 'The confirm button: say what it does, "Delete", rather than "OK".',
      name: 'confirmLabel',
      type: 'string',
    },
    {
      attribute: 'cancel-label',
      control: { kind: 'text' },
      default: "'Cancel'",
      description: 'The cancel button.',
      name: 'cancelLabel',
      type: 'string',
    },
    {
      attribute: 'tone',
      control: { kind: 'select', options: ['accent', 'danger'] },
      default: "'accent'",
      description: 'The colour of the confirm button; danger also starts the focus on Cancel.',
      name: 'tone',
      type: "'accent' | 'danger'",
    },
  ],
  slots: [{ description: 'More content under the text.', name: '' }],
  summary: 'A yes-or-no question in a small modal, and confirmDialog() to ask it with await.',
  tag: 'jl-confirm',
};
