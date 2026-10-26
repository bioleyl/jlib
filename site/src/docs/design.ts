import type {
  ColourFamily,
  Elevation,
  KeyPattern,
  MotionUse,
  RadiusStep,
  SpaceStep,
  TypeStep,
  WritingRule,
} from '../types/design.types';
import type { GuideLink } from '../types/site.types';

/** The pages of the design system, in the side navigation and the search. */
export const DESIGN_PAGES: readonly GuideLink[] = [
  { icon: 'layers', label: 'Overview', path: '/design', summary: 'The principles behind the look.' },
  {
    icon: 'image',
    label: 'Logo',
    path: '/design/logo',
    summary: 'The SyWare logo: versions, colours, clear space and its smallest size.',
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

export const PRINCIPLES: readonly { title: string; text: string }[] = [
  {
    text: 'Content comes first and the frame stays quiet: dark ink on white, or light ink on near-black, and greys that step back.',
    title: 'Ink and white',
  },
  {
    text: 'The accent marks what is live, selected, or waiting for a person: the primary action, the current page, a running job. Nothing else is blue.',
    title: 'One blue',
  },
  {
    text: 'Surfaces are flat and separated by one-pixel lines. Only what floats over the page (menus, dialogs, toasts) casts a shadow.',
    title: 'Lines, not shadows',
  },
  {
    text: 'Green says done, amber a real warning, red a failure or what destroys. A colour is never the only sign: an icon or a word says it too.',
    title: 'Colour means something',
  },
  {
    text: 'Dense enough for work, calm enough to read: 14px text, 36px controls, generous line height, and one weight step between levels.',
    title: 'Dense and calm',
  },
  {
    text: 'Every colour has a dark value tuned for its contrast, and any part of a page can be light or dark on its own.',
    title: 'The same in the dark',
  },
];

export const COLOUR_FAMILIES: readonly ColourFamily[] = [
  {
    description: 'Four steps of ink, from the text of a page to the decorations around it.',
    label: 'Ink',
    roles: [
      { against: '--jl-surface', name: 'Text', token: '--jl-text', use: 'Body text and headings.' },
      {
        against: '--jl-surface',
        name: 'Text 2',
        token: '--jl-text-2',
        use: 'Secondary text that still reads easily.',
      },
      {
        against: '--jl-surface',
        name: 'Muted',
        token: '--jl-muted',
        use: 'Hints, captions, labels, placeholders of meaning.',
      },
      {
        against: '--jl-surface',
        name: 'Faint',
        token: '--jl-faint',
        use: 'Icons and decorations only: too light for text.',
      },
    ],
  },
  {
    description: 'White or near-black grounds, a step darker for what sits behind, and lines to separate them.',
    label: 'Surfaces and lines',
    roles: [
      { name: 'Background', token: '--jl-bg', use: 'The page.' },
      { name: 'Surface', token: '--jl-surface', use: 'Cards, fields, panels.' },
      { name: 'Surface 2', token: '--jl-surface-2', use: 'Hover, sunken areas, read-only fields.' },
      { name: 'Surface 3', token: '--jl-surface-3', use: 'Pressed states, tracks, neutral badges.' },
      { name: 'Line', token: '--jl-line', use: 'The lines between things.' },
      { name: 'Line strong', token: '--jl-line-strong', use: 'The borders of controls.' },
    ],
  },
  {
    description: "The logo's blue for marks, and a deeper blue that can carry text.",
    label: 'Accent',
    roles: [
      {
        against: '--jl-surface',
        name: 'Brand',
        token: '--jl-brand',
        use: 'The mark, focus rings, progress. Never small text.',
      },
      {
        against: '--jl-surface',
        name: 'Accent',
        token: '--jl-accent',
        use: 'Primary buttons, links, the selection.',
      },
      {
        against: '--jl-surface',
        name: 'Accent strong',
        token: '--jl-accent-strong',
        use: 'Hover and pressed accent.',
      },
      { against: '--jl-accent', name: 'On accent', token: '--jl-on-accent', use: 'Text on the accent.' },
      { name: 'Accent soft', token: '--jl-accent-soft', use: 'Selected rows, the current page, ghost hovers.' },
      { name: 'Accent line', token: '--jl-accent-line', use: 'Borders of accented areas.' },
    ],
  },
  {
    description: 'Each status has a colour for text and icons, and a soft one for the ground it sits on.',
    label: 'Status',
    roles: [
      { against: '--jl-ok-soft', name: 'Ok', token: '--jl-ok', use: 'Done, healthy, saved.' },
      { against: '--jl-warn-soft', name: 'Warn', token: '--jl-warn', use: 'Real warnings only.' },
      { against: '--jl-danger-soft', name: 'Danger', token: '--jl-danger', use: 'Errors and what destroys data.' },
      { against: '--jl-info-soft', name: 'Info', token: '--jl-info', use: 'Information: the accent.' },
    ],
  },
];

export const TYPE_SCALE: readonly TypeStep[] = [
  {
    lineHeight: 1.05,
    name: 'Display',
    sample: 'Just the platform.',
    size: 54,
    use: 'The one headline of a landing page.',
    weight: 750,
  },
  {
    lineHeight: 1.15,
    name: 'Title',
    sample: 'Production deploy',
    size: 34,
    use: 'The title of a page (h1).',
    weight: 750,
  },
  {
    lineHeight: 1.3,
    name: 'Heading',
    sample: 'Environment variables',
    size: 22,
    use: 'Sections of a page (h2).',
    weight: 700,
  },
  {
    lineHeight: 1.3,
    name: 'Subheading',
    sample: 'Invite people',
    size: 17,
    use: 'Dialogs, cards, groups (h3).',
    weight: 650,
  },
  {
    lineHeight: 1.6,
    muted: true,
    name: 'Lead',
    sample: 'Pick who can see the project.',
    size: 17,
    use: 'The sentence under a title.',
    weight: 400,
  },
  {
    lineHeight: 1.55,
    name: 'Body',
    sample: 'Changes are saved as you type.',
    size: 14,
    token: '--jl-font-md',
    use: 'Text, controls, tables.',
    weight: 400,
  },
  {
    lineHeight: 1.5,
    name: 'Small',
    sample: 'Last edited 2 minutes ago',
    size: 13,
    token: '--jl-font-sm',
    use: 'Secondary text, hints, menus.',
    weight: 400,
  },
  {
    lineHeight: 1.4,
    name: 'Caption',
    sample: '12 of 48 selected',
    size: 12,
    token: '--jl-font-xs',
    use: 'Badges, captions, small buttons.',
    weight: 600,
  },
  {
    caps: true,
    lineHeight: 1.4,
    muted: true,
    name: 'Label',
    sample: 'Atoms',
    size: 11,
    use: 'The small capitals over a group.',
    weight: 650,
  },
  {
    lineHeight: 1.7,
    mono: true,
    name: 'Code',
    sample: 'npm install @syware/jlib',
    size: 12.5,
    use: 'Code, ids, hashes, keys, data.',
    weight: 400,
  },
];

export const FONT_WEIGHTS: readonly { weight: number; use: string }[] = [
  { use: 'Body text', weight: 400 },
  { use: 'Emphasis in text', weight: 500 },
  { use: 'Controls and labels', weight: 600 },
  { use: 'Headings', weight: 700 },
  { use: 'Titles', weight: 800 },
];

export const SPACE_SCALE: readonly SpaceStep[] = [
  { px: 4, token: '--jl-space-1', use: 'Between an icon and its badge count.' },
  { px: 8, token: '--jl-space-2', use: 'Between an icon and its label, buttons in a row.' },
  { px: 12, token: '--jl-space-3', use: 'Inside a chip or a menu item, between cards in a grid.' },
  { px: 16, token: '--jl-space-4', use: 'Between fields, inside small cards.' },
  { px: 20, token: '--jl-space-5', use: 'Inside cards and panels.' },
  { px: 24, token: '--jl-space-6', use: 'Inside dialogs, between groups of fields.' },
  { px: 32, token: '--jl-space-8', use: 'Between the sections of a form.' },
  { px: 40, token: '--jl-space-10', use: 'The side padding of a page.' },
  { px: 48, token: '--jl-space-12', use: 'Between the sections of a page.' },
  { px: 64, token: '--jl-space-16', use: 'Between the bands of a landing page.' },
];

export const RADII: readonly RadiusStep[] = [
  { token: '--jl-radius-xs', use: 'Keycaps, inline code, small inner buttons.' },
  { token: '--jl-radius-sm', use: 'Buttons and fields.' },
  { token: '--jl-radius', use: 'Menus, popovers, code blocks.' },
  { token: '--jl-radius-lg', use: 'Cards and dialogs.' },
  { token: '--jl-radius-xl', use: 'Sheets and large frames.' },
  { token: '--jl-radius-pill', use: 'Badges, chips, switches, avatars.' },
];

export const ELEVATIONS: readonly Elevation[] = [
  {
    level: '0',
    name: 'Flat',
    token: 'border: 1px solid var(--jl-line)',
    use: 'Cards, panels, tables, fields: most of an interface.',
  },
  { level: '1', name: 'Floating', token: '--jl-shadow', use: 'Menus, popovers, lists of options, tooltips.' },
  { level: '2', name: 'Overlay', token: '--jl-shadow-lg', use: 'Dialogs, drawers, toasts, the command palette.' },
];

export const MOTION_USES: readonly MotionUse[] = [
  { duration: '--jl-fast', how: 'Colour and border only.', what: 'Hover and press' },
  { duration: '--jl-fast', how: 'Fade in, rise 2px.', what: 'Menus, popovers, tooltips' },
  { duration: '--jl-slow', how: 'Fade in, rise 8px from 98%.', what: 'Dialogs and the command palette' },
  { duration: '--jl-slow', how: 'Slide from their edge.', what: 'Drawers and toasts' },
  { duration: '--jl-slow', how: 'Slide to the chosen item.', what: 'Tab and segment indicators, switch thumbs' },
  { duration: '--jl-slow', how: 'Height grows with the content.', what: 'Accordion panels' },
];

export const KEY_PATTERNS: readonly KeyPattern[] = [
  { components: 'Button, chip, card, list item', keys: 'Enter or Space presses.' },
  {
    components: 'Tabs, segmented control, radio group, rating',
    keys: 'Arrows move and choose, Home and End jump to the ends.',
  },
  {
    components: 'Menu, combobox, command palette',
    keys: 'Arrows move, Enter chooses, Escape closes and gives the focus back, letters jump.',
  },
  {
    components: 'Dialog, drawer, popover',
    keys: 'Focus moves in and stays inside; Escape closes (unless persistent).',
  },
  {
    components: 'Tree, side navigation',
    keys: 'Up and Down move, Right opens or enters, Left closes or goes to the parent.',
  },
  { components: 'Calendar', keys: 'Arrows by day and week, Page Up and Down by month, Enter chooses.' },
  { components: 'Table', keys: 'Enter or Space on a heading sorts; Space on a row checkbox selects.' },
  {
    components: 'Slider, number input, split view',
    keys: 'Arrows step, Page Up and Down step by ten, Home and End go to the bounds.',
  },
];

export const WRITING_RULES: readonly WritingRule[] = [
  {
    bad: 'OK',
    good: 'Save changes',
    text: 'A button says what happens when it is pressed, with a verb.',
    title: 'Buttons say what they do',
  },
  {
    bad: 'Create New Project',
    good: 'Create a project',
    text: 'Titles, buttons and labels start with a capital and continue in lower case, like a sentence.',
    title: 'Sentence case',
  },
  {
    bad: 'Invalid input.',
    good: 'Enter an email address, like name@example.com.',
    text: 'An error says what is wrong and how to put it right, in the field it is about.',
    title: 'Errors say how to fix them',
  },
  {
    bad: 'Are you sure?',
    good: 'Delete the 24 files of this project? It cannot be undone.',
    text: 'A confirmation names what will happen, and to what, so the answer is a real choice.',
    title: 'Confirmations name the consequence',
  },
  {
    bad: 'No data.',
    good: 'No invoices yet. They show here once you send one.',
    text: 'An empty state says what would be here, and how to get it there.',
    title: 'Empty states say what comes next',
  },
  {
    bad: 'Oops! Something went wrong, sorry!',
    good: 'The file could not be uploaded: it is larger than 10 MB.',
    text: 'Plain and calm: no exclamation marks, no jokes in errors, no apologies that say nothing.',
    title: 'Plain words',
  },
];
