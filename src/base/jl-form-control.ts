import { JlElement } from './jl-element';

type ValidatedElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * The base of the components a form submits: they take part in `<form>` like native fields (their `name`, their
 * value in `FormData`, `required`, reset, a disabled `<fieldset>`), through the element's internals.
 */
export abstract class JlFormControl extends JlElement {
  static readonly formAssociated = true;

  protected readonly internals = this.attachInternals();

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

  /** Copies the native field's validity, so the form sees the same errors the browser would show. */
  protected mirrorValidity(native: ValidatedElement): void {
    if (native.validity.valid) {
      this.internals.setValidity({});
      return;
    }
    this.internals.setValidity(native.validity, native.validationMessage, native);
  }
}
