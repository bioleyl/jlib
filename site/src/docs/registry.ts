import { registerIcons } from '@syware/jlib';
import { ScrollText } from 'lucide';

import componentIndex from '../generated/components.json';

import type { ComponentDoc, ComponentEntry, Level } from '../types/docs.types';
import type { GuideLink } from '../types/site.types';

// The icon of the guide's pages that the common set lacks.
registerIcons({ 'scroll-text': ScrollText });

// Every file in ./components that exports `doc` becomes a page (`npm run generate` adds it to the index). A page's doc
// loads when the page opens: the lists, the search and the pager need only what the generated index holds.
const loaders = import.meta.glob<ComponentDoc>('./components/*.doc.ts', { import: 'doc' });

export const LEVELS: readonly Level[] = ['atom', 'molecule', 'organism', 'template'];

export const LEVEL_LABELS: Record<Level, string> = {
  atom: 'Atoms',
  molecule: 'Molecules',
  organism: 'Organisms',
  template: 'Templates',
};

export const LEVEL_SINGULAR: Record<Level, string> = {
  atom: 'Atom',
  molecule: 'Molecule',
  organism: 'Organism',
  template: 'Template',
};

export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  atom: 'One element with one job: a button, an icon, a field. They know nothing of each other.',
  molecule: 'A few atoms that do one thing together: a labelled field, a search box, a menu.',
  organism: 'A section of an interface with its own behaviour: a dialog, a data table, a command palette.',
  template: 'Layouts with slots that place the rest: an app shell, a split view.',
};

/** Every documented component, by level then by name. */
export const COMPONENTS = componentIndex as readonly ComponentEntry[];

export const slugOf = (component: ComponentEntry): string => component.tag.replace(/^jl-/, '');

/** The route of a component's page: `/components/button`. */
export const docRoute = (component: ComponentEntry): string => `/components/${slugOf(component)}`;

export const componentBySlug = (slug: string): ComponentEntry | undefined =>
  COMPONENTS.find((component) => slugOf(component) === slug);

/** A component's whole doc, loaded on demand; none for a slug that is no component's. */
export const loadDoc = (slug: string): Promise<ComponentDoc | undefined> =>
  loaders[`./components/jl-${slug}.doc.ts`]?.() ?? Promise.resolve(undefined);

export const docsOfLevel = (level: Level): ComponentEntry[] =>
  COMPONENTS.filter((component) => component.level === level);

export const GUIDES: readonly GuideLink[] = [
  { icon: 'house', label: 'Introduction', path: '/', summary: 'What jlib is and the ideas behind it.' },
  {
    icon: 'rocket',
    label: 'Getting started',
    path: '/getting-started',
    summary: 'Install jlib and use it from HTML, JSX or TypeScript.',
  },
  {
    icon: 'package',
    label: 'Tree-shaking',
    path: '/tree-shaking',
    summary: 'Ship only the components a page uses.',
  },
  {
    icon: 'palette',
    label: 'Theming',
    path: '/theming',
    summary: 'Design tokens, dark mode and your own colours.',
  },
  { icon: 'list', label: 'Forms', path: '/forms', summary: 'Fields that submit with a form like native ones.' },
  {
    icon: 'sparkles',
    label: 'Vibe coding',
    path: '/vibe-coding',
    summary: 'Build apps on jlib with Claude Code and its plugins.',
  },
  {
    icon: 'layout-grid',
    label: 'All components',
    path: '/components',
    summary: 'Every component, by atomic level.',
  },
  {
    icon: 'scroll-text',
    label: 'Changelog',
    path: '/changelog',
    summary: 'What changed in each version, and what to look at when you update.',
  },
];
