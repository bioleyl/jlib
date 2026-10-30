import type { JlPagination } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlPagination',
  description: `Moves through pages of results. It shows the first and last pages (boundaries), the current page with
siblings on each side, and a gap for the pages between; the number of buttons stays the same on every page, so they
do not jump under the pointer.

compact keeps only the arrows and "3 of 12", for a card or a phone. Listen to change for the page people go to; set
page from code when the results move for another reason.`,
  events: [
    {
      description: 'People went to another page; the detail is its number, from 1.',
      detail: 'number',
      name: 'change',
    },
  ],
  examples: [
    {
      html: `
        <div class="stack">
          <jl-pagination pages="12" page="1"></jl-pagination>
          <jl-pagination pages="12" page="6"></jl-pagination>
          <jl-pagination pages="5" page="3"></jl-pagination>
        </div>`,
      title: 'Near the ends, in the middle, and few pages',
    },
    {
      description: 'siblings="2" shows two pages on each side of the current one; boundaries="2" two at each end.',
      html: `
        <div class="stack">
          <jl-pagination pages="40" page="20" siblings="2"></jl-pagination>
          <jl-pagination pages="40" page="20" boundaries="2"></jl-pagination>
        </div>`,
      title: 'Siblings and boundaries',
    },
    {
      description: 'Only the arrows and where people are.',
      html: `
        <div class="row">
          <jl-pagination compact pages="12" page="3"></jl-pagination>
          <jl-pagination compact size="sm" pages="4" page="1"></jl-pagination>
        </div>`,
      title: 'Compact',
    },
    {
      description: 'sm in dense tables, md by default, lg where a thumb presses it.',
      html: `
        <div class="stack">
          <jl-pagination size="sm" pages="10" page="4"></jl-pagination>
          <jl-pagination size="lg" pages="10" page="4"></jl-pagination>
        </div>`,
      title: 'Sizes',
    },
    {
      description: 'Under a list: change says which page to load.',
      html: `
        <div class="stack narrow">
          <p class="muted demo-range">Showing 1–20 of 236 results</p>
          <jl-pagination class="demo-results" pages="12"></jl-pagination>
        </div>`,
      script: `
        const range = root.querySelector('.demo-range');
        root.querySelector('jl-pagination').events.register('change', (page) => {
          const first = (page - 1) * 20 + 1;
          range.textContent = \`Showing \${first}–\${Math.min(first + 19, 236)} of 236 results\`;
        });`,
      setup: (root) => {
        const range = root.querySelector('.demo-range');
        root.querySelector<JlPagination>('.demo-results')?.events.register('change', (page) => {
          const first = (page - 1) * 20 + 1;
          if (range !== null) {
            range.textContent = `Showing ${first}–${Math.min(first + 19, 236)} of 236 results`;
          }
        });
      },
      title: 'Paging results',
    },
  ],
  level: 'molecule',
  name: 'Pagination',
  playground: {
    attributes: { page: '6', pages: '12' },
  },
  props: [
    {
      attribute: 'page',
      control: { kind: 'number', min: 1 },
      default: '1',
      description: 'The current page, from 1.',
      name: 'page',
      type: 'number',
    },
    {
      attribute: 'pages',
      control: { kind: 'number', min: 0 },
      default: '1',
      description: 'How many pages there are.',
      name: 'pages',
      type: 'number',
    },
    {
      attribute: 'siblings',
      control: { kind: 'number', max: 5, min: 0 },
      default: '1',
      description: 'How many pages show on each side of the current one.',
      name: 'siblings',
      type: 'number',
    },
    {
      attribute: 'boundaries',
      control: { kind: 'number', max: 5, min: 0 },
      default: '1',
      description: 'How many pages always show at each end.',
      name: 'boundaries',
      type: 'number',
    },
    {
      attribute: 'compact',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Only the arrows and "3 of 12".',
      name: 'compact',
      type: 'boolean',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The height of the buttons: 30, 36 or 44 pixels.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description:
        "The navigation’s name for screen readers, when a page has more than one. Empty: jlib's own text, in the language shown.",
      name: 'label',
      type: 'string',
    },
  ],
  styling: [{ description: 'The nav element around the buttons.', name: 'base' }],
  summary: 'Moves through pages of results, with the current page, its neighbours and the ends a click away.',
  tag: 'jl-pagination',
};
