import { code, list, note, rules, section, table, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

const WIDTH = 'width: 100%; max-width: 340px';

export const forms: PatternDoc = {
  components: ['jl-field', 'jl-input', 'jl-select', 'jl-number-input', 'jl-file-drop', 'jl-alert', 'jl-confirm'],
  icon: 'text-cursor-input',
  label: 'Forms',
  lead: 'A form asks only what it needs, keeps what people typed, saves in a way they can tell, and shows what is wrong where it is wrong.',
  path: '/patterns/forms',
  sections: [
    section(
      'How a form saves',
      text('Each form saves in one of four ways, chosen by what it is for:'),
      table(
        ['Way', 'When', 'How it looks'],
        [
          'Dialog with Save',
          'A small thing made or changed where it is listed: a user, a category, a connection.',
          'Fields in a `jl-dialog`, **Cancel** and **Save** in its footer. Once saved, the dialog closes and the list shows the change.',
        ],
        [
          'Page with Save',
          'A larger thing, or one with parts: an article and its picture.',
          'Sections on a form-width page, **Save** under the last field. Once saved, a toast; the page stays.',
        ],
        [
          'Autosave',
          'Work people do over time and come back to: an editor, a basket, a draft.',
          'No Save button. The state, where people look: "Saving…", "All changes saved", "Not saved: retrying".',
        ],
        [
          'At once',
          'One setting, one control: a switch, the theme, the language.',
          'Applies on change and shows its new state; a toast only when the effect is out of sight.',
        ]
      ),
      note(
        'One form, one way: a form with a Save button saves nothing before it is pressed, and an autosaving one has no Save button "to be sure".'
      )
    ),
    section(
      'Layout',
      list(
        'One column; each field in a `jl-field`, its label above, its hint under the label, its error under the field.',
        'Fields as wide as their answer: a quantity or a postcode is short, a description takes the column.',
        'Two fields side by side only when they belong together and are short: a reference and its category.',
        'Groups of fields under `h3` headings, in the order people think of them; the optional groups last.',
        'Nothing asked that the app knows or can find: today, the company, the last job number come filled in, and can be changed.'
      )
    ),
    section(
      'Required and optional',
      list(
        'A field that must be answered has `required` on its `jl-field`, which marks it with an asterisk.',
        'When almost every field is required, mark the few others "(optional)" in their label instead.',
        'A sign-in form needs no marks: both its fields are obviously needed.'
      )
    ),
    section(
      'Checking answers',
      list(
        '**On submit, first.** Nothing is wrong before people have tried: a field never says "Required" before it was touched or the form was sent.',
        '**Then as they fix it.** A field that shows an error checks again on each change, and the error goes as soon as the answer is right.',
        '**Formats when leaving a field**: an email address, a date, a number out of its range.',
        '**Which, and how**: the error under its field says how to put it right, "Enter the job number, like CH-2026-0160", never "Some fields are missing or wrong."',
        'A submit with errors moves the focus to the first wrong field. A long form also lists the errors in a `jl-alert` at its top.',
        "What the server refuses goes under its field when it is about one; anything else in a `jl-alert` at the top of the form, or above a dialog's buttons. Not in a toast: the toast goes, the form stays."
      ),
      rules(
        {
          preview: `<jl-field label="Job number" required error="Enter the job number, like CH-2026-0160." style="${WIDTH}"><jl-input invalid></jl-input></jl-field>`,
          text: 'Under the field, with how to put it right.',
        },
        {
          preview: `<jl-alert tone="danger" description="Some fields are missing or wrong." style="${WIDTH}"></jl-alert>`,
          text: 'Far from the field, and it says neither which nor how.',
        }
      )
    ),
    section(
      'Leaving a form',
      list(
        'Leaving a page with changes not saved asks first: "Leave without saving?", "Your changes to Bornes Wago 221-413 are lost.", **Keep editing**, **Leave**. Closing the tab asks too. `guardLeave()` from jlib does both: what it returns is the page\'s `canLeave`, which the Jadis router waits for (from `@jadis/core` 1.5.1) before it moves on, the history staying as it was.',
        'A dialog with changes asks the same before Escape or a click outside closes it.',
        'Never `window.confirm`: it looks like another program, and freezes the page.',
        'What people typed survives a failed save, an ended session (keep a draft on the device), and Back.'
      )
    ),
    section(
      'Guarding a form',
      code(
        'ts',
        `
        import { guardLeave } from '@syware/jlib';

        // In the page's onConnect: closing the tab asks, and canLeave() asks in the page.
        this.canLeave = guardLeave({
          isDirty: () => this.form.hasChanges(),
          signal: this.killSignal,
          text: \`Your changes to \${article.name} are lost.\`,
        });`
      )
    ),
    section(
      'Passwords',
      list(
        'One **New password** field, with the show button of `jl-input type="password"` and the rule as its hint, "At least 8 characters". No second field to type it again: showing it does that job better.',
        'Changing it asks for the current one first. Once saved, a toast, and the fields are empty again.',
        'A temporary password, given by an administrator, is changed at the first sign-in, on a page of its own.'
      )
    ),
    section(
      'Fields for special answers',
      table(
        ['Answer', 'Field'],
        [
          'A quantity, an amount',
          '`jl-number-input` with its unit; `inputmode="numeric"` or `"decimal"` for the keys of a phone.',
        ],
        [
          'A code, a barcode',
          '`jl-input` with `inputmode="numeric"` when it is digits, and a scan button beside it.',
        ],
        [
          'A file, a picture',
          '`jl-file-drop`, uploading as soon as it is chosen, with its name, its progress and a way to remove it.',
        ],
        ['A date', "`jl-date-picker`, in the order of the reader's language."],
        [
          'One choice of a few',
          '`jl-radio-group`, or `jl-chip-group` for short words; a `jl-select` from six choices, a `jl-combobox` from about fifteen.',
        ],
        ['Several choices', '`jl-chip-group multiple`, or `jl-tag-input` for words of their own.']
      )
    ),
  ],
  summary: 'The four ways a form saves, layout, checking answers and leaving a form.',
  title: 'Forms',
};
