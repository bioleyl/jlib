import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlCopyButton',
  description: `Puts a text on the clipboard and turns into a check for a moment, so people know it worked. Code blocks
use it; use it beside any value people copy: a token, a link, a command.`,
  events: [{ description: 'The text is on the clipboard.', detail: 'string', name: 'copy' }],
  examples: [
    {
      html: `
        <div class="row">
          <code>npm install @syware/jlib</code>
          <jl-copy-button value="npm install @syware/jlib"></jl-copy-button>
        </div>`,
      title: 'Beside a value',
    },
    {
      html: `
        <div class="row">
          <jl-copy-button value="https://example.com/invite/7f3a" label="Copy link"></jl-copy-button>
          <jl-copy-button value="sk_live_51H" size="md" label="Copy key"></jl-copy-button>
        </div>`,
      title: 'With a label',
    },
  ],
  level: 'molecule',
  methods: [{ description: 'Copies the value now.', name: 'copy', signature: 'copy(): Promise<void>' }],
  name: 'Copy button',
  playground: { attributes: { label: 'Copy', value: 'Hello from jlib' } },
  props: [
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The text to copy.',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'Shown beside the icon; without it the button is an icon with a tooltip.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'sm'",
      description: 'The height.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
  ],
  summary: 'Copies a text to the clipboard, and says so.',
  tag: 'jl-copy-button',
};
