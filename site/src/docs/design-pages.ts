import type { GuideLink } from '../types/site.types';

// The site's build finds the routes by their `path: '…'` (vite.config.ts). The pages themselves, and the data they
// draw (design.ts), load when one of them opens.
/** The pages of the design system, in the side navigation and the search. */
export const DESIGN_PAGES: readonly GuideLink[] = [
  { icon: 'layers', label: 'Overview', path: '/design', summary: 'The principles behind the look.' },
  {
    icon: 'image',
    label: 'Logo',
    path: '/design/logo',
    summary: "The SyWare logo, its versions and sizes, and the apps' own icons.",
  },
  {
    icon: 'palette',
    label: 'Colour',
    path: '/design/colour',
    summary: 'Ink, white, one blue, and colours that mean something.',
  },
  {
    icon: 'file-text',
    label: 'Typography',
    path: '/design/typography',
    summary: 'Manrope and JetBrains Mono, and the scale.',
  },
  {
    icon: 'layout-grid',
    label: 'Spacing and layout',
    path: '/design/spacing',
    summary: 'The 4px grid, control heights and widths.',
  },
  {
    icon: 'box',
    label: 'Shape and depth',
    path: '/design/shape',
    summary: 'Radii, lines, and the few things that float.',
  },
  {
    icon: 'zap',
    label: 'Motion',
    path: '/design/motion',
    summary: 'Two durations, one curve, and when things move.',
  },
  {
    icon: 'sparkles',
    label: 'Icons',
    path: '/design/icons',
    summary: 'Lucide icons by name, and how to add more.',
  },
  {
    icon: 'shield-check',
    label: 'Accessibility',
    path: '/design/accessibility',
    summary: 'Contrast, focus, keyboard and screen readers.',
  },
  { icon: 'message', label: 'Writing', path: '/design/writing', summary: 'Plain words that say what happens.' },
];
