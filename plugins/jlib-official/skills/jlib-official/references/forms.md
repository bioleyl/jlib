# Forms

jlib's controls are form-associated custom elements: inside a `<form>` they behave like native fields, though their
inner input lives in a shadow root. A form is a real form of `JlField`s around named controls.

## Contents

- The controls
- A field
- Reading the values
- Checking answers
- What the server refuses
- A form in a dialog
- Leaving a form
- Traps

## The controls

| For | Component | Value |
|---|---|---|
| A line of text, an email, a password | `JlInput` (`type`) | `string` |
| Several lines | `JlTextarea` (`autosize`, `maxlength` with a counter) | `string` |
| A number with bounds | `JlNumberInput` (`min`, `max`, `step`) | `number \| null` |
| One choice in a list | `JlSelect<Value>` | `Value \| ''` |
| One choice in a long list, typed to narrow | `JlCombobox` (`allowCustom`) | `string` |
| One choice among a few, all in view | `JlRadioGroup<Value>` (`variant="cards"`), `JlSegmented<Value>` | `Value` |
| Several choices at once | `JlChipGroup<Value>` with `multiple` | `Value[]` |
| On or off, applied at once | `JlSwitch` | `checked` |
| A box to tick (terms, a choice in a list) | `JlCheckbox` | `checked` |
| A date | `JlDatePicker` | ISO `yyyy-mm-dd` |
| Files | `JlFileDrop` (`accept`, `maxSize`, `multiple`) | `File[]` |
| Short texts as chips | `JlTagInput` (`suggestions`) | `string[]` |
| Several values, a row each | `JlInputList` | `string[]` |
| A score | `JlRating` | `number` |
| A number by dragging | `JlSlider` | `number` |

Each control's reference has its inputs (`name`, `required`, `disabled`, `invalid`…) and events (`input` as people
type, `change` once committed).

## A field

```tsx
<JlStack>
  <JlField label="Job number" hint="As on the work order: CH-2026-0160." required>
    <JlInput name="job" required />
  </JlField>
  <JlField label="Category">
    <JlSelect<Category> name="category" options={CATEGORIES} placeholder="Choose a category" />
  </JlField>
</JlStack>
```

- `JlField` gives the control its label (pressing it focuses the control, and it names the control for screen
  readers), a `hint` under it, and an `error` that replaces the hint and draws the control invalid.
- `required` on the field draws the asterisk; `required` on the control makes the form check it.
- `orientation="horizontal"` puts the label beside the control, for settings.
- A form's fields stand in a `JlStack`, which spaces them evenly; groups under `h3` headings, or in
  `JlAccordionItem`s for long forms.

## Reading the values

- `new FormData(form)` holds every named control's value, like native fields: a `JlChipGroup multiple`, a
  `JlTagInput` or a `JlFileDrop` gives several entries of one name (`data.getAll('tags')`).
