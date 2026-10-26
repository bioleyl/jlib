import type { JlSegmented } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const PERIODS =
  '[{"value":"day","label":"Day"},{"value":"week","label":"Week"},{"value":"month","label":"Month"}]';

export const doc: ComponentDoc = {
  className: 'JlSegmented',
  description: `For two to five exclusive choices that change what a view shows: a period, a layout, a density. The
thumb slides to the chosen option. Each option is { value, label?, icon?, disabled? }; an option without a label
shows its icon and its value names it for screen readers.

It is a radio group for assistive technology and takes part in forms like one: its name and value go in the form's
data, and a reset brings back the value the page gave. The arrow keys move the choice; change fires with the value
people pick.`,
  events: [
    { description: 'People chose another option; the detail is its value.', detail: 'string', name: 'change' },
  ],
  examples: [
    {
      html: `
        <div class="stack">
          <jl-segmented label="Period" value="week" options='${PERIODS}'></jl-segmented>
          <jl-segmented label="View" value="grid" options='[{"value":"list","icon":"list"},{"value":"grid","icon":"layout-grid"},{"value":"board","icon":"layers"}]'></jl-segmented>
          <jl-segmented label="Theme" value="system" options='[{"value":"light","label":"Light","icon":"sun"},{"value":"dark","label":"Dark","icon":"moon"},{"value":"system","label":"System","icon":"monitor"}]'></jl-segmented>
        </div>`,
      title: 'Labels, icons, or both',
    },
    {
      description: 'sm in dense toolbars, md by default, lg where a thumb presses it.',
      html: `
        <div class="stack">
          <jl-segmented size="sm" label="Period" options='${PERIODS}'></jl-segmented>
          <jl-segmented label="Period" options='${PERIODS}'></jl-segmented>
          <jl-segmented size="lg" label="Period" options='${PERIODS}'></jl-segmented>
        </div>`,
      title: 'Sizes',
    },
    {
      description: 'block shares the whole width; an option or the whole control can be disabled.',
      html: `
        <div class="stack narrow">
          <jl-segmented block label="Plan" value="yearly" options='[{"value":"monthly","label":"Monthly"},{"value":"yearly","label":"Yearly"},{"value":"lifetime","label":"Lifetime","disabled":true}]'></jl-segmented>
          <jl-segmented block disabled label="Period" options='${PERIODS}'></jl-segmented>
        </div>`,
      title: 'Full width and disabled',
    },
    {
      description: 'A badge says what waits behind a choice.',
      html: `
        <jl-segmented label="Reviews" value="pending" options='[{"value":"pending","label":"To review","badge":6},{"value":"done","label":"Decided"}]'></jl-segmented>`,
      title: 'With counts',
    },
    {
      description: 'The value goes with the form; change fires as people choose.',
      html: `
        <form class="stack narrow demo-form">
          <jl-segmented name="density" label="Density" value="comfortable" options='[{"value":"compact","label":"Compact"},{"value":"comfortable","label":"Comfortable"},{"value":"spacious","label":"Spacious"}]'></jl-segmented>
          <p class="muted demo-output">density=comfortable</p>
        </form>`,
      script: `
        const form = root.querySelector('form');
        const output = root.querySelector('.demo-output');
        root.querySelector('jl-segmented').events.register('change', () => {
          output.textContent = [...new FormData(form)].map(([key, value]) => \`\${key}=\${value}\`).join('&');
        });`,
      setup: (root) => {
        const form = root.querySelector('form');
        const output = root.querySelector('.demo-output');
        root.querySelector<JlSegmented>('jl-segmented')?.events.register('change', () => {
          if (form !== null && output !== null) {
            output.textContent = [...new FormData(form)].map(([key, value]) => `${key}=${value}`).join('&');
          }
        });
      },
      title: 'In a form',
    },
  ],
  level: 'molecule',
  name: 'Segmented control',
  playground: {
    attributes: { label: 'Period', options: PERIODS, value: 'week' },
  },
  props: [
    {
      attribute: 'options',
      control: { kind: 'json' },
      default: '[]',
      description:
        'The choices: { value, label?, icon?, badge?, disabled? }. badge is a count or a short word after the label.',
      name: 'options',
      type: 'SegmentedOption[]',
    },
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The chosen option’s value; the first option that can be chosen when it names none.',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'name',
      control: { kind: 'text' },
      default: "''",
      description: 'The field’s name in the form’s data.',
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The group’s name for screen readers, when no visible label names it.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The height: 30, 36 or 44 pixels.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'block',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Takes the whole width, the options sharing it.',
      name: 'block',
      type: 'boolean',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Cannot be changed, and is left out of the form’s data.',
      name: 'disabled',
      type: 'boolean',
    },
  ],
  styling: [{ description: 'The track that holds the options and the thumb.', name: 'base' }],
  summary: 'A few exclusive choices in a row, with a thumb that slides to the chosen one.',
  tag: 'jl-segmented',
};
