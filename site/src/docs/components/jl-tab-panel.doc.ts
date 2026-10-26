import type { ComponentDoc } from '../../types/docs.types';

/** Puts the playground's panel in a jl-tabs beside a second panel, so its tab shows what the controls change. */
function inTabs(panel: HTMLElement): void {
  const tabs = document.createElement('jl-tabs');
  const other = document.createElement('jl-tab-panel');
  other.setAttribute('name', 'other');
  other.setAttribute('label', 'Another panel');
  other.innerHTML = '<p class="muted">The second panel.</p>';
  panel.before(tabs);
  tabs.append(panel, other);
}

export const doc: ComponentDoc = {
  className: 'JlTabPanel',
  description: `A jl-tab-panel only lives inside a jl-tabs: its content is what the tab opens, its attributes are what
the tab shows. Change the label, the icon, the badge or disabled at any time and the tab follows.

The open panel is a tab panel for screen readers, named by its label, and is in the Tab order after the tab row.
Outside of jl-tabs, a panel shows nothing.`,
  examples: [
    {
      description: 'An icon before the label and a count after it.',
      html: `
        <jl-tabs>
          <jl-tab-panel name="inbox" label="Inbox" icon="inbox" badge="8">
            <p class="muted">8 unread messages.</p>
          </jl-tab-panel>
          <jl-tab-panel name="starred" label="Starred" icon="star">
            <p class="muted">Messages you starred.</p>
          </jl-tab-panel>
          <jl-tab-panel name="archive" label="Archive" icon="package" badge="New">
            <p class="muted">Archived messages are kept for a year.</p>
          </jl-tab-panel>
        </jl-tabs>`,
      title: 'Icons and badges',
    },
    {
      description: 'A disabled panel keeps its tab in the row, but it cannot be opened, by click or by keyboard.',
      html: `
        <jl-tabs>
          <jl-tab-panel name="draft" label="Draft"><p class="muted">Write freely.</p></jl-tab-panel>
          <jl-tab-panel name="review" label="Review" disabled><p class="muted">Not yet.</p></jl-tab-panel>
          <jl-tab-panel name="published" label="Published"><p class="muted">Live for everyone.</p></jl-tab-panel>
        </jl-tabs>`,
      title: 'Disabled',
    },
  ],
  level: 'molecule',
  name: 'Tab panel',
  playground: {
    attributes: { badge: '3', icon: 'bell', label: 'Activity', name: 'activity' },
    content: '<p class="muted">Three new comments since your last visit.</p>',
    setup: inTabs,
    width: 480,
  },
  props: [
    {
      attribute: 'name',
      control: { kind: 'text' },
      default: "''",
      description: 'What the tabs’ value names to open this panel; its position in the tabs when empty.',
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The tab’s text, and the panel’s name for screen readers.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "''",
      description: 'An icon name, drawn before the tab’s text.',
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'badge',
      control: { kind: 'text' },
      default: "''",
      description: 'A short count or word after the tab’s text: 3, New.',
      name: 'badge',
      type: 'string',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The tab shows but cannot be opened.',
      name: 'disabled',
      type: 'boolean',
    },
  ],
  slots: [{ description: 'The panel’s content.', name: '' }],
  summary: 'One panel of a jl-tabs: its content, and the label, icon and badge of its tab.',
  tag: 'jl-tab-panel',
};
