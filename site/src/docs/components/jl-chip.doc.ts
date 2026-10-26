import type { JlChip } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlChip',
  description: `Chips are small tokens: filters people turn on and off, tags they can take away, or plain labels.
A selectable chip is a toggle button (aria-pressed); pressing it fires change with its new state.

A removable chip has an × that fires dismiss: the page removes the chip, or the value it stands for. Backspace and
Delete on a focused selectable chip do the same.`,
  events: [
    {
      description: 'A selectable chip was pressed; the detail is its new state.',
      detail: 'boolean',
      name: 'change',
    },
    { description: 'The × of a removable chip was pressed.', detail: 'undefined', name: 'dismiss' },
  ],
  examples: [
    {
      description: 'Press to turn a filter on and off; a selected chip without an icon shows a check.',
      html: `
        <div class="row demo-filters">
          <jl-chip label="All" selectable selected></jl-chip>
          <jl-chip label="Open" selectable></jl-chip>
          <jl-chip label="In review" selectable></jl-chip>
          <jl-chip label="Merged" icon="check" selectable></jl-chip>
          <jl-chip label="Archived" selectable disabled></jl-chip>
        </div>
        <p class="muted demo-filter-state">Showing: All</p>`,
      script: `
        const chips = [...root.querySelectorAll('.demo-filters jl-chip')];
        const state = root.querySelector('.demo-filter-state');
        for (const chip of chips) {
          chip.events.register('change', () => {
            const on = chips.filter((each) => each.selected.get()).map((each) => each.label.get());
            state.textContent = \`Showing: \${on.join(', ') || 'nothing'}\`;
          });
        }`,
      setup: (root) => {
        const chips = [...root.querySelectorAll<JlChip>('.demo-filters jl-chip')];
        const state = root.querySelector('.demo-filter-state');
        for (const chip of chips) {
          chip.events.register('change', () => {
            const on = chips.filter((each) => each.selected.get()).map((each) => each.label.get());
            if (state !== null) {
              state.textContent = `Showing: ${on.join(', ') || 'nothing'}`;
            }
          });
        }
      },
      title: 'Filters',
    },
    {
      description: 'The × fires dismiss; here the page takes the chip away.',
      html: `
        <div class="row demo-tags">
          <jl-chip label="design" removable></jl-chip>
          <jl-chip label="accessibility" removable></jl-chip>
          <jl-chip label="web components" icon="puzzle" removable></jl-chip>
          <jl-chip label="locked" icon="lock"></jl-chip>
        </div>`,
      script: `
        for (const chip of root.querySelectorAll('.demo-tags jl-chip[removable]')) {
          chip.events.register('dismiss', () => chip.remove());
        }`,
      setup: (root) => {
        for (const chip of root.querySelectorAll<JlChip>('.demo-tags jl-chip[removable]')) {
          chip.events.register('dismiss', () => chip.remove());
        }
      },
      title: 'Removable tags',
    },
    {
      html: `
        <div class="row">
          <jl-chip size="sm" label="Small" selectable selected></jl-chip>
          <jl-chip size="sm" label="Small tag" removable></jl-chip>
          <jl-chip label="Medium" selectable selected></jl-chip>
          <jl-chip label="Medium tag" removable></jl-chip>
        </div>`,
      title: 'Sizes',
    },
  ],
  level: 'atom',
  methods: [
    {
      description: 'Turns a selectable chip on or off as a press would, and fires change.',
      name: 'toggle',
      signature: 'toggle(): void',
    },
  ],
  name: 'Chip',
  playground: { attributes: { icon: 'filter', label: 'Open issues', selectable: true } },
  props: [
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The text.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "''",
      description: 'An icon before the label.',
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'selectable',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Turns on and off when pressed, as a toggle button.',
      name: 'selectable',
      type: 'boolean',
    },
    {
      attribute: 'selected',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'On: drawn in the accent colour.',
      name: 'selected',
      type: 'boolean',
    },
    {
      attribute: 'removable',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shows an × that fires dismiss.',
      name: 'removable',
      type: 'boolean',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Cannot be pressed or dismissed.',
      name: 'disabled',
      type: 'boolean',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['md', 'sm'] },
      default: "'md'",
      description: '28 or 24 pixels high.',
      name: 'size',
      type: "'sm' | 'md'",
    },
  ],
  slots: [{ description: 'Rich content after the label.', name: '' }],
  styling: [{ description: 'The chip.', name: 'base' }],
  summary: 'A compact token: a filter to turn on and off, a tag to take away, or a label.',
  tag: 'jl-chip',
};
