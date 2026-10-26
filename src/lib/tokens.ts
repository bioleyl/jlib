import { TOKEN_STYLES } from '../styles/shared';

const adopted = { sheet: null as CSSStyleSheet | null };

/**
 * Gives the document the design tokens, once. They live in the `jlib` cascade layer, so the page overrides any of
 * them with a plain rule: `:root { --jl-accent: #7c3aed; }`.
 */
export function adoptTokens(): void {
  if (adopted.sheet !== null || typeof document === 'undefined') {
    return;
  }
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(TOKEN_STYLES);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  adopted.sheet = sheet;
}
