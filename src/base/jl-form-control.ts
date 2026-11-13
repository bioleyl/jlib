import { formInternals } from '../lib/internals';
import { JlElement } from './jl-element';

type ValidatedElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// What submits a form when pressed: the native submit buttons, and jlib's own.
const SUBMIT_BUTTONS =
  'button:not([type]), button[type="submit"], input[type="submit"], input[type="image"], jl-button[type="submit"]';
// A `jl-button` at work ignores presses too.
const UNPRESSABLE = ':disabled, [loading]';

/** The button Enter presses in a form: the first of its submit buttons, as the browser chooses it. */
const submitButtonOf = (form: HTMLFormElement): Element | undefined =>
  [...form.elements].find((element) => element.matches(SUBMIT_BUTTONS));

/** A button the browser takes as a submission's submitter: `jl-button` is not one, and submits without. */
const isNativeSubmitter = (button: Element | undefined): button is HTMLButtonElement | HTMLInputElement =>
  button instanceof HTMLButtonElement || button instanceof HTMLInputElement;

/**
 * The base of the components a form submits: they take part in `<form>` like native fields (their `name`, their
 * value in `FormData`, `required`, reset, a disabled `<fieldset>`), through the element's internals.
 */
export abstract class JlFormControl extends JlElement {
  static readonly formAssociated = true;

  protected readonly internals = formInternals(this);

  /** The field's name in the form's data. Reflected, so a name set from JSX reaches the form too. */
  readonly name = this.useChange('', (value) => this.reflect('name', value), { attribute: 'name' });

  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  get validity(): ValidityState {
    return this.internals.validity;
  }

  get validationMessage(): string {
    return this.internals.validationMessage;
  }

  checkValidity(): boolean {
    return this.internals.checkValidity();
  }

  reportValidity(): boolean {
    return this.internals.reportValidity();
  }

  /** Called by the browser when the form resets: back to the value the page first gave. */
  formResetCallback(): void {
    this.resetValue();
  }

  /** Called by the browser when a `<fieldset disabled>` around the field changes. */
  formDisabledCallback(disabled: boolean): void {
    this.setDisabledByForm(disabled);
  }

  protected abstract resetValue(): void;

  protected abstract setDisabledByForm(disabled: boolean): void;

  /**
   * Submits the form the field belongs to, as Enter in a native field of one line does. The native field inside the
   * shadow root belongs to no form, so the browser's own implicit submission never reaches the page's: each field of
   * one line calls this for an Enter it did not use itself. Nothing during a composition (an IME choosing a word),
   * outside a form, or when the form's submit button cannot be pressed; `requestSubmit` checks the form's fields
   * first, as a submit button does.
   */
  protected submitImplicitly(event: KeyboardEvent): void {
    const form = this.internals.form;
    if (event.isComposing || form === null) {
      return;
    }
    const button = submitButtonOf(form);
    // Enter presses the form's submit button, as in a native field: one that cannot be pressed (disabled, or busy
    // with the save the first Enter started) submits nothing.
    if (button?.matches(UNPRESSABLE)) {
      return;
    }
    form.requestSubmit(isNativeSubmitter(button) ? button : undefined);
  }

  /** Copies the native field's validity, so the form sees the same errors the browser would show. */
  protected mirrorValidity(native: ValidatedElement): void {
    if (native.validity.valid) {
      this.internals.setValidity({});
      return;
    }
    this.internals.setValidity(native.validity, native.validationMessage, native);
  }
}
