import { DESIGN_PAGES } from '../docs/design';
import { COMPONENT_DOCS, GUIDES, LEVEL_LABELS, slugOf } from '../docs/registry';

import type { PaletteCommand } from 'jlib';
import type { ThemeMode } from '../types/site.types';

const GO_PREFIX = 'go:';
const THEME_PREFIX = 'theme:';

const THEMES: readonly { mode: ThemeMode; label: string; icon: string }[] = [
  { icon: 'sun', label: 'Light theme', mode: 'light' },
  { icon: 'moon', label: 'Dark theme', mode: 'dark' },
  { icon: 'monitor', label: 'System theme', mode: 'system' },
];

/** What the site's command palette lists: the guide, every component, and the themes. */
export function searchCommands(): PaletteCommand[] {
  const guides = GUIDES.map((guide) => ({
    group: 'Guide',
    icon: guide.icon,
    id: `${GO_PREFIX}${guide.path}`,
    label: guide.label,
  }));
  const design = DESIGN_PAGES.map((page) => ({
    group: 'Design system',
    icon: page.icon,
    id: `${GO_PREFIX}${page.path}`,
    label: page.label,
  }));
  const components = COMPONENT_DOCS.map((doc) => ({
    group: LEVEL_LABELS[doc.level],
    id: `${GO_PREFIX}/components/${slugOf(doc)}`,
    keywords: [doc.tag, doc.className],
    label: doc.name,
  }));
  const themes = THEMES.map((theme) => ({
    group: 'Theme',
    icon: theme.icon,
    id: `${THEME_PREFIX}${theme.mode}`,
    label: theme.label,
  }));
  return [...guides, ...design, ...components, ...themes];
}

export type SearchAction = { kind: 'go'; path: string } | { kind: 'theme'; mode: ThemeMode } | { kind: 'none' };

/** What choosing a command does, from its id. */
export function actionOf(id: string): SearchAction {
  if (id.startsWith(GO_PREFIX)) {
    return { kind: 'go', path: id.slice(GO_PREFIX.length) };
  }
  const mode = THEMES.find((theme) => `${THEME_PREFIX}${theme.mode}` === id)?.mode;
  return mode === undefined ? { kind: 'none' } : { kind: 'theme', mode };
}
