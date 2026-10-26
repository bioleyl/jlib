import type { JlField, JlInput } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const PLANS = JSON.stringify([
  { label: 'Hobby', value: 'hobby' },
  { label: 'Pro', value: 'pro' },
  { label: 'Team', value: 'team' },
]);

const COUNTRIES = JSON.stringify([
  { label: 'Switzerland', value: 'CH' },
  { label: 'France', value: 'FR' },
  { label: 'Germany', value: 'DE' },
  { label: 'Italy', value: 'IT' },
]);

/** The submitted data as lines of "name: value", for the form example. */
function describeFormData(form: HTMLFormElement): string {
  return [...new FormData(form)].map(([name, value]) => `${name}: ${String(value)}`).join('\n');
}

export const doc: ComponentDoc = {
  className: 'JlField',
  description: `A control with its label, a hint under it, and an error that takes the hint's place. It works with
any control of the library, or any element that can take the focus: pressing the label focuses the control, and the
label becomes the control's name for screen readers when the control has no label of its own (not for a checkbox or
a switch, which show their own).

Set error to say what is wrong: it shows in the danger colour, is announced politely, and draws the control as
invalid until the error is cleared. required only adds the asterisk; put required on the control too, so the form
checks it. orientation="horizontal" puts the label beside the control, and goes back to a column in narrow places.`,
  examples: [
    {
      html: `
        <div class="stack narrow">
          <jl-field label="Project name" hint="Lowercase letters, digits and dashes." required>
            <jl-input name="project" placeholder="my-project" required></jl-input>
          </jl-field>
          <jl-field label="Description">
            <jl-textarea rows="3" placeholder="What it does, in a sentence or two"></jl-textarea>
          </jl-field>
        </div>`,
      title: 'Label and hint',
    },
    {
      description: 'The error appears while the address has no @, and the field is drawn as invalid meanwhile.',
      html: `
        <div class="narrow">
          <jl-field class="demo-email" label="Email" hint="We send the receipts there.">
            <jl-input type="email" value="ada.lovelace" placeholder="you@example.com"></jl-input>
          </jl-field>
        </div>`,
      script: `
        const field = root.querySelector('.demo-email');
        const input = field.querySelector('jl-input');
        const check = (value) => {
          field.error.set(value.includes('@') ? '' : 'An email address has an @, as in ada@example.com.');
        };
        input.events.register('input', check);
        check(input.value.get());`,
      setup: (root) => {
        const field = root.querySelector<JlField>('.demo-email');
        const input = field?.querySelector<JlInput>('jl-input');
        if (field === null || field === undefined || input === null || input === undefined) {
          return;
        }
        const check = (value: string): void => {
          field.error.set(value.includes('@') ? '' : 'An email address has an @, as in ada@example.com.');
        };
        input.events.register('input', check);
        check(input.value.get());
      },
      title: 'Error',
    },
    {
      html: `
        <div class="stack" style="max-width: 560px">
          <jl-field label="Display name" orientation="horizontal">
            <jl-input value="Ada Lovelace"></jl-input>
          </jl-field>
          <jl-field label="Language" orientation="horizontal" hint="Used for dates and numbers.">
            <jl-select value="en" options='[{"value":"en","label":"English"},{"value":"fr","label":"Français"},{"value":"de","label":"Deutsch"}]'></jl-select>
          </jl-field>
          <jl-field label="Notifications" orientation="horizontal">
            <jl-switch label="Email me when a build fails" checked></jl-switch>
          </jl-field>
          <jl-field label="Bio" orientation="horizontal">
            <jl-textarea rows="2" placeholder="A line about you"></jl-textarea>
          </jl-field>
        </div>`,
      title: 'Horizontal',
    },
    {
      description: `Every control here takes part in the form: submit it to see the data the form would send, reset it
to go back to the values written in the HTML. The required fields stop the submission while they are empty.`,
      html: `
        <form class="stack narrow demo-form">
          <jl-field label="Full name" required>
            <jl-input name="name" placeholder="Ada Lovelace" required></jl-input>
          </jl-field>
          <jl-field label="Country" required>
            <jl-select name="country" placeholder="Choose a country" required options='${COUNTRIES}'></jl-select>
          </jl-field>
          <jl-field label="Plan">
            <jl-radio-group name="plan" label="Plan" orientation="horizontal" value="pro" options='${PLANS}'></jl-radio-group>
          </jl-field>
          <jl-field label="Seats" hint="You can add more later.">
            <jl-number-input name="seats" value="3" min="1" max="50"></jl-number-input>
          </jl-field>
          <jl-field label="Monthly budget (CHF)">
            <jl-slider name="budget" min="0" max="2000" step="50" value="400" show-value></jl-slider>
          </jl-field>
          <jl-field label="Notes">
            <jl-textarea name="notes" rows="2" maxlength="140" placeholder="Anything we should know?"></jl-textarea>
          </jl-field>
          <jl-switch name="newsletter" label="Send me the monthly newsletter" checked></jl-switch>
          <jl-checkbox name="terms" value="accepted" required>I accept the terms of service</jl-checkbox>
          <div class="row">
            <jl-button type="submit" variant="primary" label="Create account"></jl-button>
            <jl-button type="reset" label="Reset"></jl-button>
          </div>
          <pre class="muted demo-data">Submit the form to see its data.</pre>
        </form>`,
      script: `
        const form = root.querySelector('.demo-form');
        const out = root.querySelector('.demo-data');
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          out.textContent = [...new FormData(form)]
            .map(([name, value]) => \`\${name}: \${value}\`)
            .join('\\n');
        });
        form.addEventListener('reset', () => {
          out.textContent = 'Submit the form to see its data.';
        });`,
      setup: (root) => {
        const form = root.querySelector<HTMLFormElement>('.demo-form');
        const out = root.querySelector('.demo-data');
        if (form === null || out === null) {
          return;
        }
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          out.textContent = describeFormData(form);
        });
        form.addEventListener('reset', () => {
          out.textContent = 'Submit the form to see its data.';
        });
      },
      title: 'A form',
    },
  ],
  level: 'molecule',
  name: 'Field',
  playground: {
    attributes: { hint: 'We never share it.', label: 'Email', required: true },
    content: '<jl-input type="email" name="email" placeholder="you@example.com" required></jl-input>',
  },
  props: [
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: "The label over the control; also the control's accessible name when it has none.",
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'hint',
      control: { kind: 'text' },
      default: "''",
      description: 'Help under the control, hidden while there is an error.',
      name: 'hint',
      type: 'string',
    },
    {
      attribute: 'error',
      control: { kind: 'text' },
      default: "''",
      description: 'What is wrong, in the danger colour; the control is drawn as invalid meanwhile.',
      name: 'error',
      type: 'string',
    },
    {
      attribute: 'required',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Adds an asterisk to the label.',
      name: 'required',
      type: 'boolean',
    },
    {
      attribute: 'orientation',
      control: { kind: 'select', options: ['vertical', 'horizontal'] },
      default: "'vertical'",
      description: 'The label over the control, or beside it.',
      name: 'orientation',
      type: "'vertical' | 'horizontal'",
    },
  ],
  slots: [{ description: 'The control: an input, a select, a group of radios…', name: '' }],
  styling: [
    { description: 'The grid holding the label, the control and the messages.', name: 'base' },
    { description: 'The width of the label column when horizontal (160px).', name: '--label-width' },
  ],
  summary: 'A control with its label, a hint and an error message.',
  tag: 'jl-field',
};
