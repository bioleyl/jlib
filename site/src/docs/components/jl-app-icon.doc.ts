import type { ComponentDoc } from '../../types/docs.types';

const WORD = 'font-weight: 800; font-size: 18px; letter-spacing: -0.02em';

export const doc: ComponentDoc = {
  className: 'JlAppIcon',
  description: `Every SyWare app has its own icon, in one family: the app's glyph in white on a rounded tile of the
brand's blue. It tells the apps apart where a word does not fit (a folded side nav, a phone's top bar, a browser tab,
a phone's home screen), and the family says they come from the same place. The SyWare mark stays the company's: the
sign-in panel and the documentation.

Beside the wordmark at the top of the side nav, the icon is decorative; alone, give it a label, the app's name. The
tile looks the same in both themes, as a favicon does. The favicon and the home screen icon are the same tile, drawn
as files: see the Logo page. \`setFavicon('workflow')\` makes the tile the page's favicon, in the theme's
\`--jl-brand\`, so an app on its own theme shows it in the browser's tab too.`,
  examples: [
    {
      description: 'At the top of the side nav, beside the wordmark.',
      html: `
        <div class="row" style="gap: 24px">
          <span class="row" style="gap: 10px"><jl-app-icon icon="workflow"></jl-app-icon><span style="${WORD}">sw<span style="color: var(--jl-brand)">ai</span></span></span>
          <span class="row" style="gap: 10px"><jl-app-icon icon="package"></jl-app-icon><span style="${WORD}">sw<span style="color: var(--jl-brand)">stock</span></span></span>
        </div>`,
      title: 'With the wordmark',
    },
    {
      description: 'Alone it names the app for screen readers; the sizes of a top bar, a nav and a home screen.',
      html: `
        <div class="row" style="align-items: end">
          <jl-app-icon icon="package" size="20" label="swstock"></jl-app-icon>
          <jl-app-icon icon="package" size="28" label="swstock"></jl-app-icon>
          <jl-app-icon icon="package" size="44" label="swstock"></jl-app-icon>
          <jl-app-icon icon="package" size="64" label="swstock"></jl-app-icon>
        </div>`,
      title: 'Sizes',
    },
  ],
  level: 'atom',
  methods: [
    {
      description:
        "A function, not a method: makes the app's icon the page's favicon, the tile of a registered icon name in the theme's --jl-brand and --jl-on-brand, so a page's own theme shows in the browser's tab too.",
      name: 'setFavicon',
      signature: 'setFavicon(icon: string): void',
    },
  ],
  name: 'App icon',
  playground: { attributes: { icon: 'package', label: '', size: '28' } },
  props: [
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "''",
      description: "The app's glyph: a registered icon name.",
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'number', max: 128, min: 12 },
      default: '28',
      description: "The tile's side, in pixels; the glyph and the corners follow.",
      name: 'size',
      type: 'number',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: "The app's name for screen readers, when no wordmark beside it says it.",
      name: 'label',
      type: 'string',
    },
  ],
  styling: [{ description: 'The tile.', name: 'base' }],
  summary: "An app's own icon: its glyph in white on the brand's blue, one family for every SyWare app.",
  tag: 'jl-app-icon',
};