- Or read each control: `input.value.get()`, `number.value.get()` (a number, or `null`), `chips.value.get()`.
- `reset` brings back the values written as attributes (see [Traps](#traps)); a disabled `<fieldset>` disables the
  controls in it and leaves them out of the data.
- `jl-select`'s empty value means "nothing chosen": a real choice needs a value of its own (`head`, not `''`).

## Checking answers

SyWare's forms check on submit first, then as people fix what is wrong, and write each error under its field:

- `<form noValidate>` keeps the browser's bubbles away; the view checks, and writes `field.error.set('…')`.
- An error says how to put it right: "Enter the job number, like CH-2026-0160", never "Invalid".
- A submit with errors moves the focus to the first wrong control (`control.focus()`).
- A field showing an error checks again at each change, and the error goes as soon as the answer is right.
- `form.checkValidity()` and each control's `checkValidity()` still answer for `required`, `pattern`, `min`…

## What the server refuses

An error about a field goes under that field; anything else in a `JlAlert` at the top of the form, or above a
dialog's buttons. Never a toast: the toast goes, the form stays.

## A form in a dialog

A small thing created or changed where it is listed: its fields in a `JlDialog`, **Cancel** and the action in its
`actions` slot. The `<form>` goes around the dialog, so the buttons in its footer are in the form too: a
`JlButton type="submit"` submits it, and so does Enter in a field, as in a native form.

```tsx
// src/pages/new-order-dialog.tsx
import { Jadis } from '@jadis/core';
import { JlAlert, JlButton, JlDialog, JlField, JlInput, JlNumberInput, JlStack } from '@syware/jlib';

import { ApiError, createOrder } from '../services/orders';

import type { NewOrder, Order } from '../types/order.types';

type FieldErrors = Record<keyof NewOrder, string>;

const NO_ERRORS: FieldErrors = { customer: '', total: '' };

/** Creates an order: its fields checked on submit, the server's refusals where they belong. */
export class NewOrderDialog extends Jadis {
  static readonly selector = 'app-new-order-dialog';

  readonly events = this.useEvents<{ created: Order; close: undefined }>();

  private readonly _refs = this.useRefs((ref) => ({
    alert: ref(JlAlert),
    customer: ref<JlField>('.customer'),
    customerInput: ref(JlInput),
    dialog: ref(JlDialog),
    form: ref<HTMLFormElement>('form'),
    save: ref<JlButton>('.save'),
    total: ref<JlField>('.total'),
    totalInput: ref(JlNumberInput),
  }));

  templateHtml(): Node {
    return (
      <form noValidate>
        <JlDialog
          heading="New order"
          description="It is created open; its lines are added on its page."
          onClose={() => this.events.emit('close')}
        >
          <JlStack>
            <JlAlert tone="danger" hidden />
            <JlField class="customer" label="Customer" required>
              <JlInput name="customer" autocomplete="organization" required />
            </JlField>
            <JlField class="total" label="Total" hint="In Swiss francs." required>
              <JlNumberInput name="total" min={0} step={0.05} required />
            </JlField>
          </JlStack>
          <JlButton slot="actions" label="Cancel" onPress={() => this._refs.dialog.close()} />
          <JlButton slot="actions" class="save" type="submit" variant="primary" label="Create order" />
        </JlDialog>
      </form>
    );
  }

  onConnect(): void {
    this.on(this._refs.form, 'submit', (event) => {
      event.preventDefault();
      void this.submit();
    });
    this._refs.customerInput.events.register('input', () => this.checkAgain());
    this._refs.totalInput.events.register('change', () => this.checkAgain());
  }

  /** Opens the dialog, empty. */
  open(): void {
    this._refs.form.reset();
    this.showErrors(NO_ERRORS);
    this._refs.alert.hidden = true;
    this._refs.dialog.show();
  }

  private async submit(): Promise<void> {
    const order = this.readOrder();
    if (order === null) {
      this.focusFirstError();
      return;
    }
    this._refs.save.loading.set(true);
    try {
      const created = await createOrder(order, this.killSignal);
      this._refs.dialog.close();
      this.events.emit('created', created);
    } catch (error) {
      this.showRefusal(error);
    } finally {
      this._refs.save.loading.set(false);
    }
  }

  /** The order the fields describe, or null after writing what is wrong under each field. */
  private readOrder(): NewOrder | null {
    const customer = this._refs.customerInput.value.get().trim();
    const total = this._refs.totalInput.value.get();
    this.showErrors({
      customer: customer === '' ? 'Enter the customer, as on their invoices.' : '',
      total: total === null ? 'Enter the total, like 120.50.' : '',
    });
    return customer === '' || total === null ? null : { customer, total };
  }

  /** Once a field shows an error, each change checks again: the error goes as soon as the answer is right. */
  private checkAgain(): void {
    if (this._refs.customer.error.get() !== '' || this._refs.total.error.get() !== '') {
      this.readOrder();
    }
  }

  private showErrors(errors: FieldErrors): void {
    this._refs.customer.error.set(errors.customer);
    this._refs.total.error.set(errors.total);
  }

  private focusFirstError(): void {
    if (this._refs.customer.error.get() !== '') {
      this._refs.customerInput.focus();
      return;
    }
    this._refs.totalInput.focus();
  }

  /** What the server refused: under its field when it names one, above the buttons otherwise. */
  private showRefusal(error: unknown): void {
    const fields = error instanceof ApiError ? error.fields : {};
    this.showErrors({ customer: fields.customer ?? '', total: fields.total ?? '' });
    if (fields.customer !== undefined || fields.total !== undefined) {
      this.focusFirstError();
      return;
    }
    this._refs.alert.description.set(error instanceof ApiError ? error.message : 'The order was not created.');
    this._refs.alert.hidden = false;
  }
}

NewOrderDialog.register();
```

The page that lists orders places it once and opens it from its primary action; once created, the new order opens
on its own page ([recipes.md](recipes.md#a-list-page-that-creates)).

## Leaving a form

A page with a form asks before it is left with changes not saved: "Leave without saving?", **Keep editing**,
**Leave**, in jlib's texts. `guardLeave` asks when the tab closes or reloads (the browser's own question), and gives
the page's `canLeave`, which the Jadis router calls before it leaves the page, for a link or Back, and waits for:

```tsx
import type { RoutedPage } from '@jadis/core';

export class ArticlePage extends Jadis implements RoutedPage {
  static readonly selector = 'app-article-page';

  // Asked by the router before it leaves; guarded once connected.
  canLeave = (): Promise<boolean> => Promise.resolve(true);

  onConnect(): void {
    this.canLeave = guardLeave({
      isDirty: () => this.formData() !== this._saved.data,
      signal: this.killSignal,
      text: 'Your changes to the article are lost.',
    });
  }
}
```

- `isDirty` compares the form with what was loaded or last saved; after a save, update what it compares with.
- `heading`, `text`, `leaveLabel` and `stayLabel` change what it asks, in the app's words.
- Back reaches the router only within the app: a page loaded directly is left by the browser, which asks its own
  question.
- A dialog with changes asks the same before it closes; keep what people typed after a failed save.

The whole page is in [recipes.md](recipes.md#a-settings-form-that-guards-its-changes).

## Traps

- A `JlButton` submits the form around it (`type="submit"`); a native `<button>` inside a shadow root cannot reach a
  form outside it. Keep the form and its buttons in the same view.
- `invalid` on a control draws it in the danger colour without a message: use the field's `error`, which sets it.
- A reset goes back to the `value` **attribute**. In JSX, `value="…"` sets the property, which a reset forgets: set
  the values again after `reset()`, or write the starting value with `setAttribute('value', …)`.
- Enter in a field of one line submits its form, as in a native one: `JlInput`, `JlNumberInput`, `JlDatePicker`,
  `JlSearch`, and `JlCombobox` or `JlTagInput` when Enter chose or added nothing (a `JlInput` fires `enter` first). In
  jlib 0.11.1 and before it did not, and apps wrote `onEnter={() => form.requestSubmit()}` on their fields: remove it
  when updating, or the form submits twice.
- `JlField` names its control: don't give the control a `label` of its own as well.- jsdom keeps no form value for form-associated elements: test what the view reads from the controls, and the
  submission in a browser ([testing.md](testing.md)).
