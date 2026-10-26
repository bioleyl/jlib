import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlSpinner',
  description: `For work that takes a moment and has no measurable progress. When the progress is known, a progress bar
says more. The spinner follows the text colour and has the status role, so screen readers hear its label.`,
  examples: [
    {
      html: `
        <div class="row">
          <jl-spinner size="12"></jl-spinner>
          <jl-spinner></jl-spinner>
          <jl-spinner size="24"></jl-spinner>
          <jl-spinner size="36"></jl-spinner>
        </div>`,
      title: 'Sizes',
    },
    {
      html: `
        <div class="row">
          <span class="row muted" style="gap: 8px"><jl-spinner></jl-spinner> Loading your projects…</span>
          <jl-spinner style="color: var(--jl-accent)" size="20"></jl-spinner>
        </div>`,
      title: 'With text, and coloured',
    },
  ],
  level: 'atom',
  name: 'Spinner',
  playground: { attributes: { size: '24' } },
  props: [
    {
      attribute: 'size',
      control: { kind: 'number', max: 64, min: 10, step: 2 },
      default: '16',
      description: 'Width and height, in pixels.',
      name: 'size',
      type: 'number',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "'Loading'",
      description: 'What screen readers say.',
      name: 'label',
      type: 'string',
    },
  ],
  summary: 'A turning ring for work in progress.',
  tag: 'jl-spinner',
};
