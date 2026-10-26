import type { JlMenu } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

const FILE_ACTIONS = JSON.stringify([
  { icon: 'pencil', label: 'Rename', shortcut: 'F2', value: 'rename' },
  { icon: 'copy', label: 'Duplicate', shortcut: '⌘D', value: 'duplicate' },
  { icon: 'download', label: 'Download', value: 'download' },
  { icon: 'share', label: 'Share', value: 'share' },
  { divider: true },
  { danger: true, icon: 'trash', label: 'Delete', shortcut: '⌫', value: 'delete' },
]);

const ACCOUNT = JSON.stringify([
  { heading: 'Account' },
  { icon: 'user', label: 'Profile', value: 'profile' },
  { icon: 'settings', label: 'Settings', value: 'settings' },
  { description: 'Upgrade to share with your whole team', icon: 'sparkles', label: 'Plans', value: 'plans' },
  { divider: true },
  { heading: 'Workspace' },
  { icon: 'users', label: 'Members', value: 'members' },
  { disabled: true, icon: 'credit-card', label: 'Billing', value: 'billing' },
  { divider: true },
  { icon: 'log-out', label: 'Sign out', value: 'sign-out' },
]);

export const doc: ComponentDoc = {
  className: 'JlMenu',
  description: `A list of actions that opens from its trigger: put any button in slot="trigger". It opens on a press,
or with ArrowDown (ArrowUp starts from the end), and the focus goes to the first item.

In the menu, the arrows move, Home and End jump to the ends, a letter jumps to the next item that starts with it, and
Enter or Space chooses. Choosing closes the menu, sends the focus back to the trigger and fires select with the item's
value; Escape closes it the same way, Tab closes it and moves on. Items are { value, label, icon?, shortcut?,
description?, danger?, disabled? }, with { divider: true } for a line and { heading } for a title over the items that
follow it.`,
  events: [
    { description: 'People chose an item; the detail is its value.', detail: 'string', name: 'select' },
    { description: 'The menu opened.', detail: 'undefined', name: 'open' },
    { description: 'The menu closed.', detail: 'undefined', name: 'close' },
  ],
  examples: [
    {
      description: 'An ellipsis button with the actions of a row, the destructive one last and in red.',
      html: `
        <div class="row">
          <span>quarterly-report.pdf</span>
          <jl-menu class="demo-file" label="File actions" placement="bottom-end" items='${FILE_ACTIONS}'>
            <jl-button slot="trigger" variant="ghost" icon="ellipsis" hint="More actions"></jl-button>
          </jl-menu>
          <span class="muted demo-chosen">Choose an action</span>
        </div>`,
      script: `
        const chosen = root.querySelector('.demo-chosen');
        root.querySelector('jl-menu').events.register('select', (value) => {
          chosen.textContent = \`Chose: \${value}\`;
        });`,
      setup: (root) => {
        const chosen = root.querySelector('.demo-chosen');
        root.querySelector<JlMenu>('.demo-file')?.events.register('select', (value) => {
          if (chosen !== null) {
            chosen.textContent = `Chose: ${value}`;
          }
        });
      },
      title: 'Row actions',
    },
    {
      description: 'Headings over groups of items, a description under an item, and a disabled item.',
      html: `
        <jl-menu items='${ACCOUNT}'>
          <jl-button slot="trigger" icon="user" icon-end="chevron-down" label="Ada Lovelace"></jl-button>
        </jl-menu>`,
      title: 'Groups and descriptions',
    },
    {
      description: 'The trigger can be any button, here a native one.',
      html: `
        <jl-menu items='[{"value":"newest","label":"Newest first"},{"value":"oldest","label":"Oldest first"},{"value":"popular","label":"Most popular"}]'>
          <button slot="trigger" type="button">Sort by</button>
        </jl-menu>`,
      title: 'Any trigger',
    },
  ],
  level: 'molecule',
  methods: [
    { description: 'Opens the menu and focuses its first item.', name: 'show', signature: 'show(): void' },
    { description: 'Closes the menu.', name: 'hide', signature: 'hide(): void' },
  ],
  name: 'Menu',
  playground: {
    attributes: { items: FILE_ACTIONS, placement: 'bottom-start' },
    content: '<jl-button slot="trigger" icon-end="chevron-down" label="Actions"></jl-button>',
    height: 320,
  },
  props: [
    {
      attribute: 'items',
      control: { kind: 'json' },
      default: '[]',
      description:
        'The items: { value, label, icon?, shortcut?, description?, danger?, disabled? }, { divider: true } or { heading }.',
      name: 'items',
      type: 'MenuItem[]',
    },
    {
      attribute: 'placement',
      control: {
        kind: 'select',
        options: ['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end', 'left', 'right'],
      },
      default: "'bottom-start'",
      description: 'The side of the trigger the menu goes on, and where along it.',
      name: 'placement',
      type: 'Placement',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The menu’s name for screen readers; the trigger names it otherwise.',
      name: 'label',
      type: 'string',
    },
  ],
  slots: [{ description: 'The button that opens the menu.', name: 'trigger' }],
  styling: [{ description: 'The floating list of items.', name: 'base' }],
  summary: 'A list of actions that opens from a button, driven by the pointer or entirely by the keyboard.',
  tag: 'jl-menu',
};
