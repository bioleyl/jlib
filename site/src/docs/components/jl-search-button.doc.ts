import type { JlCommandPalette, JlSearchButton } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const COMMANDS = JSON.stringify([
  { group: 'Go to', icon: 'list', id: 'orders', label: 'Orders' },
  { group: 'Go to', icon: 'package', id: 'stock', label: 'Stock' },
  { group: 'Actions', icon: 'plus', id: 'new', label: 'New order…' },
]);

export const doc: ComponentDoc = {
  className: 'JlSearchButton',
  description: `The search button sits at the top of an app's side nav and opens its command palette. It looks like a
search field, so people know they can type, and shows the palette's keys (Ctrl K, ⌘K on a Mac) so they learn them.
Touch screens have no keys: there it shows none.

compact keeps the icon alone: in a folded side nav, or in a phone's top bar. The keys are the palette's own: the
button only shows them, and fires press when clicked. See the Search and shortcuts pattern.`,
  events: [{ description: 'The button was pressed: open the palette.', detail: 'undefined', name: 'press' }],
  examples: [
    {
      description: 'At the top of a side nav: it fills the width.',
      html: `
        <div style="width: 240px; padding: 12px; border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg)">
          <jl-search-button></jl-search-button>
        </div>`,
      title: 'In a side nav',
    },
    {
      description: 'Pressed, it opens a command palette (its own keys turned off here: the site has Ctrl K).',
      html: `
        <div class="row">
          <jl-search-button class="demo-open" style="width: 220px"></jl-search-button>
          <jl-search-button class="demo-open" compact></jl-search-button>
        </div>
        <jl-command-palette class="demo-palette" hotkey="none" commands='${COMMANDS}'></jl-command-palette>`,
      script: `
        const palette = root.querySelector('.demo-palette');
        for (const button of root.querySelectorAll('.demo-open')) {
          button.events.register('press', () => palette.show());
        }`,
      setup: (root) => {
        const palette = root.querySelector<JlCommandPalette>('.demo-palette');
        for (const button of root.querySelectorAll<JlSearchButton>('.demo-open')) {
          button.events.register('press', () => palette?.show());
        }
      },
      title: 'Opening the palette',
    },
  ],
  level: 'molecule',
  name: 'Search button',
  playground: { attributes: { compact: false, hotkey: 'mod+k', label: 'Search' }, width: 240 },
  props: [
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "'Search'",
      description: 'Its text, and its name for screen readers.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'hotkey',
      control: { kind: 'text' },
      default: "'mod+k'",
      description: 'The keys it shows, as jl-kbd writes them; none for no keys.',
      name: 'hotkey',
      type: 'string',
    },
    {
      attribute: 'compact',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The icon alone, the label as its tooltip.',
      name: 'compact',
      type: 'boolean',
    },
  ],
  styling: [{ description: 'The button.', name: 'base' }],
  summary: 'What opens the command palette: a search field to press, with its keys.',
  tag: 'jl-search-button',
};
