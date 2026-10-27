/** What a form control asks of its internals that jsdom's lack: with them, a page's unit tests can create it. */
const FORM_METHODS: Pick<ElementInternals, 'checkValidity' | 'reportValidity' | 'setFormValue' | 'setValidity'> = {
  checkValidity: () => true,
  reportValidity: () => true,
  setFormValue: () => undefined,
  setValidity: () => undefined,
};

/**
 * The internals of a form-associated element. Where the DOM gives them no form methods (jsdom), they get ones that
 * keep nothing and find every value valid; a browser's are left as they are.
 */
export function formInternals(element: HTMLElement): ElementInternals {
  const internals = element.attachInternals();
  if (typeof internals.setFormValue === 'function') {
    return internals;
  }
  return Object.assign(internals, FORM_METHODS);
}
