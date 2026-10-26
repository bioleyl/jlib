import { afterEach, describe, expect, it, vi } from 'vitest';

/** A document with only what adoptTokens touches: a head, style elements, and maybe adopted sheets. */
function fakeDocument(adoptedStyleSheets: unknown) {
  const head: { textContent: string }[] = [];
  return {
    adoptedStyleSheets,
    createElement: () => ({ textContent: '' }),
    head: { append: (element: { textContent: string }) => head.push(element) },
    styles: head,
  };
}

const freshAdoptTokens = async () => {
  vi.resetModules();
  return (await import('../src/lib/tokens')).adoptTokens;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('adoptTokens', () => {
  it('adopts a constructed stylesheet where the document takes them, once', async () => {
    class Sheet {
      text = '';
      replaceSync(text: string): void {
        this.text = text;
      }
    }
    const document = fakeDocument([]);
    vi.stubGlobal('CSSStyleSheet', Sheet);
    vi.stubGlobal('document', document);
    const adoptTokens = await freshAdoptTokens();
    adoptTokens();
    adoptTokens();
    expect(document.adoptedStyleSheets).toHaveLength(1);
    expect((document.adoptedStyleSheets as Sheet[])[0]?.text).toContain('--jl-accent');
    expect(document.styles).toHaveLength(0);
  });

  it('falls back to a style element where it does not, as jsdom in an app’s tests', async () => {
    const document = fakeDocument(undefined);
    vi.stubGlobal('CSSStyleSheet', undefined);
    vi.stubGlobal('document', document);
    const adoptTokens = await freshAdoptTokens();
    adoptTokens();
    adoptTokens();
    expect(document.styles).toHaveLength(1);
    expect(document.styles[0]?.textContent).toContain('--jl-accent');
  });
});
