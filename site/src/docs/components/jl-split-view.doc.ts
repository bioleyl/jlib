import type { JlButton, JlSplitView } from '@syware/jlib';
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
takes the height of its container, and each pane scrolls on its own.

On a phone, a list and the item opened from it read better as two pages. Narrower than stack-below pixels, the view
shows one pane at a time, the one pane names (start for the list, end for the item), with the attribute stacked:
set pane to end when an item opens, and give the item a way back. stack fires when it stacks or unstacks.`,
  events: [
    { description: 'The divider moved: the new position, in percent.', detail: 'number', name: 'change' },
    {
      description: 'It started (true) or stopped (false) showing one pane at a time.',
      detail: 'boolean',
      name: 'stack',
    },
  ],
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
    {
      description:
        'stack-below="480" in a 360px frame: one pane at a time, as on a phone. Opening an item shows the end pane; its back link the start pane.',
      html: `
        <div style="height: 240px; width: 360px; max-width: 100%; ${FRAME}">
          <jl-split-view class="demo-stack" stack-below="480" position="40">
            <div slot="start" style="display: grid">
              <jl-list-item class="demo-open" heading="Refund request from Léa Dubois" description="Answer support emails" interactive></jl-list-item>
              <jl-list-item class="demo-open" heading="Reply to Maria Rossi" description="Answer support emails" interactive></jl-list-item>
            </div>
            <div slot="end" style="display: grid; gap: 12px; align-content: start; padding: 16px">
              <div><jl-button class="demo-back" variant="ghost" size="sm" icon="arrow-left" label="Review inbox"></jl-button></div>
              <strong>Refund request from Léa Dubois</strong>
              <span class="muted">Approve the refund and tell the customer.</span>
            </div>
          </jl-split-view>
        </div>`,
      script: `
        const split = root.querySelector('.demo-stack');
        for (const item of root.querySelectorAll('.demo-open')) {
          item.addEventListener('click', () => split.pane.set('end'));
        }
        root.querySelector('.demo-back').events.register('press', () => split.pane.set('start'));`,
      setup: (root) => {
        const split = root.querySelector<JlSplitView>('.demo-stack');
        for (const item of root.querySelectorAll('.demo-open')) {
          item.addEventListener('click', () => split?.pane.set('end'));
        }
        root.querySelector<JlButton>('.demo-back')?.events.register('press', () => split?.pane.set('start'));
      },
      title: 'Stacked on a phone',
    },
  ],
  level: 'template',
  methods: [
    {
      description: 'Puts the divider back where the position attribute placed it (50% without one).',
      name: 'reset',
      signature: 'reset(): void',
    },
    {
      description: 'Whether it shows one pane at a time now.',
      name: 'isStacked',
      signature: 'isStacked(): boolean',
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
    {
      attribute: 'stack-below',
      control: { kind: 'number', max: 2000, min: 0, step: 40 },
      default: '0',
      description: 'Under this width, in pixels, one pane at a time; 0 never stacks.',
      name: 'stackBelow',
      type: 'number',
    },
    {
      attribute: 'pane',
      control: { kind: 'select', options: ['start', 'end'] },
      default: "'start'",
      description: 'The pane shown while stacked.',
      name: 'pane',
      type: "'start' | 'end'",
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
