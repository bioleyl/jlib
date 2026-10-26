import type { JlCard } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

const MEDIA = `<div slot="media" style="height: 120px; background: linear-gradient(135deg, var(--jl-accent-soft), var(--jl-surface-3))"></div>`;

export const doc: ComponentDoc = {
  className: 'JlCard',
  description: `A card groups what is about one subject: a heading and a description, the content in the default slot,
buttons in slot="actions" (top right) or slot="footer", and a picture in slot="media" (edge to edge, on top). It is
flat, a surface with a line around it; parts with nothing in them leave no gap.

With href the whole card is a link named by its heading; the actions and the footer stay pressable on their own.
With interactive (and no href), the card can be focused and fires press. Keep other buttons out of an interactive
card: screen readers read it as one button. padding="none" leaves the body edge to edge, for a list or a table.`,
  events: [
    {
      description: 'An interactive card was pressed (not on a control inside it).',
      detail: 'undefined',
      name: 'press',
    },
  ],
  examples: [
    {
      html: `
        <jl-card class="narrow" heading="Weekly report" description="Sent every Monday at 9:00">
          Revenue, sign-ups and churn for the past seven days, with the changes since the week before.
        </jl-card>`,
      title: 'Heading and content',
    },
    {
      description: 'An avatar, badges and buttons: a member of a team.',
      html: `
        <jl-card class="narrow">
          <jl-button slot="actions" variant="ghost" size="sm" icon="ellipsis" hint="More"></jl-button>
          <div class="stack">
            <div class="row">
              <jl-avatar size="xl" name="Margaret Hamilton" status="online"></jl-avatar>
              <div>
                <strong>Margaret Hamilton</strong>
                <div class="muted">Lead engineer · Boston</div>
              </div>
            </div>
            <div class="row">
              <jl-badge tone="accent" label="Admin"></jl-badge>
              <jl-badge tone="ok" label="Verified" icon="check"></jl-badge>
              <jl-badge label="Flight software"></jl-badge>
            </div>
          </div>
          <jl-button slot="footer" label="Message" icon="message"></jl-button>
          <jl-button slot="footer" variant="primary" label="View profile"></jl-button>
        </jl-card>`,
      title: 'A profile',
    },
    {
      description: 'With href, the whole card is a link: try the keyboard. With interactive, it fires press.',
      html: `
        <div class="row" style="align-items: stretch">
          <jl-card style="flex: 1 1 220px" href="#/components/card" heading="Getting started" description="Install jlib and write your first page.">
            ${MEDIA}
          </jl-card>
          <jl-card class="demo-pick" style="flex: 1 1 220px" interactive heading="Pro plan" description="For growing teams: $24 per seat.">
            <span class="muted demo-picked">Press to choose.</span>
          </jl-card>
        </div>`,
      script: `
        const card = root.querySelector('.demo-pick');
        card.events.register('press', () => {
          root.querySelector('.demo-picked').textContent = 'Chosen ✓';
        });`,
      setup: (root) => {
        const card = root.querySelector<JlCard>('.demo-pick');
        card?.events.register('press', () => {
          const picked = root.querySelector('.demo-picked');
          if (picked !== null) {
            picked.textContent = 'Chosen ✓';
          }
        });
      },
      title: 'Link and interactive',
    },
    {
      description: 'none for an edge-to-edge body; sm, md (the default) and lg for the room around the content.',
      html: `
        <div class="row" style="align-items: stretch">
          <jl-card padding="sm" heading="Small">12 pixels around.</jl-card>
          <jl-card heading="Medium">20 pixels around.</jl-card>
          <jl-card padding="lg" heading="Large">28 pixels around.</jl-card>
        </div>`,
      title: 'Padding',
    },
    {
      description: 'An empty state inside a card, with the action that fills it.',
      html: `
        <jl-card class="narrow" heading="Webhooks" description="Send events to your servers as they happen.">
          <jl-empty size="sm" icon="zap" heading="No webhooks yet" description="Add an endpoint to receive events such as payments and sign-ups.">
            <jl-button variant="primary" icon="plus" label="Add endpoint"></jl-button>
          </jl-empty>
        </jl-card>`,
      title: 'With an empty state',
    },
  ],
  level: 'molecule',
  name: 'Card',
  playground: {
    attributes: { description: 'Sent every Monday at 9:00', heading: 'Weekly report' },
    content: `Revenue, sign-ups and churn for the past seven days.
<jl-button slot="actions" variant="ghost" size="sm" icon="settings" hint="Settings"></jl-button>
<jl-button slot="footer" label="Preview"></jl-button>
<jl-button slot="footer" variant="primary" label="Send now"></jl-button>`,
    width: 420,
  },
  props: [
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'The title.',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'description',
      control: { kind: 'text' },
      default: "''",
      description: 'A line under the heading.',
      name: 'description',
      type: 'string',
    },
    {
      attribute: 'padding',
      control: { kind: 'select', options: ['md', 'none', 'sm', 'lg'] },
      default: "'md'",
      description: 'The room around the content; none leaves the body edge to edge.',
      name: 'padding',
      type: "'none' | 'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'interactive',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Focusable, with a blue border under the pointer; fires press.',
      name: 'interactive',
      type: 'boolean',
    },
    {
      attribute: 'href',
      control: { kind: 'text' },
      default: "''",
      description: 'Makes the whole card a link, named by its heading.',
      name: 'href',
      type: 'string',
    },
  ],
  slots: [
    { description: 'The content.', name: '' },
    { description: 'A picture or a banner, edge to edge on top.', name: 'media' },
    { description: 'Buttons at the top right, beside the heading.', name: 'actions' },
    { description: 'Buttons or a note under a line, at the bottom.', name: 'footer' },
  ],
  styling: [
    { description: 'The card.', name: 'base' },
    { description: 'The corner radius.', name: '--radius' },
  ],
  summary: 'A flat surface for one subject: heading, content, media, actions and a footer.',
  tag: 'jl-card',
};
