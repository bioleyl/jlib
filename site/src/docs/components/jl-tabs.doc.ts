import type { JlButton, JlTabs } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const PANELS = `
<jl-tab-panel name="overview" label="Overview">
  <p class="muted">What the project is, who works on it, and what changed last.</p>
</jl-tab-panel>
<jl-tab-panel name="activity" label="Activity" badge="3">
  <p class="muted">Three new comments since your last visit.</p>
</jl-tab-panel>
<jl-tab-panel name="settings" label="Settings">
  <p class="muted">Name, visibility and the people who can edit.</p>
</jl-tab-panel>`;

export const doc: ComponentDoc = {
  className: 'JlTabs',
  description: `Write the panels as jl-tab-panel children: each one gives its tab a label, and optionally an icon,
a badge and a disabled state. The tabs follow the panels: add, remove or rename one and the row updates.

The open panel is value, the panel's name (its position when it has none); without a value, the first panel that can
open is shown. Arrow keys move along the row and open the panel they reach, Home and End jump to the ends; only the
open tab is in the Tab order, then the focus goes into the panel.`,
  events: [
    { description: 'People opened another panel; the detail is its name.', detail: 'string', name: 'change' },
  ],
  examples: [
    {
      description: 'The default look: a row of labels over a rule, the open one underlined in the accent colour.',
      html: `
        <jl-tabs>
          <jl-tab-panel name="overview" label="Overview" icon="layout-grid">
            <p class="muted">What the project is, who works on it, and what changed last.</p>
          </jl-tab-panel>
          <jl-tab-panel name="activity" label="Activity" icon="bell" badge="3">
            <p class="muted">Three new comments since your last visit.</p>
          </jl-tab-panel>
          <jl-tab-panel name="files" label="Files" icon="folder">
            <p class="muted">24 files, 3.2 MB.</p>
          </jl-tab-panel>
          <jl-tab-panel name="billing" label="Billing" icon="credit-card" disabled>
            <p class="muted">Only owners see the billing.</p>
          </jl-tab-panel>
        </jl-tabs>`,
      title: 'Line tabs, with icons, a badge and a disabled tab',
    },
    {
      description: 'pill marks the open tab with a soft pill; block makes the tabs share the width.',
      html: `
        <div class="stack narrow">
          <jl-tabs variant="pill" value="open">
            <jl-tab-panel name="all" label="All"><p class="muted">Every issue.</p></jl-tab-panel>
            <jl-tab-panel name="open" label="Open" badge="12"><p class="muted">12 issues wait for someone.</p></jl-tab-panel>
            <jl-tab-panel name="closed" label="Closed"><p class="muted">Done and dusted.</p></jl-tab-panel>
          </jl-tabs>
          <jl-tabs block>
            <jl-tab-panel label="Sign in"><p class="muted">Welcome back.</p></jl-tab-panel>
            <jl-tab-panel label="Create an account"><p class="muted">It takes a minute.</p></jl-tab-panel>
          </jl-tabs>
        </div>`,
      title: 'Pill tabs, and tabs sharing the width',
    },
    {
      description: 'A form in one panel and the code it makes in the other.',
      html: `
        <jl-tabs class="demo-form" value="form">
          <jl-tab-panel name="form" label="Webhook" icon="link">
            <div class="stack narrow">
              <jl-input label="Payload URL" type="url" icon="globe" value="https://example.com/hooks"></jl-input>
              <jl-input label="Secret" type="password" value="s3cret-token"></jl-input>
              <div class="row">
                <jl-button variant="primary" label="Save webhook"></jl-button>
                <jl-button variant="ghost" label="Send a test"></jl-button>
              </div>
            </div>
          </jl-tab-panel>
          <jl-tab-panel name="code" label="Code" icon="code">
            <jl-code-block language="ts" heading="webhook.ts" code="await fetch('https://example.com/hooks', {
  method: 'POST',
  headers: { 'X-Signature': sign(body, secret) },
  body,
});"></jl-code-block>
          </jl-tab-panel>
        </jl-tabs>`,
      title: 'A form and its code',
    },
    {
      description:
        'The tabs follow their panels: add one from code and its tab appears. change says which opened.',
      html: `
        <jl-tabs class="demo-dynamic">
          <jl-tab-panel name="tab-1" label="Query 1"><p class="muted">SELECT * FROM users;</p></jl-tab-panel>
        </jl-tabs>
        <div class="row">
          <jl-button class="demo-add" icon="plus" label="New query"></jl-button>
          <span class="muted demo-open">Open: tab-1</span>
        </div>`,
      script: `
        const tabs = root.querySelector('jl-tabs');
        const status = root.querySelector('.demo-open');
        tabs.events.register('change', (name) => { status.textContent = \`Open: \${name}\`; });
        root.querySelector('.demo-add').events.register('press', () => {
          const count = tabs.children.length + 1;
          const panel = document.createElement('jl-tab-panel');
          panel.setAttribute('name', \`tab-\${count}\`);
          panel.setAttribute('label', \`Query \${count}\`);
          panel.innerHTML = '<p class="muted">An empty query.</p>';
          tabs.append(panel);
          tabs.value.set(\`tab-\${count}\`);
          status.textContent = \`Open: tab-\${count}\`;
        });`,
      setup: (root) => {
        const tabs = root.querySelector<JlTabs>('jl-tabs');
        const status = root.querySelector('.demo-open');
        if (tabs === null || status === null) {
          return;
        }
        tabs.events.register('change', (name) => {
          status.textContent = `Open: ${name}`;
        });
        root.querySelector<JlButton>('.demo-add')?.events.register('press', () => {
          const count = tabs.children.length + 1;
          const panel = document.createElement('jl-tab-panel');
          panel.setAttribute('name', `tab-${count}`);
          panel.setAttribute('label', `Query ${count}`);
          panel.innerHTML = '<p class="muted">An empty query.</p>';
          tabs.append(panel);
          tabs.value.set(`tab-${count}`);
          status.textContent = `Open: tab-${count}`;
        });
      },
      title: 'Panels added later',
    },
  ],
  level: 'molecule',
  name: 'Tabs',
  playground: {
    attributes: { value: 'activity' },
    content: PANELS,
    width: 520,
  },
  props: [
    {
      attribute: 'value',
      control: { kind: 'select', options: ['overview', 'activity', 'settings'] },
      default: "''",
      description: 'The name of the open panel; the first panel that can open when it names none.',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'variant',
      control: { kind: 'select', options: ['line', 'pill'] },
      default: "'line'",
      description: 'An underline under the open tab, or a soft pill behind it.',
      name: 'variant',
      type: "'line' | 'pill'",
    },
    {
      attribute: 'block',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The tabs share the whole width.',
      name: 'block',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The tab list’s name for screen readers, when no heading says what the tabs are about.',
      name: 'label',
      type: 'string',
    },
  ],
  slots: [{ description: 'The jl-tab-panel elements: each makes a tab.', name: '' }],
  styling: [{ description: 'The wrapper of the tab row and the panels.', name: 'base' }],
  summary: 'Tabs over panels of content: one panel shows at a time, the others a click or an arrow key away.',
  tag: 'jl-tabs',
};
