/**
 * The accent tokens for one colour: the shades are mixed in CSS from the text and surface colours, so the same
 * rule reads well in light and in dark.
 */
export function accentTokens(colour: string): Record<string, string> {
  return {
    '--jl-accent': colour,
    '--jl-accent-line': 'color-mix(in srgb, var(--jl-accent) 40%, var(--jl-surface))',
    '--jl-accent-soft': 'color-mix(in srgb, var(--jl-accent) 12%, var(--jl-surface))',
    '--jl-accent-strong': 'color-mix(in srgb, var(--jl-accent) 80%, var(--jl-text))',
    '--jl-brand': colour,
    '--jl-info': 'var(--jl-accent)',
    '--jl-info-soft': 'var(--jl-accent-soft)',
  };
}

/** The tokens as a CSS rule for the page's root. */
export function accentCss(colour: string): string {
  const lines = Object.entries(accentTokens(colour)).map(([name, value]) => `  ${name}: ${value};`);
  return `:root {\n${lines.join('\n')}\n}`;
}
