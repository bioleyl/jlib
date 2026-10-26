import { defineRoutes, Router } from '@jadis/core';

import { ComponentPage } from './pages/component-page';
import { ComponentsPage } from './pages/components-page';
import { AccessibilityPage } from './pages/design/accessibility-page';
import { ColourPage } from './pages/design/colour-page';
import { DesignOverviewPage } from './pages/design/design-overview-page';
import { LogoPage } from './pages/design/logo-page';
import { MotionPage } from './pages/design/motion-page';
import { ShapePage } from './pages/design/shape-page';
import { SpacingPage } from './pages/design/spacing-page';
import { TypographyPage } from './pages/design/typography-page';
import { WritingPage } from './pages/design/writing-page';
import { FormsPage } from './pages/forms-page';
import { GettingStartedPage } from './pages/getting-started-page';
import { HomePage } from './pages/home-page';
import { IconsPage } from './pages/icons-page';
import { NotFoundPage } from './pages/not-found-page';
import { PatternPage } from './pages/patterns/pattern-page';
import { PatternsOverviewPage } from './pages/patterns/patterns-overview-page';
import { ThemingPage } from './pages/theming-page';
import { TreeShakingPage } from './pages/tree-shaking-page';

// History routes under the site's base (/jlib/ on GitHub Pages). The build writes a copy of index.html for every
// route, so a page opened directly finds the app; links are taken over by services/navigation.
// biome-ignore assist/source/useSortedKeys: the first matching route wins, so the catch-all stays last
const routes = defineRoutes({
  home: { page: HomePage, path: '/' },
  gettingStarted: { page: GettingStartedPage, path: '/getting-started' },
  treeShaking: { page: TreeShakingPage, path: '/tree-shaking' },
  theming: { page: ThemingPage, path: '/theming' },
  forms: { page: FormsPage, path: '/forms' },
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
  notFound: { page: NotFoundPage, path: '/:rest' },
});

export function mountRouter(outlet: HTMLElement): void {
  const router = new Router(routes, { baseUrl: import.meta.env.BASE_URL, mode: 'history' });
  router.mountOn(outlet);
}
