import chipGroupCode from '../typing/jl-chip-group.code.ts?raw';
import chipGroupJsx from '../typing/jl-chip-group.jsx.tsx?raw';

import type { JlChipGroup } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const STATUSES = JSON.stringify([
  { badge: 128, label: 'All', value: 'all' },
  { badge: 12, label: 'Open', value: 'open' },
  { badge: 5, label: 'In progress', value: 'progress' },
  { badge: 3, label: 'Waiting', value: 'waiting' },
  { badge: 96, label: 'Done', value: 'done' },
  { badge: 12, label: 'Cancelled', value: 'cancelled' },
]);

const TOPICS = JSON.stringify([
  { icon: 'code', label: 'Engineering', value: 'engineering' },
  { icon: 'palette', label: 'Design', value: 'design' },
  { icon: 'chart', label: 'Data', value: 'data' },
  { icon: 'shield-check', label: 'Security', value: 'security' },
  { icon: 'users', label: 'People', value: 'people' },
]);

const REASONS = JSON.stringify([
  { label: 'Damaged', value: 'damaged' },
  { label: 'Lost', value: 'lost' },
  { label: 'Found', value: 'found' },
  { label: 'Counted', value: 'counted' },
  { disabled: true, label: 'Expired', value: 'expired' },
]);

const SIZES = JSON.stringify([
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
]);

export const doc: ComponentDoc = {
  className: 'JlChipGroup',
  description: `A chip group is a row of choices that stays light: filters above a list, the categories of a shop, the
reason for a correction. With one choice it behaves as radios: Tab reaches the chosen chip, the arrow keys move the
choice, and pressing the chosen chip again keeps it. With multiple, each chip turns on and off, the arrow keys move
between them and Space presses.

value is always a list, in the order of the options: one value at most without multiple. HTML may write a single
value as it is (value="open") or a list as JSON. A badge after the label counts what the choice holds.

On a narrow screen the row scrolls sideways rather than pushing the page wider; wrap lets the chips go to the next
line instead. It takes part in forms: one entry with one choice, an entry per value with several, and required
refuses a form while nothing is chosen.`,
  events: [
    {
      description: 'People changed the choice: the chosen values, in the order of the options.',
      detail: 'Value[]',
      name: 'change',
    },
  ],
  examples: [
    {
      description: 'One choice with counts, as filters above a list. The row scrolls sideways when narrow.',
      html: `
        <div class="stack">
          <jl-chip-group class="demo-filter" label="Status" value="open" options='${STATUSES}'></jl-chip-group>
          <span class="muted demo-filtered">Showing: open</span>
        </div>`,
      script: `
        root.querySelector('.demo-filter').events.register('change', ([status]) => {
          root.querySelector('.demo-filtered').textContent = \`Showing: \${status}\`;
        });`,
      setup: (root) => {
        root.querySelector<JlChipGroup>('.demo-filter')?.events.register('change', ([status]) => {
          const shown = root.querySelector('.demo-filtered');
          if (shown !== null) {
            shown.textContent = `Showing: ${status ?? ''}`;
          }
        });
      },
      title: 'Filters',
    },
    {
      description: 'Several choices, each with its icon; they wrap to the next line.',
      html: `<jl-chip-group label="Topics" multiple wrap value='["design","data"]' options='${TOPICS}'></jl-chip-group>`,
      title: 'Several choices',
    },
    {
      description: 'Nothing chosen yet, and required in a form; a choice can be disabled.',
      html: `
        <form class="stack demo-form">
          <jl-chip-group name="reason" label="Reason" required options='${REASONS}'></jl-chip-group>
          <div class="row">
            <jl-button type="submit" variant="primary" label="Save"></jl-button>
            <span class="muted demo-sent"></span>
          </div>
        </form>`,
      script: `
        const form = root.querySelector('.demo-form');
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          root.querySelector('.demo-sent').textContent = \`reason=\${new FormData(form).get('reason')}\`;
        });`,
      setup: (root) => {
        const form = root.querySelector<HTMLFormElement>('.demo-form');
        form?.addEventListener('submit', (event) => {
          event.preventDefault();
          const sent = root.querySelector('.demo-sent');
          if (sent !== null) {
            sent.textContent = `reason=${String(new FormData(form).get('reason'))}`;
          }
        });
      },
      title: 'In a form',
    },
    {
      description: 'sm in dense panels, md by default, lg where a thumb presses it.',
      html: `
        <div class="stack">
          <jl-chip-group size="sm" label="Period" value="week" options='${SIZES}'></jl-chip-group>
          <jl-chip-group label="Period" value="week" options='${SIZES}'></jl-chip-group>
          <jl-chip-group size="lg" label="Period" value="week" options='${SIZES}'></jl-chip-group>
        </div>`,
      title: 'Sizes',
    },
  ],
  level: 'molecule',
  name: 'Chip group',
  playground: {
    attributes: { label: 'Status', options: STATUSES, value: 'open' },
    width: 'full',
  },
  props: [
    {
      attribute: 'options',
      control: { kind: 'json' },
      default: '[]',
      description: 'The choices: value, label, and an optional icon, badge and disabled.',
      name: 'options',
      type: 'ChipGroupOption<Value>[]',
    },
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: '[]',
      description: 'The chosen values. In HTML, one value as it is or a JSON list.',
      name: 'value',
      type: 'Value[]',
    },
    {
      attribute: 'multiple',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Several chips can be chosen, each turned on and off.',
      name: 'multiple',
      type: 'boolean',
    },
    {
      attribute: 'wrap',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Goes to the next line instead of scrolling sideways.',
      name: 'wrap',
      type: 'boolean',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The height: 24, 28 or 36 pixels.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The name of the group for screen readers, when nothing visible names it.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'required',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'A form refuses to submit while nothing is chosen.',
      name: 'required',
      type: 'boolean',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'No chip can be pressed.',
      name: 'disabled',
      type: 'boolean',
    },
    {
      attribute: 'name',
      control: { kind: 'text' },
      default: "''",
      description: 'The name of its entries in the form data.',
      name: 'name',
      type: 'string',
    },
  ],
  styling: [{ description: 'The row of chips.', name: 'base' }],
  summary: 'A row of chips to choose from: one, as radios, or several, each turned on and off.',
  tag: 'jl-chip-group',
  typing: {
    code: chipGroupCode,
    description:
      "Typed by its values, JlChipGroup<'open' | 'done' | 'failed'> takes options of those values only, and gives change and value as lists of them: the editor completes them and refuses another. In JSX, the type can also be read from the options.",
    jsx: chipGroupJsx,
  },
};
