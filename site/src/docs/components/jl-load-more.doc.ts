import type { JlLoadMore } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

// The list of the example: 120 items, 30 at a time, each page after a short wait.
const TOTAL = 120;
const PAGE_SIZE = 30;
const LATENCY_MS = 500;

export const doc: ComponentDoc = {
  className: 'JlLoadMore',
  description: `The end of a long list read a page at a time, as the collections pattern lays it out: how much of the
list shows ("30 of 120") and a Show more button that asks for the next page with more. The page sets shown and total
as pages come, and loading while one is on its way; the element takes no room once the whole list shows. Both texts
can be set, for pages in other languages.`,
  events: [{ description: 'People asked for the next page.', detail: 'undefined', name: 'more' }],
  examples: [
    {
      description: 'Under a list: each press brings 30 more, until the 120 show.',
      html: `
        <div class="stack narrow">
          <ul class="demo-items" style="margin: 0; padding-left: 20px; max-height: 160px; overflow: auto"></ul>
          <jl-load-more class="demo-more"></jl-load-more>
        </div>`,
      script: `
        const more = root.querySelector('jl-load-more');
        more.total.set(120);
        more.events.register('more', async () => {
          more.loading.set(true);
          const page = await fetchPage(more.shown.get());
          list.append(...page);
          more.shown.set(more.shown.get() + page.length);
          more.loading.set(false);
        });`,
      setup: (root) => {
        const more = root.querySelector<JlLoadMore>('.demo-more');
        const list = root.querySelector('.demo-items');
        const addPage = (): void => {
          const from = more?.shown.get() ?? 0;
          const items = Array.from({ length: Math.min(PAGE_SIZE, TOTAL - from) }, (_, index) => {
            const item = document.createElement('li');
            item.textContent = `Item ${from + index + 1}`;
            return item;
          });
          list?.append(...items);
          more?.shown.set(from + items.length);
        };
        more?.total.set(TOTAL);
        addPage();
        more?.events.register('more', () => {
          more.loading.set(true);
          setTimeout(() => {
            addPage();
            more.loading.set(false);
          }, LATENCY_MS);
        });
      },
      title: 'A page at a time',
    },
    {
      description: 'Texts of another language.',
      html: `<jl-load-more shown="50" total="1204" label="Afficher plus" count-text="{shown} sur {total}"></jl-load-more>`,
      title: 'Other words',
    },
  ],
  level: 'molecule',
  name: 'Load more',
  playground: { attributes: { shown: '30', total: '120' } },
  props: [
    {
      attribute: 'shown',
      control: { kind: 'number', min: 0, step: 10 },
      default: '0',
      description: 'How many items the list shows.',
      name: 'shown',
      type: 'number',
    },
    {
      attribute: 'total',
      control: { kind: 'number', min: 0, step: 10 },
      default: '0',
      description: 'How many it has in all; once they all show, the element takes no room.',
      name: 'total',
      type: 'number',
    },
    {
      attribute: 'loading',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The next page is on its way: the button shows a spinner and ignores presses.',
      name: 'loading',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "'Show more'",
      description: "The button's text.",
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'count-text',
      control: { kind: 'text' },
      default: "'{shown} of {total}'",
      description: 'What shows beside the button; {shown} and {total} are filled.',
      name: 'countText',
      type: 'string',
    },
  ],
  styling: [{ description: 'The row of the count and the button.', name: 'base' }],
  summary: 'The end of a long list: how much shows, and a button for the next page.',
  tag: 'jl-load-more',
};
