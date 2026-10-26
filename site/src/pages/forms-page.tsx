import { css } from '@jadis/core';
import { JlButton, JlCodeBlock, JlElement } from 'jlib';
import { BASE_STYLES } from 'jlib/styles/shared';

import { codeSample } from '../lib/blocks';
import { PROSE_STYLES } from '../styles/site-styles';
import styles from './forms-page.css?raw';

const NOTHING_SENT = '// Submit the form: its data shows here.';

// Written as a page would write it in HTML: values in attributes are what a reset brings back.
const FIELDS_HTML = `
  <jl-field label="Full name" required>
    <jl-input name="name" value="Ada Lovelace" required></jl-input>
  </jl-field>
  <jl-field label="Email" hint="We never share it." required>
    <jl-input name="email" type="email" placeholder="you@example.com" required></jl-input>
  </jl-field>
  <jl-field label="Role">
    <jl-select name="role" value="developer">
      <option value="developer">Developer</option>
      <option value="designer">Designer</option>
      <option value="manager">Manager</option>
    </jl-select>
  </jl-field>
  <jl-field label="About you">
    <jl-textarea name="about" placeholder="A sentence or two" maxlength="200"></jl-textarea>
  </jl-field>
  <jl-radio-group name="plan" value="team" legend="Plan" label="Plan"
    options='[{"value":"hobby","label":"Hobby","description":"For trying things out."},{"value":"team","label":"Team","description":"For a team that ships."}]'>
  </jl-radio-group>
  <jl-checkbox name="terms" label="I accept the terms" required></jl-checkbox>
  <jl-switch name="newsletter" label="Send me the newsletter" checked></jl-switch>`;

const fieldsElement = (): HTMLElement => {
  const fields = <div class="fields" />;
  fields.innerHTML = FIELDS_HTML;
  return fields;
};

/** Turns a form's data into plain JSON, keeping several values of one name as a list. */
function formDataAsJson(data: FormData): string {
  const entries = [...data.keys()].map((key) => {
    const values = data.getAll(key).map((value) => (value instanceof File ? `File ${value.name}` : value));
    return [key, values.length === 1 ? values[0] : values];
  });
  return JSON.stringify(Object.fromEntries(entries), null, 2);
}

/** jlib's fields in a real form: their names and values in FormData, required, reset, disabled fieldsets. */
export class FormsPage extends JlElement {
  static readonly selector = 'site-forms-page';

  private readonly _refs = this.useRefs((ref) => ({
    fieldset: ref<HTMLFieldSetElement>('fieldset'),
    form: ref<HTMLFormElement>('form'),
    output: ref<JlCodeBlock>('.output'),
    toggle: ref<JlButton>('.toggle-disabled'),
  }));

  templateHtml(): Node {
    return (
      <article class="page">
        <header class="intro">
          <p class="label">Guide</p>
          <h1>Forms</h1>
          <p class="lead">
            The fields of jlib are form-associated custom elements: inside a form they behave like native fields,
            even though their inner input lives in a shadow root.
          </p>
        </header>

        <section>
          <h2>Try it</h2>
          <p>
            Fill the form and submit it: the data below is what the browser collected, with
            <code>new FormData(form)</code>. Leave the email empty to see required at work, reset to get the first
            values back, or disable the whole fieldset.
          </p>
          <form class="demo">
            <fieldset>{fieldsElement()}</fieldset>
            <div class="actions">
              <JlButton class="toggle-disabled" variant="ghost" label="Disable the fieldset" />
              <span class="spacer" />
              <JlButton type="reset" label="Reset" />
              <JlButton type="submit" variant="primary" label="Submit" />
            </div>
          </form>
          <JlCodeBlock class="output" language="ts" heading="FormData" code={NOTHING_SENT} />
        </section>

        <section>
          <h2>What the fields do</h2>
          <ul>
            <li>
              <strong>name</strong>: the value is in the form's data under that name, like a native field. A field
              without a name is left out.
            </li>
            <li>
              <strong>required</strong> and the native constraints (<code>type="email"</code>, <code>pattern</code>
              , <code>min</code>…) stop the submission and show the browser's message.
            </li>
            <li>
              <strong>reset</strong> brings back the value written in the HTML.
            </li>
            <li>
              A <strong>disabled fieldset</strong> disables the fields in it, and leaves them out of the data.
            </li>
            <li>
              <code>form</code>, <code>validity</code>, <code>checkValidity()</code> and{' '}
              <code>reportValidity()</code> work as on native fields.
            </li>
          </ul>
          {codeSample(
            'html',
            `
            <form>
              <jl-field label="Email" required>
                <jl-input name="email" type="email" required></jl-input>
              </jl-field>
              <jl-button type="submit" variant="primary" label="Subscribe"></jl-button>
            </form>`
          )}
          {codeSample(
            'ts',
            `
            form.addEventListener('submit', (event) => {
              event.preventDefault();
              const data = new FormData(form); // { email: '…' }
            });`
          )}
          <div class="note">
            A button inside a shadow root cannot submit a form outside it; jl-button can:{' '}
            <code>type="submit"</code> and <code>type="reset"</code> act on the form around it.
          </div>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${styles}`;
  }

  onConnect(): void {
    document.title = 'Forms · jlib';
    const form = this._refs.form;
    this.on(form, 'submit', (event) => {
      event.preventDefault();
      this._refs.output.code.set(formDataAsJson(new FormData(form)));
    });
    this.on(form, 'reset', () => this._refs.output.code.set(NOTHING_SENT));
    this._refs.toggle.events.register('press', () => {
      const fieldset = this._refs.fieldset;
      fieldset.disabled = !fieldset.disabled;
      this._refs.toggle.label.set(fieldset.disabled ? 'Enable the fieldset' : 'Disable the fieldset');
    });
  }
}

FormsPage.register();
