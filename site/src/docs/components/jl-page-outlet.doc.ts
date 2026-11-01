import type { JlButton, JlLoadState, JlPageOutlet } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const PAGES = {
  customers: { heading: 'Customers', loadMs: 400, rows: ['Alder & Co', 'Brightwater', 'Castello SA'] },
  orders: { heading: 'Orders', loadMs: 1500, rows: ['CH-2026-0158', 'CH-2026-0159', 'CH-2026-0160'] },
} as const;

/** A page of the example: a heading, and rows its load state draws once they come. */
function examplePage({ heading, loadMs, rows }: (typeof PAGES)[keyof typeof PAGES]): HTMLElement {
  const page = document.createElement('section');
  page.className = 'stack';
  page.style.padding = 'var(--jl-space-4)';
  const title = document.createElement('h3');
  title.textContent = heading;
  const state = document.createElement('jl-load-state') as JlLoadState;
  state.setAttribute('skeleton', 'lines');
  const list = document.createElement('ul');
  state.append(list);
  page.append(title, state);
  void state.load({
    draw: (items: readonly string[]) =>
      list.replaceChildren(
        ...items.map((item) => Object.assign(document.createElement('li'), { textContent: item }))
      ),
    fetch: () => new Promise<readonly string[]>((resolve) => setTimeout(() => resolve(rows), loadMs)),
  });
  return page;
}

export const doc: ComponentDoc = {
  className: 'JlPageOutlet',
  description: `A page outlet is where an app's pages show, one at a time. A new page loads out of sight while the
current one stays on screen, usable, under a line that says the next one is on its way (a jl-loading-bar). Once every
load state of the new page has its data, it takes the current one's place in one go: no half-drawn page, no skeleton
flashing between two pages. A page that takes longer than max-wait shows as it is, its load states with their
skeletons. The first page shows at once, as there is nothing to keep.

With a Jadis router, it shows the router's pages: router.mountOn(outlet, { show: (page) => outlet.show(page) }). It
goes where the pages go, in a jl-app-shell's main area for instance, flush with its top: the line runs along the top
edge of the outlet, so the room around a page belongs to the page, not to the area that holds the outlet. Under a
sticky bar, --line-top (the bar's height) keeps the line in sight once the page scrolls.`,
  events: [
    { description: 'A page took its place, at the top of the outlet.', detail: 'HTMLElement', name: 'show' },
  ],
  examples: [
    {
      description:
        'Orders takes 1.5 seconds, Customers 0.4: the page shown stays until the next has its rows. Press one, then the other at once: only the last one shows.',
      html: `
        <div class="stack">
          <div class="row">
            <jl-button class="to-orders" label="Orders"></jl-button>
            <jl-button class="to-customers" label="Customers"></jl-button>
          </div>
          <jl-page-outlet style="min-height: 180px; border: 1px solid var(--jl-line)"></jl-page-outlet>
        </div>`,
      script: `
        const outlet = root.querySelector('jl-page-outlet');
        outlet.show(customersPage()); // the first page shows at once
        root.querySelector('.to-orders').events.register('press', () => outlet.show(ordersPage()));
        root.querySelector('.to-customers').events.register('press', () => outlet.show(customersPage()));

        // A page loads its data as it would anyway: a jl-load-state and load().
        function ordersPage() {
          const page = document.createElement('section');
          const state = document.createElement('jl-load-state');
          page.append(state);
          state.load({ fetch: () => api.orders(), draw: (orders) => drawRows(state, orders) });
          return page;
        }`,
      setup: (root) => {
        const outlet = root.querySelector<JlPageOutlet>('jl-page-outlet');
        outlet?.show(examplePage(PAGES.customers));
        root
          .querySelector<JlButton>('.to-orders')
          ?.events.register('press', () => outlet?.show(examplePage(PAGES.orders)));
        root
          .querySelector<JlButton>('.to-customers')
          ?.events.register('press', () => outlet?.show(examplePage(PAGES.customers)));
      },
      title: 'From page to page',
    },
  ],
  level: 'organism',
  methods: [
    {
      description:
        'Shows a page: at once when none shows yet, else once its load states have their data (or after max-wait), the current page staying until then. A page still loading when another comes is dropped.',
      name: 'show',
      signature: 'show(page: HTMLElement): void',
    },
  ],
  name: 'Page outlet',
  playground: {
    attributes: { 'max-wait': '3000' },
    content: '<section style="padding: 16px">The page shown</section>',
  },
  props: [
    {
      attribute: 'max-wait',
      control: { kind: 'number', max: 30000, min: 0, step: 500 },
      default: '3000',
      description: 'The longest the current page stays while the next one loads, in milliseconds.',
      name: 'maxWait',
      type: 'number',
    },
  ],
  slots: [
    { description: 'The page shown. show() puts the pages there itself.', name: '' },
    { description: 'The page loading, out of sight, until it takes its place.', name: 'next' },
  ],
  styling: [
    {
      description:
        'How far from the top of the window the line stays once the page scrolls: the height of a sticky bar above the outlet. 0 by default.',
      name: '--line-top',
    },
    { description: 'The jl-loading-bar over the page: its --color and --height.', name: 'line' },
  ],
  summary: 'Where the pages show: the next one loads out of sight, under a line, and shows once it has its data.',
  tag: 'jl-page-outlet',
};
