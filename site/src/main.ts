import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
import './styles/global.css';
import { COMMON_ICONS, JlPageOutlet, registerIcons } from '@syware/jlib';

import { SiteShell } from './components/site-shell';
import { mountRouter } from './router';
import { holdHashLinks } from './services/navigation';
import { applyTheme } from './services/theme';

// The icons the examples name. Each component comes with the page that shows it (scripts/define-written-tags.ts).
registerIcons(COMMON_ICONS);
applyTheme();
// The page lives as long as the tab: its link handling never needs to stop. The router follows the other links.
holdHashLinks(new AbortController().signal);

const shell = new SiteShell();
const outlet = new JlPageOutlet();
shell.append(outlet);
document.body.append(shell);
// A new page starts at the top, once it shows: until then the current one stays as it was.
outlet.events.register('show', () => window.scrollTo({ top: 0 }));
mountRouter(outlet);
