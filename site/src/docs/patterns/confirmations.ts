import { code, list, note, rules, section, table, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

/** A confirmation drawn in the page, as the dialog of confirmDialog shows it. */
const confirmation = (heading: string, body: string, buttons: string): string => `
  <div style="display: grid; gap: 10px; width: 100%; max-width: 380px; padding: 20px; border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg); background: var(--jl-surface)">
    <strong style="font-size: 16px">${heading}</strong>
    <span style="color: var(--jl-text-2); font-size: 13px">${body}</span>
    <div class="row" style="justify-content: flex-end; margin-top: 6px">${buttons}</div>
  </div>`;

export const confirmations: PatternDoc = {
  components: ['jl-confirm', 'jl-toast', 'jl-dialog'],
  icon: 'undo-2',
  label: 'Confirm and undo',
  lead: 'People must be able to act fast without fear. What can be taken back is done at once and offers Undo; what cannot asks once, and names what will be lost.',
  path: '/patterns/confirmations',
  sections: [
    section(
      'Ask or undo',
      table(
        ['The action', 'Then', 'For example'],
        [
          'Can be taken back',
          'Do it at once, and offer **Undo** in a toast.',
          'Remove from the basket, mark as read, archive, switch a workflow off.',
        ],
        [
          'Cannot, but small and alone',
          'Do it with **Undo** if the server can wait before it deletes; ask otherwise.',
          'Delete an empty category, remove a picture.',
        ],
        [
          'Cannot, or touches others',
          'Ask with `confirmDialog`, naming the consequence.',
          'Cancel an order, stop a run, delete a user, give a new password.',
        ],
        ['Large and final', 'Ask, and have the name typed to confirm.', 'Delete a company and all its data.']
      ),
      note(
        'Asking too often teaches people to confirm without reading. Ask only where a mistake costs something, and then make the question worth reading.'
      )
    ),
    section(
      'The confirmation',
      text("jlib's `confirmDialog`, never `window.confirm`:"),
      code(
        'ts',
        `
        import { confirmDialog } from '@syware/jlib';

        const cancel = await confirmDialog({
          heading: \`Cancel order #\${order.number}?\`,
          text: 'Its reservations are released. This cannot be undone.',
          confirmLabel: 'Cancel order',
          cancelLabel: 'Keep order',
          tone: 'danger',
        });`
      ),
      list(
        'The heading is the question, with the thing named: "Cancel order #3?", "Stop this run?", "Delete Rita Keller?"',
        'The text says what happens, and what is kept: "Its reservations are released. This cannot be undone.", "The decisions she made stay recorded with her name."',
        'The confirm button repeats the verb: **Cancel order**, **Stop run**, **Delete user**. Never "Yes" or "OK".',
        'The way out is **Cancel**, unless the action is itself a cancel: then it says what it keeps, **Keep order**.',
        'With the danger tone, the focus starts on the way out: Enter does not destroy.'
      ),
      rules(
        {
          preview: confirmation(
            'Cancel order #3?',
            'Its reservations are released. This cannot be undone.',
            '<jl-button label="Keep order"></jl-button><jl-button variant="danger" label="Cancel order"></jl-button>'
          ),
          text: 'The thing named, the consequence said, two buttons that cannot be confused.',
        },
        {
          preview: confirmation(
            'Are you sure?',
            'This action cannot be undone.',
            '<jl-button label="Cancel"></jl-button><jl-button variant="danger" label="OK"></jl-button>'
          ),
          text: 'Sure of what? And which button keeps the order: Cancel, or OK?',
        }
      )
    ),
    section(
      'Reasons',
      text(
        'When an action needs a reason (rejecting, cancelling the order of someone else, closing it incomplete), the same dialog asks for it: the usual reasons as chips, and a text for the rest. The reason goes where the people it affects will read it.'
      )
    ),
    section(
      'Undo',
      list(
        'The action of the toast, **Undo**, for 8 seconds: the page goes back to how it was.',
        'The server keeps the thing until then (or marks it, and cleans up later), so Undo cannot fail.',
        'In a form or an editor, a changed value can be put back where it is: "Was 12", **Undo**.'
      )
    ),
    section(
      'Delete, remove, deactivate',
      text(
        'People and things with a history (users, articles, workflows) are deactivated rather than deleted: they leave the lists and the choices, their history keeps their name, and they can come back. Delete is for what has no history, or on request.'
      )
    ),
  ],
  summary: 'Which actions ask first, which offer Undo, and how they say it.',
  title: 'Confirm and undo',
};
