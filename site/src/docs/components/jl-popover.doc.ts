import type { JlButton, JlPopover } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

/** Closes the example's popover when its Save button is pressed. */
function closeOnSave(root: HTMLElement): void {
  const popover = root.querySelector<JlPopover>('.demo-settings');
  root.querySelector<JlButton>('.demo-save')?.events.register('press', () => popover?.hide());
}

export const doc: ComponentDoc = {
  className: 'JlPopover',
  description: `A panel of content that opens by its trigger: put a button in slot="trigger" and the content in the
default slot. A click on the trigger opens and closes it; a click outside or Escape closes it too (the browser's
popover light dismiss).

When it opens, the focus moves to the first field or button inside, or to the panel itself; Escape sends it back to
the trigger. A heading names the panel for screen readers (the trigger does otherwise). Unlike a dialog, the page
around stays usable: keep a popover for small things, a form of a few fields or a handful of details.`,
  events: [
    { description: 'The panel opened.', detail: 'undefined', name: 'open' },
    {
      description: 'The panel closed: the trigger, a click outside, Escape or hide().',
      detail: 'undefined',
      name: 'close',
    },
  ],
  examples: [
    {
      html: `
        <jl-popover heading="Shipping">
          <jl-button slot="trigger" icon="info" label="Delivery times"></jl-button>
          <p class="muted">Orders placed before 2 pm ship the same day. Delivery takes one to three working days in Switzerland.</p>
        </jl-popover>`,
      title: 'Details on demand',
    },
    {
      description: 'A small settings form: the focus moves to the first field, Save closes the panel.',
      html: `
        <jl-popover class="demo-settings" heading="Display">
          <jl-button slot="trigger" icon="settings" label="Display settings"></jl-button>
          <div class="stack">
            <jl-segmented block label="Density" value="comfortable" options='[{"value":"compact","label":"Compact"},{"value":"comfortable","label":"Comfortable"}]'></jl-segmented>
            <jl-input label="Rows per page" type="number" value="25" min="10" max="100"></jl-input>
            <div class="row">
              <jl-button class="demo-save" variant="primary" size="sm" label="Save"></jl-button>
            </div>
          </div>
        </jl-popover>`,
      script: `
        const popover = root.querySelector('jl-popover');
        root.querySelector('.demo-save').events.register('press', () => popover.hide());`,
      setup: closeOnSave,
      title: 'A settings form',
    },
    {
      description: 'placement picks the side; the panel flips when there is no room.',
      html: `
        <div class="row">
          <jl-popover placement="bottom-end">
            <jl-button slot="trigger" label="Bottom end"></jl-button>
            <p class="muted">Aligned with the trigger's end edge.</p>
          </jl-popover>
          <jl-popover placement="right">
            <jl-button slot="trigger" label="Right"></jl-button>
            <p class="muted">Beside the trigger.</p>
          </jl-popover>
          <jl-popover placement="top">
            <jl-button slot="trigger" label="Top"></jl-button>
            <p class="muted">Over the trigger.</p>
          </jl-popover>
        </div>`,
      title: 'Placements',
    },
  ],
  level: 'molecule',
  methods: [
    { description: 'Opens the panel.', name: 'show', signature: 'show(): void' },
    { description: 'Closes the panel.', name: 'hide', signature: 'hide(): void' },
    {
      description: 'Opens the panel when it is closed, and closes it when it is open.',
      name: 'toggle',
      signature: 'toggle(): void',
    },
  ],
  name: 'Popover',
  playground: {
    attributes: { heading: 'Share this file', placement: 'bottom-start' },
    content: `<jl-button slot="trigger" icon="share" label="Share"></jl-button>
<div class="stack">
  <jl-input label="Email" type="email" placeholder="name@example.com"></jl-input>
  <jl-button variant="primary" size="sm" label="Send invite"></jl-button>
</div>`,
    height: 320,
  },
  props: [
    {
      attribute: 'open',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The panel shows.',
      name: 'open',
      type: 'boolean',
    },
    {
      attribute: 'heading',
      control: { kind: 'text' },
      default: "''",
      description: 'A title over the content; it also names the panel for screen readers.',
      name: 'heading',
      type: 'string',
    },
    {
      attribute: 'placement',
      control: {
        kind: 'select',
        options: ['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end', 'left', 'right'],
      },
      default: "'bottom-start'",
      description: 'The side of the trigger the panel goes on, and where along it.',
      name: 'placement',
      type: 'Placement',
    },
  ],
  slots: [
    { description: 'The button that opens and closes the panel.', name: 'trigger' },
    { description: 'The panel’s content.', name: '' },
  ],
  styling: [{ description: 'The floating panel.', name: 'base' }],
  summary:
    'A floating panel that opens from a button: a small form, settings or details, closed by a click outside.',
  tag: 'jl-popover',
};
