import type { JlAccordionItem, JlButton } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlAccordionItem',
  description: `A section that opens and closes under its heading, built on the browser's details and summary: the
heading is a button for the keyboard and screen readers, and the chevron turns as the content slides open.

Alone it is a disclosure ("Show more details"); in a jl-accordion it is one of a list. toggle fires with the new state,
whether people or code opened it.`,
  events: [{ description: 'The item opened (true) or closed (false).', detail: 'boolean', name: 'toggle' }],
  examples: [
    {
      html: `
        <div class="narrow">
          <jl-accordion-item heading="Show the request details">
            <p class="muted">POST /v1/payments · 201 Created · 182 ms</p>
          </jl-accordion-item>
        </div>`,
      title: 'A disclosure',
    },
    {
      description: 'An icon before the heading; a disabled item cannot be opened or closed.',
      html: `
        <div class="narrow">
          <jl-accordion-item heading="Shipping" icon="package" open>
            <p class="muted">Free over CHF 50. Ships within two working days.</p>
          </jl-accordion-item>
          <jl-accordion-item heading="Returns" icon="refresh" disabled>
            <p class="muted">Returns open after delivery.</p>
          </jl-accordion-item>
        </div>`,
      title: 'Icon and disabled',
    },
    {
      description: 'A quieter line says what the item holds, open or closed.',
      html: `
        <div class="narrow">
          <jl-accordion-item heading="Invoice" description="3 fields, 2 pages" icon="file-text" open>
            <p class="muted">Number, date and total, read from the PDF.</p>
          </jl-accordion-item>
          <jl-accordion-item heading="Email" description="From billing@example.com" icon="mail">
            <p class="muted">The message the invoice came with.</p>
          </jl-accordion-item>
        </div>`,
      title: 'With a description',
    },
    {
      description: 'open is a property too: set it from code, and listen to toggle.',
      html: `
        <div class="stack narrow">
          <jl-accordion-item class="demo-item" heading="Advanced options">
            <p class="muted">Timeouts, retries and the region.</p>
          </jl-accordion-item>
          <div class="row">
            <jl-button class="demo-toggle" size="sm" label="Toggle from code"></jl-button>
            <span class="muted demo-state">Closed</span>
          </div>
        </div>`,
      script: `
        const item = root.querySelector('.demo-item');
        const state = root.querySelector('.demo-state');
        item.events.register('toggle', (open) => { state.textContent = open ? 'Open' : 'Closed'; });
        root.querySelector('.demo-toggle').events.register('press', () => item.open.set((open) => !open));`,
      setup: (root) => {
        const item = root.querySelector<JlAccordionItem>('.demo-item');
        const state = root.querySelector('.demo-state');
        item?.events.register('toggle', (open) => {
          if (state !== null) {
            state.textContent = open ? 'Open' : 'Closed';
          }
        });
        root
          .querySelector<JlButton>('.demo-toggle')
          ?.events.register('press', () => item?.open.set((open) => !open));
      },
      title: 'Opened from code',
    },
  ],
  level: 'molecule',
  name: 'Accordion item',
  playground: {
    attributes: { heading: 'What does the free plan include?', icon: 'circle-help' },
    content: 'Three projects, five people and a week of history. Upgrade when you need more.',
    width: 440,
  },
  props: [
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'The text of the heading that opens and closes the item.',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'description',
      control: { kind: 'text' },
      default: "''",
      description: 'A quieter line under the heading, shown open or closed: what the item holds.',
      name: 'description',
      type: 'string',
    },
    {
      attribute: 'open',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The content shows.',
      name: 'open',
      type: 'boolean',
    },
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "''",
      description: 'An icon name, drawn before the heading. The icon slot takes a richer one instead.',
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'People cannot open or close it.',
      name: 'disabled',
      type: 'boolean',
    },
  ],
  slots: [
    { description: 'The content under the heading.', name: '' },
    {
      description: 'An element drawn before the heading instead of the icon: a coloured badge, an avatar.',
      name: 'icon',
    },
  ],
  styling: [
    { description: 'The native details element.', name: 'base' },
    {
      description: 'The space at the left and right of the heading and the content (0 alone, 16px when bordered).',
      name: '--pad-x',
    },
  ],
  summary: 'A section that opens and closes under its heading: a disclosure, or one item of an accordion.',
  tag: 'jl-accordion-item',
};
