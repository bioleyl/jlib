import type { ComponentDoc } from '../../types/docs.types';

const ITEMS = `
<jl-accordion-item heading="Can I change my plan later?" open>
  Yes. Upgrade or downgrade at any time; the difference is prorated on your next invoice.
</jl-accordion-item>
<jl-accordion-item heading="Do you offer a free trial?">
  Every plan starts with 14 days free, no card needed.
</jl-accordion-item>
<jl-accordion-item heading="How do I cancel?">
  From Settings, Billing: the plan stays active until the end of the period you paid for.
</jl-accordion-item>`;

export const doc: ComponentDoc = {
  className: 'JlAccordion',
  description: `A list of jl-accordion-item sections under their headings. By default one item opens at a time:
opening one closes the others, which keeps a long list short. Set multiple to let several stay open, for content
people compare.

plain separates the items with lines on the page; bordered puts them in a box. Each item is a native details element,
so its heading works with the keyboard and screen readers, and the browser's find-in-page opens it.`,
  examples: [
    {
      description: 'One item open at a time: opening another closes it.',
      html: `
        <jl-accordion class="narrow">
          <jl-accordion-item heading="Can I change my plan later?" open>
            Yes. Upgrade or downgrade at any time; the difference is prorated on your next invoice.
          </jl-accordion-item>
          <jl-accordion-item heading="Do you offer a free trial?">
            Every plan starts with 14 days free, no card needed.
          </jl-accordion-item>
          <jl-accordion-item heading="How do I cancel?">
            From Settings, Billing: the plan stays active until the end of the period you paid for.
          </jl-accordion-item>
        </jl-accordion>`,
      title: 'Plain',
    },
    {
      description: 'In a box, lines between the items; multiple lets several stay open.',
      html: `
        <jl-accordion variant="bordered" multiple class="narrow">
          <jl-accordion-item heading="Profile" icon="user" open>
            <p class="muted">Your name, photo and the email people see.</p>
          </jl-accordion-item>
          <jl-accordion-item heading="Notifications" icon="bell" open>
            <p class="muted">Email for mentions and replies; a daily digest for the rest.</p>
          </jl-accordion-item>
          <jl-accordion-item heading="Security" icon="shield-check">
            <p class="muted">Two-step sign-in is on. Last sign-in yesterday from Lausanne.</p>
          </jl-accordion-item>
          <jl-accordion-item heading="Billing" icon="credit-card" disabled>
            <p class="muted">Only owners manage the billing.</p>
          </jl-accordion-item>
        </jl-accordion>`,
      title: 'Bordered, several open',
    },
    {
      description: 'Any content fits in an item: fields and buttons for a settings page.',
      html: `
        <jl-accordion variant="bordered" class="narrow">
          <jl-accordion-item heading="Domain" icon="globe" open>
            <div class="stack">
              <jl-input label="Domain" value="docs.example.com"></jl-input>
              <div class="row"><jl-button variant="primary" size="sm" label="Save"></jl-button></div>
            </div>
          </jl-accordion-item>
          <jl-accordion-item heading="Danger zone" icon="triangle-alert">
            <div class="stack">
              <p class="muted">Deleting the site removes its pages and its history.</p>
              <div class="row"><jl-button variant="danger" size="sm" icon="trash" label="Delete the site"></jl-button></div>
            </div>
          </jl-accordion-item>
        </jl-accordion>`,
      title: 'Settings sections',
    },
  ],
  level: 'molecule',
  name: 'Accordion',
  playground: {
    attributes: { variant: 'bordered' },
    content: ITEMS,
    width: 480,
  },
  props: [
    {
      attribute: 'multiple',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Lets several items stay open together; otherwise opening one closes the others.',
      name: 'multiple',
      type: 'boolean',
    },
    {
      attribute: 'variant',
      control: { kind: 'select', options: ['plain', 'bordered'] },
      default: "'plain'",
      description: 'Lines between the items on the page, or the items in a box.',
      name: 'variant',
      type: "'plain' | 'bordered'",
    },
  ],
  slots: [{ description: 'The jl-accordion-item elements.', name: '' }],
  styling: [{ description: 'The box around the items.', name: 'base' }],
  summary: 'A list of sections that open under their headings, one at a time or several.',
  tag: 'jl-accordion',
};
