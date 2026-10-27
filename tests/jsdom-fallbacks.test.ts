import { afterEach, describe, expect, it, vi } from 'vitest';

import { formInternals } from '../src/lib/internals';
import { watchSizes } from '../src/lib/resize';

describe('watchSizes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('watches with the DOM’s ResizeObserver where there is one', () => {
    const observe = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe;
        unobserve = vi.fn();
        disconnect = vi.fn();
      }
    );
    watchSizes(() => undefined).observe({} as Element);
    expect(observe).toHaveBeenCalledOnce();
  });

  it('watches nothing, without failing, where there is none (jsdom)', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const observer = watchSizes(() => undefined);
    expect(() => {
      observer.observe({} as Element);
      observer.disconnect();
    }).not.toThrow();
  });
});

describe('formInternals', () => {
  const elementWith = (internals: object) => ({ attachInternals: () => internals }) as unknown as HTMLElement;

  it('leaves a browser’s internals as they are', () => {
    const setFormValue = vi.fn();
    const internals = { setFormValue };
    expect(formInternals(elementWith(internals))).toBe(internals);
    expect(formInternals(elementWith(internals)).setFormValue).toBe(setFormValue);
  });

  it('gives internals without form methods (jsdom) ones that keep nothing and find every value valid', () => {
    const internals = formInternals(elementWith({}));
    expect(() => internals.setFormValue('a')).not.toThrow();
    expect(() => internals.setValidity({})).not.toThrow();
    expect(internals.checkValidity()).toBe(true);
  });
});
