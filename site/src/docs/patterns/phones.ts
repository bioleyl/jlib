import { list, section, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

export const phones: PatternDoc = {
  components: ['jl-app-shell', 'jl-tab-bar', 'jl-number-input', 'jl-input'],
  icon: 'smartphone',
  label: 'Phones and touch',
  lead: 'Some work happens away from a desk: picking in a warehouse, ordering on a building site, deciding between two meetings. Those tasks are made for a phone first, and every other one still works on it.',
  path: '/patterns/phones',
  sections: [
    section(
      'Know the phone tasks',
      text(
        'For each role, list what it does on a phone. Those screens are drawn at 390px wide first, then widened; the others are drawn for a computer, then checked at 390px. In swstock, ordering and picking are phone tasks; in swai, deciding on a review is one.'
      )
    ),
    section(
      'The frame',
      list(
        'A top bar with the menu, the wordmark, the search and the avatar; a tab bar with four destinations at most, and **More**. See [Navigation](/patterns/navigation).',
        'Toasts above the tab bar; dialogs as wide as the screen; drawers over the page.'
      )
    ),
    section(
      'Thumbs',
      list(
        "Controls are 44px high on a touch screen (`pointer: coarse`), with 8px at least between them. jlib's tokens grow there by themselves: 36, 44 and 48px.",
        'Text in fields is 16px, or the phone zooms in when the field takes the focus: `--jl-control-font` does it.',
        'The main action of a task stays in a bar along the bottom, full width: **Send order**, **Approve** and **Reject**, **Confirm**. The page scrolls under it.',
        'Nothing needs a hover: no actions that appear on hover, no information only in a tooltip.',
        'Each field asks for its keyboard: `inputmode="numeric"` for quantities and codes, `type="email"`, `type="tel"`.'
      )
    ),
    section(
      'Layouts that fold',
      list(
        'A split view becomes two pages: the list, then the item with a back link to it.',
        'A table becomes rows, each with its main values.',
        'Filters that do not fit scroll sideways in one row of chips, or go into a **Filters** dialog; the search stays in view.',
        'Fields side by side stack.',
        'Nothing scrolls sideways but a row of chips, or a wide table in its own frame.'
      )
    ),
    section(
      'Camera and scanning',
      list(
        'A scanner always has a field beside it to type the code: cameras fail in the dark and on worn labels.',
        'A read answers at once: a vibration, a mark, and the line it matched in view; a wrong code says what was read and why it does not fit.',
        'A computer without a camera can take a phone as its scanner, through a QR code.'
      )
    ),
    section(
      'Check it',
      text(
        'Every page at 390px wide, in both themes, and with a finger on a real phone for the phone tasks: `node scripts/shoot.mjs --width 390` for jlib, Playwright for the apps.'
      )
    ),
  ],
  summary: 'Phone tasks, thumbs, layouts that fold, cameras.',
  title: 'Phones and touch',
};
