import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
import './styles/global.css';
// Every component, defined: the examples write their tags in HTML.
import '@syware/jlib/all';

import { SiteShell } from './components/site-shell';
import { mountRouter } from './router';
import { interceptLinks } from './services/navigation';
import { applyTheme } from './services/theme';

applyTheme();
// The page lives as long as the tab: its link handling never needs to stop.
interceptLinks(new AbortController().signal);

const shell = new SiteShell();
const outlet = document.createElement('div');
shell.append(outlet);
document.body.append(shell);
mountRouter(outlet);
