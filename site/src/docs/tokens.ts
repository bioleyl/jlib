import type { TokenGroup } from '../types/site.types';

/** The design tokens, as the Theming page lists them. The values come from the page itself, live. */
export const TOKEN_GROUPS: readonly TokenGroup[] = [
  {
    label: 'Text',
    tokens: [
      { description: 'Body text and headings.', kind: 'colour', name: '--jl-text' },
      { description: 'Secondary text that still reads easily.', kind: 'colour', name: '--jl-text-2' },
      { description: 'Hints, captions, labels: 6:1 on white.', kind: 'colour', name: '--jl-muted' },
      { description: 'Icons and decorations only, never text.', kind: 'colour', name: '--jl-faint' },
    ],
  },
  {
    label: 'Surfaces and lines',
    tokens: [
      { description: 'The page.', kind: 'colour', name: '--jl-bg' },
      { description: 'Cards, fields, panels.', kind: 'colour', name: '--jl-surface' },
      { description: 'Hover, sunken areas, read-only fields.', kind: 'colour', name: '--jl-surface-2' },
      { description: 'Pressed states, tracks, neutral badges.', kind: 'colour', name: '--jl-surface-3' },
      { description: 'Inline code.', kind: 'colour', name: '--jl-code-bg' },
      { description: 'The lines between things.', kind: 'colour', name: '--jl-line' },
      { description: 'Quieter lines, inside tables.', kind: 'colour', name: '--jl-line-soft' },
      { description: 'The borders of controls.', kind: 'colour', name: '--jl-line-strong' },
    ],
  },
  {
    label: 'Accent',
    tokens: [
      {
        description: "The logo's blue: marks, focus rings, progress. Never small text.",
        kind: 'colour',
        name: '--jl-brand',
      },
      {
        description: 'The blue that carries text: primary buttons, links, selection.',
        kind: 'colour',
        name: '--jl-accent',
      },
      { description: 'Hover and pressed accent.', kind: 'colour', name: '--jl-accent-strong' },
      { description: 'Selected rows, active navigation, ghost hovers.', kind: 'colour', name: '--jl-accent-soft' },
      { description: 'Borders of accented areas.', kind: 'colour', name: '--jl-accent-line' },
      { description: 'Text on the accent.', kind: 'colour', name: '--jl-on-accent' },
    ],
  },
  {
    label: 'Status',
    tokens: [
      { description: 'Done, healthy, saved.', kind: 'colour', name: '--jl-ok' },
      { description: 'Background of ok states.', kind: 'colour', name: '--jl-ok-soft' },
      { description: 'Real warnings only.', kind: 'colour', name: '--jl-warn' },
      { description: 'Background of warnings.', kind: 'colour', name: '--jl-warn-soft' },
      { description: 'Errors and destructive actions.', kind: 'colour', name: '--jl-danger' },
      { description: 'Background of errors.', kind: 'colour', name: '--jl-danger-soft' },
      { description: 'Information: the accent by default.', kind: 'colour', name: '--jl-info' },
      { description: 'Background of information.', kind: 'colour', name: '--jl-info-soft' },
    ],
  },
  {
    label: 'Shape',
    tokens: [
      { description: 'Small inner elements: keycaps, chips.', kind: 'radius', name: '--jl-radius-xs' },
      { description: 'Controls: buttons, fields.', kind: 'radius', name: '--jl-radius-sm' },
      { description: 'Panels and menus.', kind: 'radius', name: '--jl-radius' },
      { description: 'Cards and dialogs.', kind: 'radius', name: '--jl-radius-lg' },
      { description: 'Sheets.', kind: 'radius', name: '--jl-radius-xl' },
      { description: 'Pills: badges, switches.', kind: 'radius', name: '--jl-radius-pill' },
    ],
  },
  {
    label: 'Sizes',
    tokens: [
      { description: 'Dense controls.', kind: 'length', name: '--jl-control-sm' },
      { description: 'Controls by default.', kind: 'length', name: '--jl-control-md' },
      { description: 'Controls a thumb presses.', kind: 'length', name: '--jl-control-lg' },
      { description: 'Captions, badges.', kind: 'length', name: '--jl-font-xs' },
      { description: 'Secondary text.', kind: 'length', name: '--jl-font-sm' },
      { description: 'Body text.', kind: 'length', name: '--jl-font-md' },
      { description: 'Lead text.', kind: 'length', name: '--jl-font-lg' },
    ],
  },
  {
    label: 'Depth and motion',
    tokens: [
      { description: 'Barely lifted.', kind: 'shadow', name: '--jl-shadow-sm' },
      { description: 'Menus and popovers.', kind: 'shadow', name: '--jl-shadow' },
      { description: 'Dialogs and toasts.', kind: 'shadow', name: '--jl-shadow-lg' },
      { description: 'The ring of the focused control.', kind: 'shadow', name: '--jl-focus-ring' },
      { description: 'The curve of every transition.', kind: 'text', name: '--jl-ease' },
      { description: 'Hovers and presses.', kind: 'text', name: '--jl-fast' },
      { description: 'Opening and sliding.', kind: 'text', name: '--jl-slow' },
    ],
  },
];

/** Accent colours to try on the Theming page. */
export const ACCENT_PRESETS: readonly { label: string; colour: string }[] = [
  { colour: '#0c72b0', label: 'Blue' },
  { colour: '#6d4ed8', label: 'Violet' },
  { colour: '#0f766e', label: 'Teal' },
  { colour: '#be123c', label: 'Rose' },
  { colour: '#b45309', label: 'Amber' },
  { colour: '#2b3036', label: 'Ink' },
];
