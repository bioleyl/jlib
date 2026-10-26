import type { JlSplitView } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

const CODE_PANE = `
  <div slot="start" style="padding: 16px">
    <jl-code-block language="html" heading="sign-in.html">
      <template>
        <form class="stack">
          <jl-input placeholder="Email"></jl-input>
          <jl-input type="password" placeholder="Password"></jl-input>
          <jl-button variant="primary" label="Sign in" block></jl-button>
        </form>
      </template>
    </jl-code-block>
  </div>`;

const PREVIEW_PANE = `
  <div slot="end" style="display: grid; place-items: center; height: 100%; padding: 24px; background: var(--jl-surface-2)">
    <form style="display: grid; gap: 12px; width: min(100%, 260px)">
      <jl-input placeholder="Email"></jl-input>
      <jl-input type="password" placeholder="Password"></jl-input>
      <jl-button variant="primary" label="Sign in" block></jl-button>
    </form>
  </div>`;

const FRAME = 'border: 1px solid var(--jl-line); border-radius: var(--jl-radius-lg); overflow: hidden';

export const doc: ComponentDoc = {
  className: 'JlSplitView',
  description: `Two panes with a divider people drag to share the room between them: side by side (horizontal, the
default) or one above the other (vertical). position is the start pane's share in percent, and each pane keeps at
least min percent.

The divider is a focusable separator: the arrows move it by 2% (10% with Shift), Home and End send it to the ends,
a double click puts it back where the page placed it. change fires once a drag ends or a key moved it. The view
takes the height of its container, and each pane scrolls on its own.`,
  events: [{ description: 'The divider moved: the new position, in percent.', detail: 'number', name: 'change' }],
  examples: [
    {
      description: 'The code on one side, what it draws on the other.',
      html: `
        <div style="${FRAME}; height: 260px">
          <jl-split-view position="55">${CODE_PANE}${PREVIEW_PANE}
          </jl-split-view>
        </div>`,
      title: 'Code and preview',
    },
    {
      description: 'An editor over its console; each pane keeps at least a quarter.',
      html: `
        <div style="${FRAME}; height: 320px">
          <jl-split-view orientation="vertical" position="65" min="25">
            <div slot="start" style="padding: 12px">
              <jl-code-block language="ts" heading="total.js" code="const total = items.reduce((sum, item) => sum + item.price, 0);&#10;console.log(total);"></jl-code-block>
            </div>
            <div slot="end" style="padding: 12px 16px; font-family: var(--jl-font-mono); font-size: 13px">
              <div class="muted">$ node total.js</div>
              <div>128.5</div>
            </div>
          </jl-split-view>
        </div>`,
      title: 'Vertical',
    },
    {
      description: 'The text follows change; double-click the divider to put it back.',
      html: `
        <div class="stack">
          <div style="${FRAME}; height: 160px">
            <jl-split-view class="demo-split" position="30" label="Resize the file list">
              <div slot="start" style="padding: 16px" class="muted">Files</div>
              <div slot="end" style="padding: 16px" class="muted">Editor</div>
            </jl-split-view>
          </div>
          <p class="muted demo-split-out">The file list takes 30%.</p>
        </div>`,
      script: `
        const split = root.querySelector('.demo-split');
        const out = root.querySelector('.demo-split-out');
        split.events.register('change', (position) => {
          out.textContent = \`The file list takes \${Math.round(position)}%.\`;
        });`,
      setup: (root) => {
        const split = root.querySelector<JlSplitView>('.demo-split');
        const out = root.querySelector('.demo-split-out');
        split?.events.register('change', (position) => {
          if (out !== null) {
            out.textContent = `The file list takes ${Math.round(position)}%.`;
          }
        });
      },
      title: 'Listening',
    },
  ],
  level: 'template',
  methods: [
    {
      description: 'Puts the divider back where the position attribute placed it (50% without one).',
      name: 'reset',
      signature: 'reset(): void',
    },
  ],
  name: 'Split view',
  playground: {
    attributes: { style: 'height: 260px' },
    content: `${CODE_PANE}${PREVIEW_PANE}`,
    width: 'full',
  },
  props: [
    {
      attribute: 'orientation',
      control: { kind: 'select', options: ['horizontal', 'vertical'] },
      default: "'horizontal'",
      description: 'Side by side, or one above the other.',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
    },
    {
      attribute: 'position',
      control: { kind: 'number', max: 100, min: 0 },
      default: '50',
      description: "The start pane's share of the room, in percent.",
      name: 'position',
      type: 'number',
    },
    {
      attribute: 'min',
      control: { kind: 'number', max: 50, min: 0 },
      default: '15',
      description: 'The smallest share each pane keeps, in percent.',
      name: 'min',
      type: 'number',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "'Resize the panes'",
      description: "The divider's name for screen readers.",
      name: 'label',
      type: 'string',
    },
  ],
  slots: [
    { description: 'The first pane: left, or top.', name: 'start' },
    { description: 'The second pane: right, or bottom.', name: 'end' },
  ],
  styling: [
    { description: 'The grid of the two panes and the divider.', name: 'base' },
    { description: 'The start pane.', name: 'start' },
    { description: 'The end pane.', name: 'end' },
    { description: 'The divider.', name: 'divider' },
  ],
  summary: 'Two panes with a divider to drag between them, side by side or stacked.',
  tag: 'jl-split-view',
};
