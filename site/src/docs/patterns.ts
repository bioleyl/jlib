import { registerIcons } from '@syware/jlib';
import {
  AppWindow,
  Ban,
  CircleDot,
  Compass,
  ListChecks,
  MousePointerClick,
  PanelsTopLeft,
  Smartphone,
  TextCursorInput,
  Undo2,
  Workflow,
} from 'lucide';

import patternIndex from '../generated/patterns.json';

import type { PatternDoc, PatternEntry, UxPrinciple } from '../types/patterns.types';
import type { GuideLink } from '../types/site.types';

// The icons of the patterns' navigation and previews that the common set lacks.
registerIcons({
  'app-window': AppWindow,
  ban: Ban,
  'circle-dot': CircleDot,
  compass: Compass,
  'list-checks': ListChecks,
  'mouse-pointer-click': MousePointerClick,
  'panels-top-left': PanelsTopLeft,
  smartphone: Smartphone,
  'text-cursor-input': TextCursorInput,
  'undo-2': Undo2,
  workflow: Workflow,
});

// The site's build finds the routes by their `path: '…'` (vite.config.ts): the overview's is written out here.
export const PATTERNS_OVERVIEW: GuideLink = {
  icon: 'compass',
  label: 'Overview',
  path: '/patterns',
  summary: 'The principles of how SyWare apps behave.',
};

export const PATTERNS_PATH = PATTERNS_OVERVIEW.path;

/** The name of the section, over its pages, in the side navigation and in the search. */
export const PATTERNS_SECTION = 'UX patterns';

/**
 * The pattern pages in reading order (the frame, the page, what is on it, then how it answers, then the checks), by
 * their file: `forms` is `patterns/forms.ts`, at `/patterns/forms`. `npm run generate` lists them from here
 * (site/src/generated/patterns.json, and the syware-ux plugin's list).
 */
export const PATTERN_SLUGS = [
  'navigation',
  'page-layout',
  'collections',
  'actions',
  'forms',
  'states',
  'feedback',
  'confirmations',
  'overlays',
  'status',
  'search',
  'phones',
  'accounts',
  'checklist',
] as const;

// Each page's module loads when the page opens; the lists above need only what the generated index holds.
const loaders = import.meta.glob<PatternDoc>('./patterns/*.ts', { import: 'pattern' });

/** The pattern pages, in reading order: what the lists and the pager show of them. */
export const PATTERNS = patternIndex as readonly PatternEntry[];

/** The pages of the UX patterns, in the side navigation and the search. */
export const PATTERN_PAGES: readonly GuideLink[] = [
  PATTERNS_OVERVIEW,
  ...PATTERNS.map(({ icon, label, path, summary }) => ({ icon, label, path, summary })),
];

/** What the lists say of the pattern at a route: `forms` for `/patterns/forms`. */
export const patternBySlug = (slug: string): PatternEntry | undefined =>
  PATTERNS.find((pattern) => pattern.path === `${PATTERNS_PATH}/${slug}`);

/** The whole page of a pattern, loaded on demand; none for a slug that is no pattern's. */
export const loadPattern = (slug: string): Promise<PatternDoc | undefined> =>
  loaders[`./patterns/${slug}.ts`]?.() ?? Promise.resolve(undefined);

export const UX_PRINCIPLES: readonly UxPrinciple[] = [
  {
    text: 'The app proposes, people decide. Nothing that matters happens unseen; what cannot be undone asks once, and what can be undone offers Undo.',
    title: 'People stay in control',
  },
  {
    text: 'Every screen says what it is, what state it is in and what can be done next. Every action gets an answer: a change on the page, a toast, or an error that says how to put it right.',
    title: 'Answer before they ask',
  },
  {
    text: 'A list, a form, a confirmation look and work the same in every app, with the same words in the same places. What people learn in one app works in the next.',
    title: 'Same task, same way',
  },
  {
    text: 'Home pages, lists and counts open on what waits for the person: reviews to decide, orders to prepare. Everything else is one step away.',
    title: 'What needs you comes first',
  },
  {
    text: 'Ctrl K, shortcuts and dense lists for the people who use an app all day; plain words, empty states that teach and good defaults for their first visit.',
    title: 'Fast for regulars, clear for newcomers',
  },
  {
    text: 'At a desk or in a warehouse: the tasks done away from a desk are made for a thumb first, and every other one still works on a phone.',
    title: 'Where the work is',
  },
];
