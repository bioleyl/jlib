import type { ComponentDoc } from '../../types/docs.types';

const TRAIL =
  '[{"label":"Home","href":"#/","icon":"house"},{"label":"Projects","href":"#/components"},{"label":"Website"},{"label":"Settings"}]';

const LONG_TRAIL =
  '[{"label":"Home","href":"#/","icon":"house"},{"label":"Acme","href":"#/"},{"label":"Engineering","href":"#/"},{"label":"Platform","href":"#/"},{"label":"Payments API","href":"#/"},{"label":"Deployments"}]';

export const doc: ComponentDoc = {
  className: 'JlBreadcrumb',
  description: `A trail from the top of a hierarchy to the page people are on. Each item is { label, href?, icon? }:
an item with an href is a link, the others plain text; the last item is the current page and is marked so for screen
readers.

With max, a trail longer than that keeps its first item and its last ones, and folds the middle into a … button;
pressing it unfolds the trail and moves the focus to the first item it showed. Long labels are cut with an ellipsis and
show whole on hover.`,
  examples: [
    {
      html: `<jl-breadcrumb items='${TRAIL}'></jl-breadcrumb>`,
      title: 'A trail',
    },
    {
      description: 'max="4": the first item, the … button, and the last three.',
      html: `<jl-breadcrumb max="4" items='${LONG_TRAIL}'></jl-breadcrumb>`,
      title: 'Folded in the middle',
    },
    {
      description: 'Over a page title, the trail says where the page sits.',
      html: `
        <div class="stack">
          <jl-breadcrumb items='[{"label":"Billing","href":"#/"},{"label":"Invoices","href":"#/"},{"label":"INV-2041"}]'></jl-breadcrumb>
          <div class="row">
            <strong>Invoice INV-2041</strong>
            <jl-button size="sm" icon="download" label="Download PDF"></jl-button>
          </div>
        </div>`,
      title: 'Over a page title',
    },
  ],
  level: 'molecule',
  name: 'Breadcrumb',
  playground: {
    attributes: { items: LONG_TRAIL, max: '4' },
  },
  props: [
    {
      attribute: 'items',
      control: { kind: 'json' },
      default: '[]',
      description: 'The trail, from the top: { label, href?, icon? }. The last item is the current page.',
      name: 'items',
      type: 'BreadcrumbItem[]',
    },
    {
      attribute: 'max',
      control: { kind: 'number', max: 10, min: 0 },
      default: '0',
      description: 'The most items shown before the middle folds into a … button; 0 never folds.',
      name: 'max',
      type: 'number',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: "The navigation’s name for screen readers. Empty: jlib's own text, in the language shown.",
      name: 'label',
      type: 'string',
    },
  ],
  styling: [{ description: 'The nav element around the trail.', name: 'base' }],
  summary: 'Where a page sits in a hierarchy: a trail of links that ends with the current page.',
  tag: 'jl-breadcrumb',
};
