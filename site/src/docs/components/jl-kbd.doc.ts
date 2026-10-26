import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlKbd',
  description: `Write a shortcut once and let each platform read it its way: "mod" is ⌘ on Apple systems and Ctrl
elsewhere, and modifiers turn into symbols on a Mac (⌘ ⇧ ⌥ ⌃). Keys are joined by "+" and each gets its own keycap.

Screen readers hear the keys by name ("Command+Shift+K"), not the symbols. Without keys, the element's own text is
one keycap.`,
  examples: [
    {
      description: 'The same attribute draws ⌘ on a Mac and Ctrl on Windows and Linux.',
      html: `
        <div class="stack">
          <div class="row"><jl-kbd keys="mod+k"></jl-kbd> <span class="muted">Open the command palette</span></div>
          <div class="row"><jl-kbd keys="mod+shift+p"></jl-kbd> <span class="muted">Show every command</span></div>
          <div class="row"><jl-kbd keys="alt+up"></jl-kbd> <span class="muted">Move the line up</span></div>
          <div class="row"><jl-kbd keys="mod+enter"></jl-kbd> <span class="muted">Send</span></div>
        </div>`,
      title: 'Shortcuts',
    },
    {
      description: 'Without keys, the text is one keycap.',
      html: `
        <div class="row">
          <jl-kbd>Esc</jl-kbd>
          <jl-kbd>Tab</jl-kbd>
          <jl-kbd>/</jl-kbd>
          <jl-kbd>?</jl-kbd>
        </div>`,
      title: 'Single keys',
    },
    {
      description: 'Keycaps sit on the line of the text around them.',
      html: `
        <p>Press <jl-kbd keys="mod+k"></jl-kbd> to search, <jl-kbd keys="up"></jl-kbd> <jl-kbd keys="down"></jl-kbd>
        to move through the results and <jl-kbd keys="enter"></jl-kbd> to open one.</p>`,
      title: 'In text',
    },
  ],
  level: 'atom',
  name: 'Kbd',
  playground: { attributes: { keys: 'mod+shift+k' } },
  props: [
    {
      attribute: 'keys',
      control: { kind: 'text' },
      default: "''",
      description:
        'Keys joined by "+": mod, ctrl, alt (option), shift, cmd (meta), named keys (enter, esc, tab, space, backspace, delete, up, down, left, right…) and characters.',
      name: 'keys',
      type: 'string',
    },
  ],
  slots: [{ description: 'One key, when there are no keys: <jl-kbd>Esc</jl-kbd>.', name: '' }],
  styling: [{ description: 'The <kbd> around the keycaps.', name: 'base' }],
  summary: 'A keyboard shortcut, one keycap per key, written the way the platform does.',
  tag: 'jl-kbd',
};
