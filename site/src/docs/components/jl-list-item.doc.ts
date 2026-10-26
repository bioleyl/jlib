import type { JlButton, JlListItem } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlListItem',
  description: `A list item is one row: an icon (or an avatar in slot="start"), a heading and a description, a short
note at the end (meta) and controls in slot="end". Rows next to each other are separated by a line; the last one
leaves the edge to its container, such as a card with padding="none".

With href the row is a link named by its heading, with a chevron; with interactive it fires press. The controls in
slot="end" stay pressable on their own. Wrap the rows in an element with role="list" and give each role="listitem"
when they form a list for screen readers.`,
  events: [
    {
      description: 'An interactive row was pressed (not on a control inside it).',
      detail: 'undefined',
      name: 'press',
    },
  ],
  examples: [
    {
      html: `
        <jl-card class="narrow" padding="none">
          <div role="list">
            <jl-list-item role="listitem" icon="file-text" heading="Quarterly report.pdf" description="Shared by Ada" meta="2.4 MB"></jl-list-item>
            <jl-list-item role="listitem" icon="image" heading="Launch banner.png" description="Shared by Grace" meta="860 KB"></jl-list-item>
            <jl-list-item role="listitem" icon="folder" heading="Contracts" description="12 files" meta="—"></jl-list-item>
          </div>
        </jl-card>`,
      title: 'With icons',
    },
    {
      description: 'Avatars at the start, and trailing buttons that act on each row.',
      html: `
        <jl-card class="narrow demo-members" heading="Members" description="People who can open this project." padding="none">
          <div role="list">
            <jl-list-item role="listitem" heading="Ada Lovelace" description="ada@example.com">
              <jl-avatar slot="start" name="Ada Lovelace" status="online"></jl-avatar>
              <jl-badge slot="end" tone="accent" label="Owner"></jl-badge>
            </jl-list-item>
            <jl-list-item role="listitem" heading="Grace Hopper" description="grace@example.com">
              <jl-avatar slot="start" name="Grace Hopper" status="away"></jl-avatar>
              <jl-button slot="end" class="demo-access" size="sm" label="Editor" icon-end="chevron-down"></jl-button>
              <jl-button slot="end" size="sm" variant="ghost" icon="trash" hint="Remove Grace"></jl-button>
            </jl-list-item>
            <jl-list-item role="listitem" heading="Alan Turing" description="Invitation sent 2 days ago">
              <jl-avatar slot="start" name="Alan Turing"></jl-avatar>
              <jl-button slot="end" size="sm" variant="ghost" label="Resend"></jl-button>
            </jl-list-item>
          </div>
        </jl-card>`,
      title: 'Members, with avatars',
    },
    {
      description: 'Settings rows whose trailing button turns a feature on and off.',
      html: `
        <jl-card class="narrow" padding="none">
          <div role="list" class="demo-settings">
            <jl-list-item role="listitem" icon="mail" heading="Email digests" description="A summary of the week, every Monday.">
              <jl-button slot="end" size="sm" variant="primary" label="On" aria-pressed="true"></jl-button>
            </jl-list-item>
            <jl-list-item role="listitem" icon="bell" heading="Push notifications" description="Mentions and replies, as they happen.">
              <jl-button slot="end" size="sm" label="Off" aria-pressed="false"></jl-button>
            </jl-list-item>
            <jl-list-item role="listitem" icon="shield-check" heading="Security alerts" description="Sign-ins from new devices.">
              <jl-button slot="end" size="sm" variant="primary" label="On" aria-pressed="true"></jl-button>
            </jl-list-item>
          </div>
        </jl-card>`,
      script: `
        for (const button of root.querySelectorAll('.demo-settings jl-button')) {
          button.events.register('press', () => {
            const on = button.getAttribute('aria-pressed') !== 'true';
            button.setAttribute('aria-pressed', String(on));
            button.label.set(on ? 'On' : 'Off');
            button.variant.set(on ? 'primary' : 'secondary');
          });
        }`,
      setup: (root) => {
        for (const button of root.querySelectorAll<JlButton>('.demo-settings jl-button')) {
          button.events.register('press', () => {
            const on = button.getAttribute('aria-pressed') !== 'true';
            button.setAttribute('aria-pressed', String(on));
            button.label.set(on ? 'On' : 'Off');
            button.variant.set(on ? 'primary' : 'secondary');
          });
        }
      },
      title: 'Settings',
    },
    {
      description:
        'Links with a chevron, and interactive rows that fire press; the selected row is the current one.',
      html: `
        <div class="row" style="align-items: flex-start">
          <jl-card style="flex: 1 1 260px" padding="none">
            <jl-list-item href="#/components/list-item" icon="user" heading="Account" selected></jl-list-item>
            <jl-list-item href="#/components/list-item" icon="credit-card" heading="Billing" meta="Pro"></jl-list-item>
            <jl-list-item href="#/components/list-item" icon="users" heading="Team" meta="8"></jl-list-item>
          </jl-card>
          <jl-card style="flex: 1 1 260px" padding="none">
            <div class="demo-inbox">
              <jl-list-item interactive heading="Deploy finished" description="api · main · 2 min ago" selected></jl-list-item>
              <jl-list-item interactive heading="New comment" description="Grace on Launch plan · 1 h ago"></jl-list-item>
              <jl-list-item interactive heading="Invoice paid" description="#2024-118 · yesterday"></jl-list-item>
            </div>
          </jl-card>
        </div>`,
      script: `
        const rows = [...root.querySelectorAll('.demo-inbox jl-list-item')];
        for (const row of rows) {
          row.events.register('press', () => {
            for (const each of rows) each.selected.set(each === row);
          });
        }`,
      setup: (root) => {
        const rows = [...root.querySelectorAll<JlListItem>('.demo-inbox jl-list-item')];
        for (const row of rows) {
          row.events.register('press', () => {
            for (const each of rows) {
              each.selected.set(each === row);
            }
          });
        }
      },
      title: 'Links and interactive rows',
    },
  ],
  level: 'molecule',
  name: 'List item',
  playground: {
    attributes: {
      description: 'Shared by Ada',
      heading: 'Quarterly report.pdf',
      icon: 'file-text',
      meta: '2.4 MB',
    },
    content: '<jl-button slot="end" size="sm" variant="ghost" icon="download" hint="Download"></jl-button>',
    width: 440,
  },
  props: [
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'The main line.',
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
      attribute: 'icon',
      control: { kind: 'text' },
      default: "''",
      description: 'An icon at the start; slot="start" takes an avatar instead.',
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'meta',
      control: { kind: 'text' },
      default: "''",
      description: 'A short note at the end: a time, a size, a count.',
      name: 'meta',
      type: 'string',
    },
    {
      attribute: 'href',
      control: { kind: 'text' },
      default: "''",
      description: 'Makes the row a link, with a chevron.',
      name: 'href',
      type: 'string',
    },
    {
      attribute: 'interactive',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Focusable and pressable as a whole; fires press.',
      name: 'interactive',
      type: 'boolean',
    },
    {
      attribute: 'selected',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The current row, in the accent colour (aria-current).',
      name: 'selected',
      type: 'boolean',
    },
  ],
  slots: [
    { description: 'An avatar or another picture at the start, instead of the icon.', name: 'start' },
    { description: 'Controls at the end: buttons, a badge, a switch.', name: 'end' },
  ],
  styling: [
    { description: 'The row.', name: 'base' },
    { description: 'The room at the start and the end of the row.', name: '--pad-x' },
    { description: 'The room above and under the content.', name: '--pad-y' },
  ],
  summary: 'A row of a list: icon or avatar, heading, description, a note and trailing controls.',
  tag: 'jl-list-item',
};
