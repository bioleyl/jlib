import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlCodeBlock',
  description: `Shows source code with light colouring for TypeScript and JSX, HTML, CSS and shell, and a button to copy
it. The colouring is a small scanner, not a parser: it is meant for snippets in docs and settings pages.

Give the code as the code property, or write it inside the element. HTML written inside is parsed by the browser,
so wrap it in a template to keep it as text.`,
  examples: [
    {
      html: `
        <jl-code-block language="ts" heading="main.ts">
          import { JlButton } from '@syware/jlib';

          const save = new JlButton();
          save.label.set('Save');
          save.events.register('press', () => console.log('saved'));
          document.body.append(save);
        </jl-code-block>`,
      title: 'TypeScript, with a file name',
    },
    {
      html: `
        <jl-code-block language="html">
          <template>
            <jl-field label="Email">
              <jl-input type="email" name="email" required></jl-input>
            </jl-field>
          </template>
        </jl-code-block>`,
      title: 'HTML, kept in a template',
    },
    {
      html: `
        <jl-code-block language="css" line-numbers>
          :root {
            --jl-accent: #7c3aed;
            --jl-accent-strong: #6d28d9;
          }
        </jl-code-block>`,
      title: 'CSS, with line numbers',
    },
    {
      html: `<jl-code-block language="bash" code="npm install @syware/jlib @jadis/core"></jl-code-block>`,
      title: 'Shell',
    },
  ],
  level: 'molecule',
  name: 'Code block',
  playground: {
    attributes: { code: "const greeting = 'Hello';\nconsole.log(greeting);", heading: 'hello.ts', language: 'ts' },
    width: 560,
  },
  props: [
    {
      attribute: 'code',
      control: { kind: 'text' },
      default: "''",
      description: "The code; without it, the element's own text.",
      name: 'code',
      type: 'string',
    },
    {
      attribute: 'language',
      control: { kind: 'select', options: ['text', 'ts', 'html', 'css', 'bash'] },
      default: "'text'",
      description: 'How to colour it.',
      name: 'language',
      type: "'text' | 'ts' | 'html' | 'css' | 'bash'",
    },
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'A file name or title over the code.',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'line-numbers',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Numbers the lines.',
      name: 'lineNumbers',
      type: 'boolean',
    },
    {
      attribute: 'wrap',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Wraps long lines instead of scrolling.',
      name: 'wrap',
      type: 'boolean',
    },
    {
      attribute: 'max-height',
      control: { kind: 'text' },
      default: "''",
      description:
        'A CSS height past which the code scrolls under its header, the copy button staying in view: 320px, 50vh; a number is pixels.',
      name: 'maxHeight',
      type: 'string',
    },
    {
      attribute: 'hide-copy',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Hides the copy button.',
      name: 'hideCopy',
      type: 'boolean',
    },
  ],
  styling: [{ description: 'The frame.', name: 'base' }],
  summary: 'Source code, coloured, with a button to copy it.',
  tag: 'jl-code-block',
};
