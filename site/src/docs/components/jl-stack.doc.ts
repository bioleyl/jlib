import type { JlButton, JlDialog } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlStack',
  description: `A stack puts what it holds one under the other, each item as wide as the stack, with one space between
them. It is the layout of a form's fields, wherever they are: a dialog's body, a page, a card, a drawer. A dialog lays
out nothing itself, so its fields go in a stack rather than straight in the dialog.

Each child is an item, a bare text included: wrap a sentence that holds a link or a strong word in a <p>.`,
  examples: [
    {
      description: 'The fields of a form, each in its jl-field.',
      html: `
        <jl-stack class="narrow">
          <jl-field label="Name" required>
            <jl-input placeholder="Warehouse North"></jl-input>
          </jl-field>
          <jl-field label="Category">
            <jl-select options='[{"value":"store","label":"Store"},{"value":"depot","label":"Depot"}]'></jl-select>
          </jl-field>
          <jl-field label="Notes" hint="Seen by the whole team.">
            <jl-textarea rows="3"></jl-textarea>
          </jl-field>
        </jl-stack>`,
      title: 'A form',
    },
    {
      description: 'The fields of a dialog: the stack spaces them, the dialog only frames them.',
      html: `
        <div class="row">
          <jl-button class="open-form" variant="primary" icon="plus" label="New category"></jl-button>
        </div>
        <jl-dialog class="form" heading="New category">
          <jl-stack>
            <jl-field label="Name" required>
              <jl-input placeholder="Spare parts"></jl-input>
            </jl-field>
            <jl-field label="Code" hint="Three letters, on the labels.">
              <jl-input placeholder="SPA"></jl-input>
            </jl-field>
          </jl-stack>
          <jl-button slot="actions" label="Cancel"></jl-button>
          <jl-button slot="actions" variant="primary" label="Create"></jl-button>
        </jl-dialog>`,
      script: `
        const dialog = root.querySelector('jl-dialog.form');
        root.querySelector('.open-form').events.register('press', () => dialog.show());
        for (const button of dialog.querySelectorAll('jl-button')) {
          button.events.register('press', () => dialog.close());
        }`,
      setup: (root) => {
        const dialog = root.querySelector<JlDialog>('jl-dialog.form');
        root.querySelector<JlButton>('.open-form')?.events.register('press', () => dialog?.show());
        for (const button of root.querySelectorAll<JlButton>('jl-dialog.form jl-button')) {
          button.events.register('press', () => dialog?.close());
        }
      },
      title: 'In a dialog',
    },
    {
      description: 'Small between the lines of a group, large between groups.',
      html: `
        <jl-stack gap="lg" class="narrow">
          <jl-stack gap="sm">
            <jl-checkbox label="Email me when a job ends" checked></jl-checkbox>
            <jl-checkbox label="Email me when a job fails" checked></jl-checkbox>
          </jl-stack>
          <jl-stack gap="sm">
            <jl-switch label="Compact rows"></jl-switch>
            <jl-switch label="Show the IDs"></jl-switch>
          </jl-stack>
        </jl-stack>`,
      title: 'Gaps',
    },
  ],
  level: 'template',
  name: 'Stack',
  playground: {
    attributes: { gap: 'md' },
    content: `<jl-input placeholder="First"></jl-input>
<jl-input placeholder="Second"></jl-input>
<jl-input placeholder="Third"></jl-input>`,
  },
  props: [
    {
      attribute: 'gap',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The space between the items: 8, 16 or 24 pixels.',
      name: 'gap',
      type: "'sm' | 'md' | 'lg'",
    },
  ],
  slots: [{ description: 'The items, one under the other.', name: '' }],
  styling: [
    { description: 'The grid that lays out the items.', name: 'base' },
    { description: 'The space between the items, which overrides gap.', name: '--gap' },
  ],
  summary: 'Its children one under the other, with one space between them: the layout of a form.',
  tag: 'jl-stack',
};
