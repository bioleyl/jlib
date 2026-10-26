import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
import './styles/global.css';
// Every component, defined: the examples write their tags in HTML.
import 'jlib/all';

import { SiteShell } from './components/site-shell';
import { mountRouter } from './router';
import { applyTheme } from './services/theme';

applyTheme();

const shell = new SiteShell();
const outlet = document.createElement('div');
shell.append(outlet);
document.body.append(shell);
mountRouter(outlet);
