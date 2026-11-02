/** What a form control asks of its internals that jsdom's lack: with them, a page's unit tests can create it. */
const FORM_METHODS: Pick<ElementInternals, 'checkValidity' | 'reportValidity' | 'setFormValue' | 'setValidity'> = {
  checkValidity: () => true,
  reportValidity: () => true,
  setFormValue: () => undefined,
  setValidity: () => undefined,
};

/**
 * Internals for a DOM that gives none (happy-dom, which renders pages on a server): they belong to no form and keep
 * the role and ARIA values written on them, which the server's markup has no place for anyway.
 */
const inertInternals = (): ElementInternals => {
  const inert: Partial<ElementInternals> = { form: null, validationMessage: '' };
  // A stand-in: it holds what jlib reads back (the form, the message) and takes what jlib writes.
  return inert as ElementInternals;
};

/** The internals of an element, or inert ones where the DOM has no `attachInternals` (happy-dom on a server). */
export function elementInternals(element: HTMLElement): ElementInternals {
  return typeof element.attachInternals === 'function' ? element.attachInternals() : inertInternals();
}

/**
 * The internals of a form-associated element. Where the DOM gives them no form methods (jsdom), they get ones that
 * keep nothing and find every value valid; a browser's are left as they are.
 */
export function formInternals(element: HTMLElement): ElementInternals {
  const internals = elementInternals(element);
  if (typeof internals.setFormValue === 'function') {
    return internals;
  }
  return Object.assign(internals, FORM_METHODS);
}
