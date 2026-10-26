import { TOKEN_STYLES } from '../styles/shared';

const adopted = { done: false };

/** Whether the document takes constructed stylesheets: jsdom, which runs many apps' unit tests, does not. */
const takesSheets = (): boolean =>
  typeof CSSStyleSheet !== 'undefined'
  && typeof CSSStyleSheet.prototype.replaceSync === 'function'
  && Array.isArray(document.adoptedStyleSheets);

/**
 * Gives the document the design tokens, once. They live in the `jlib` cascade layer, so the page overrides any of
 * them with a plain rule: `:root { --jl-accent: #7c3aed; }`. Where the document takes no constructed stylesheet, a
 * style element in its head holds them instead.
 */
export function adoptTokens(): void {
  if (adopted.done || typeof document === 'undefined') {
    return;
  }
  adopted.done = true;
  if (!takesSheets()) {
    const style = document.createElement('style');
    style.textContent = TOKEN_STYLES;
    document.head.append(style);
    return;
  }
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(TOKEN_STYLES);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}
