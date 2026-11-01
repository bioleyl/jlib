import { defineRoutes, Router } from '@jadis/core';

import { ChangelogPage } from './pages/changelog-page';
import { ComponentPage } from './pages/component-page';
import { ComponentsPage } from './pages/components-page';
import { FormsPage } from './pages/forms-page';
import { GettingStartedPage } from './pages/getting-started-page';
import { HomePage } from './pages/home-page';
import { lazyPage } from './pages/lazy-page';
import { NotFoundPage } from './pages/not-found-page';
import { PatternPage } from './pages/patterns/pattern-page';
import { PatternsOverviewPage } from './pages/patterns/patterns-overview-page';
import { ThemingPage } from './pages/theming-page';
import { TreeShakingPage } from './pages/tree-shaking-page';
import { VibeCodingPage } from './pages/vibe-coding-page';

import type { JlPageOutlet } from '@syware/jlib';

// The design system's pages, and the data they draw, load when one of them opens. The router takes classes: a loader
// stands for each page.
const DesignOverviewPage = lazyPage('site-lazy-design-page', () =>
  import('./pages/design/design-overview-page').then((module) => module.DesignOverviewPage)
);
const LogoPage = lazyPage('site-lazy-logo-page', () =>
  import('./pages/design/logo-page').then((module) => module.LogoPage)
);
const ColourPage = lazyPage('site-lazy-colour-page', () =>
  import('./pages/design/colour-page').then((module) => module.ColourPage)
);
const TypographyPage = lazyPage('site-lazy-typography-page', () =>
  import('./pages/design/typography-page').then((module) => module.TypographyPage)
);
const SpacingPage = lazyPage('site-lazy-spacing-page', () =>
  import('./pages/design/spacing-page').then((module) => module.SpacingPage)
);
const ShapePage = lazyPage('site-lazy-shape-page', () =>
  import('./pages/design/shape-page').then((module) => module.ShapePage)
);
const MotionPage = lazyPage('site-lazy-motion-page', () =>
  import('./pages/design/motion-page').then((module) => module.MotionPage)
);
const IconsPage = lazyPage('site-lazy-icons-page', () =>
  import('./pages/icons-page').then((module) => module.IconsPage)
);
const AccessibilityPage = lazyPage('site-lazy-accessibility-page', () =>
  import('./pages/design/accessibility-page').then((module) => module.AccessibilityPage)
);
const WritingPage = lazyPage('site-lazy-writing-page', () =>
  import('./pages/design/writing-page').then((module) => module.WritingPage)
);

// History routes under the site's base (/jlib/ on GitHub Pages). The build writes a copy of index.html for every
// route, so a page opened directly finds the app; links are taken over by services/navigation.
// biome-ignore assist/source/useSortedKeys: the first matching route wins, so the catch-all stays last
const routes = defineRoutes({
  home: { page: HomePage, path: '/' },
  gettingStarted: { page: GettingStartedPage, path: '/getting-started' },
  treeShaking: { page: TreeShakingPage, path: '/tree-shaking' },
  theming: { page: ThemingPage, path: '/theming' },
  forms: { page: FormsPage, path: '/forms' },
  vibeCoding: { page: VibeCodingPage, path: '/vibe-coding' },
  design: { page: DesignOverviewPage, path: '/design' },
  designLogo: { page: LogoPage, path: '/design/logo' },
  designColour: { page: ColourPage, path: '/design/colour' },
  designTypography: { page: TypographyPage, path: '/design/typography' },
  designSpacing: { page: SpacingPage, path: '/design/spacing' },
  designShape: { page: ShapePage, path: '/design/shape' },
  designMotion: { page: MotionPage, path: '/design/motion' },
  designIcons: { page: IconsPage, path: '/design/icons' },
  designAccessibility: { page: AccessibilityPage, path: '/design/accessibility' },
  designWriting: { page: WritingPage, path: '/design/writing' },
  patterns: { page: PatternsOverviewPage, path: '/patterns' },
  pattern: { page: PatternPage, path: '/patterns/:name' },
  component: { page: ComponentPage, path: '/components/:name' },
  components: { page: ComponentsPage, path: '/components' },
  changelog: { page: ChangelogPage, path: '/changelog' },
  notFound: { page: NotFoundPage, path: '/:rest' },
});

/** The site's router: it follows the links to the site's pages itself, in shadow roots too. */
export const router = new Router(routes, { baseUrl: import.meta.env.BASE_URL, links: true, mode: 'history' });

/** Shows the pages in the outlet: the current one stays until the next has its data (its doc, its module). */
export function mountRouter(outlet: JlPageOutlet): void {
  router.mountOn(outlet, { show: (page) => outlet.show(page) });
}
