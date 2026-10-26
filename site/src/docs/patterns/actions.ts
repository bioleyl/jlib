import { list, rules, section, table, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

const FIELD_STYLE = 'width: 100%; max-width: 300px';

export const actions: PatternDoc = {
  components: ['jl-button', 'jl-menu', 'jl-tooltip', 'jl-kbd'],
  icon: 'mouse-pointer-click',
  label: 'Actions',
  lead: 'An action says what it does, sits where people expect it, and looks as important as it is. The same action has the same name and the same place in every app.',
  path: '/patterns/actions',
  sections: [
    section(
      'One primary action',
      text(
        'A view has one primary button at most: what most people came to do. The others are secondary (the default look) or ghost.'
      ),
      table(
        ['Variant', 'For', 'Examples'],
        [
          '`primary`',
          'The one main action of a page, a dialog or a form.',
          '"New order", "Send order", "Approve", "Save"',
        ],
        ['`secondary`', 'The other actions of the page, and Cancel.', '"Test run", "Open the workflow", "Cancel"'],
        ['`ghost`', 'Quiet actions in rows, toolbars and cards; back links.', '"See all", "Edit", "← Orders"'],
        [
          '`danger`',
          'The confirm button of what destroys, inside its confirmation: the last step only.',
          '"Delete user", "Cancel order"',
        ]
      ),
      rules(
        {
          preview:
            '<jl-button icon="ban" label="Cancel order"></jl-button><jl-button variant="primary" icon="list-checks" label="Prepare"></jl-button>',
          text: "The page's main action stands out. What destroys is a secondary button that asks before it acts.",
        },
        {
          preview:
            '<jl-button variant="danger" icon="ban" label="Cancel order"></jl-button><jl-button variant="primary" label="Prepare"></jl-button>',
          text: 'A red button in the header pulls the eye to what people do least, and should do with care.',
        }
      )
    ),
    section(
      'Words for actions',
      text(
        'A label is a verb, and its object when it is not obvious: "Send order", "Add to basket", "Start reviewing". In sentence case, and never "OK". These words mean the same in every app:'
      ),
      table(
        ['Say', 'For', 'Not'],
        [
          'New …',
          'Making a thing that did not exist: "New order", "New user", "New workflow".',
          '"Add a user", "Create"',
        ],
        [
          'Add …',
          'Putting something into something: "Add to basket", "Add a step".',
          '"New" for what goes into a list',
        ],
        ['Edit', 'Opening a thing to change it.', '"Modify", "Change"'],
        ['Save', 'Keeping the changes of a form.', '"OK", "Apply", "Submit"'],
        ['Delete', 'Destroying a thing: it is gone for everyone.', '"Remove" for the same'],
        [
          'Remove',
          'Taking it out of here, while it exists elsewhere: "Remove from basket".',
          '"Delete" for the same',
        ],
        [
          'Deactivate',
          'Keeping a thing and its history, out of use; "Activate" brings it back.',
          '"Delete" for people and things with a history',
        ],
        [
          'Cancel',
          'Leaving a dialog or a form without doing anything. When the action itself is called cancel ("Cancel order"), the way out says what it keeps: "Keep order".',
          '"Close", "No", two "Cancel" side by side',
        ],
        ['Sign in, Sign out', 'Starting and ending a session.', '"Log in", "Log out", "Logout"'],
        ['Try again', 'Running what failed once more.', '"Retry"'],
        ['Show more', 'Loading the next items of a list.', '"Load more", "Next"']
      ),
      text('See [Writing](/design/writing) for the voice, and translate these words once, for every app.')
    ),
    section(
      'Where actions go',
      table(
        ['Where', 'How'],
        [
          'Page header',
          'On the right; the primary at the end, the others before it, the rest in a **More** menu.',
        ],
        ['Dialog', 'In its footer, on the right: **Cancel**, then the primary at the end.'],
        [
          'Form page',
          'Under the last field, on the left, the primary first: the eye goes down the fields and finds it.',
        ],
        ['Row, card', 'At the end, as icon buttons with hints; the rest in a **More** menu.'],
        [
          'Phone',
          "A task's main action in a bar along the bottom, full width, within the thumb's reach. See [Phones and touch](/patterns/phones).",
        ]
      )
    ),
    section(
      'Icon buttons',
      list(
        'Only for actions whose icon everyone knows: edit (`pencil`), delete (`trash`), close (`x`), more (`ellipsis`), copy (`copy`), search.',
        'Always with a `hint`, which is both their tooltip and the name screen readers say. Make it precise: "Edit Rita Keller", "Delete the picture".',
        'Every other action has a text label, with an icon before it when the icon helps to recognise it.'
      )
    ),
    section(
      'Disabled and busy',
      list(
        'A submit button is not disabled to say a form is incomplete: people press it, and the form shows what is missing. A disabled button explains nothing.',
        'An action is disabled only when it is impossible for a reason the page shows, beside it or in its hint: "Out of stock", "15 of 15 users".',
        'An action that takes time shows `loading` on its button, and cannot be pressed twice.',
        'Once done, the page shows the result. See [Feedback](/patterns/feedback).'
      ),
      rules(
        {
          preview: `<div class="stack" style="${FIELD_STYLE}"><jl-field label="Job number" required error="Enter the job number, like CH-2026-0160."><jl-input invalid></jl-input></jl-field><jl-button variant="primary" label="Send order"></jl-button></div>`,
          text: 'Pressed too early, the form says what is missing, where.',
        },
        {
          preview: `<div class="stack" style="${FIELD_STYLE}"><jl-field label="Job number" required><jl-input></jl-input></jl-field><jl-button variant="primary" label="Send order" disabled></jl-button></div>`,
          text: 'Disabled until the form is complete: nothing says why.',
        }
      )
    ),
    section(
      'Links and buttons',
      text(
        'Going somewhere is a link; doing something is a button. A button that only opens a page takes an `href` (`<jl-button href="…">`): it looks the same, and opens in a new tab with a middle click, like any link.'
      )
    ),
  ],
  summary: 'One primary action, the shared verbs, where actions go, and when they are disabled.',
  title: 'Actions',
};
