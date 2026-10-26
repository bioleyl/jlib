import type { ComponentDoc, Level } from '../types/docs.types';
import type { GuideLink } from '../types/site.types';

// Every file in ./components that exports `doc` becomes a page: adding a component's docs needs no other change.
const modules = import.meta.glob<ComponentDoc>('./components/*.doc.ts', { eager: true, import: 'doc' });

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

const byLevelThenName = (a: ComponentDoc, b: ComponentDoc): number =>
  LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.name.localeCompare(b.name);

export const COMPONENT_DOCS: readonly ComponentDoc[] = Object.values(modules).sort(byLevelThenName);

export const slugOf = (doc: ComponentDoc): string => doc.tag.replace(/^jl-/, '');

/** The route of a component's page: `/components/button`. */
export const docRoute = (doc: ComponentDoc): string => `/components/${slugOf(doc)}`;

export const docBySlug = (slug: string): ComponentDoc | undefined =>
  COMPONENT_DOCS.find((doc) => slugOf(doc) === slug);

export const docsOfLevel = (level: Level): ComponentDoc[] => COMPONENT_DOCS.filter((doc) => doc.level === level);

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
    icon: 'layout-grid',
    label: 'All components',
    path: '/components',
    summary: 'Every component, by atomic level.',
  },
];
