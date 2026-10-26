import type { JlTagInput } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

const SKILLS = JSON.stringify([
  'Accessibility',
  'Animation',
  'Back end',
  'Data visualisation',
  'Design systems',
  'DevOps',
  'Front end',
  'Illustration',
  'Research',
  'Security',
  'Testing',
  'Typography',
  'Writing',
]);

export const doc: ComponentDoc = {
  className: 'JlTagInput',
  description: `A field that collects short texts as chips: topics, labels, skills, email addresses. Enter or a comma
adds what was typed, and so does leaving the field; Backspace in the empty field takes the last chip back, and a
pasted list ("design, research, writing" or one per line) adds each of its items. The same tag twice, whatever its
case, is not added: the chip already there flashes instead.

From the field, Left (at the start of the text) reaches the chips' remove buttons; Left and Right move between
them, Backspace or Delete removes one. With suggestions, a short list offers the matching ones while people type.
In a form, each tag is its own entry under the field's name, like checkboxes sharing a name.`,
  events: [{ description: 'A tag was added or removed.', detail: 'string[]', name: 'change' }],
  examples: [
    {
      description: 'Type a word and press Enter or a comma, or paste a list.',
      html: `
        <div class="narrow">
          <jl-tag-input label="Topics" placeholder="Add a topic" value='["web components","design tokens"]'></jl-tag-input>
        </div>`,
      title: 'Typing and pasting',
    },
    {
      description: 'Type "de": the matching suggestions show; the arrows and Enter, or a click, take one.',
      html: `
        <div class="narrow">
          <jl-tag-input label="Skills" placeholder="Add a skill" suggestions='${SKILLS}'></jl-tag-input>
        </div>`,
      title: 'Suggestions',
    },
    {
      description: 'Three labels at most: past that, what is typed stays in the field.',
      html: `
        <div class="narrow">
          <jl-tag-input label="Labels" max="3" value='["bug","needs review"]' placeholder="Up to three labels"></jl-tag-input>
        </div>`,
      title: 'A maximum',
    },
    {
      description: 'The form gets each tag under the name "to", as several fields of one name.',
      html: `
        <form class="stack narrow demo-invite">
          <jl-tag-input name="to" label="Invite" placeholder="Email addresses" required value='["ada@example.com"]'></jl-tag-input>
          <div class="row">
            <jl-button type="submit" variant="primary" label="Send invitations"></jl-button>
          </div>
          <p class="muted demo-invite-out">Submit to see the form data.</p>
        </form>`,
      script: `
        const form = root.querySelector('.demo-invite');
        const out = root.querySelector('.demo-invite-out');
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          out.textContent = \`to = \${JSON.stringify(new FormData(form).getAll('to'))}\`;
        });`,
      setup: (root) => {
        const form = root.querySelector<HTMLFormElement>('.demo-invite');
        const out = root.querySelector('.demo-invite-out');
        form?.addEventListener('submit', (event) => {
          event.preventDefault();
          if (out !== null) {
            out.textContent = `to = ${JSON.stringify(new FormData(form).getAll('to'))}`;
          }
        });
      },
      title: 'In a form',
    },
    {
      description: 'The paragraph listens to change.',
      html: `
        <div class="stack narrow">
          <jl-tag-input class="demo-count" label="Keywords" placeholder="Add keywords" size="sm"></jl-tag-input>
          <jl-tag-input label="Large" size="lg" value='["large"]'></jl-tag-input>
          <jl-tag-input label="Disabled" disabled value='["locked","read only"]'></jl-tag-input>
          <p class="muted demo-count-out">No keyword yet.</p>
        </div>`,
      script: `
        const input = root.querySelector('.demo-count');
        const out = root.querySelector('.demo-count-out');
        input.events.register('change', (tags) => {
          out.textContent = \`\${tags.length} keyword(s): \${tags.join(', ')}\`;
        });`,
      setup: (root) => {
        const input = root.querySelector<JlTagInput>('.demo-count');
        const out = root.querySelector('.demo-count-out');
        input?.events.register('change', (tags) => {
          if (out !== null) {
            out.textContent = `${tags.length} keyword(s): ${tags.join(', ')}`;
          }
        });
      },
      title: 'Sizes, states and listening',
    },
  ],
  level: 'molecule',
  methods: [
    { description: 'Focuses the text field.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
    {
      description: 'Whether a required field has a tag.',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'Tag input',
  playground: {
    attributes: {
      label: 'Skills',
      placeholder: 'Add a skill',
      suggestions: SKILLS,
      value: '["Design systems","Front end"]',
    },
    height: 300,
  },
  props: [
    {
      attribute: 'value',
      control: { kind: 'json' },
      default: '[]',
      description: 'The tags, in order.',
      name: 'value',
      type: 'string[]',
    },
    {
      attribute: 'placeholder',
      control: { kind: 'text' },
      default: "''",
      description: 'Shown while there is no tag.',
      name: 'placeholder',
      type: 'string',
    },
    {
      attribute: 'suggestions',
      control: { kind: 'json' },
      default: '[]',
      description: 'Tags offered in a list while people type.',
      name: 'suggestions',
      type: 'string[]',
    },
    {
      attribute: 'max',
      control: { kind: 'number', min: 0 },
      default: '0',
      description: 'The most tags it takes; 0 for no limit.',
      name: 'max',
      type: 'number',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The height of a line of chips.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'name',
      default: "''",
      description: "The field's name in the form's data: each tag is an entry under it.",
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'label',
      default: "''",
      description: 'The accessible name, when no visible label names the field.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'required',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The form cannot be submitted without a tag.',
      name: 'required',
      type: 'boolean',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The chips show, but nothing can be added or removed.',
      name: 'disabled',
      type: 'boolean',
    },
    {
      attribute: 'invalid',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Drawn in the danger colour, for an error the page found.',
      name: 'invalid',
      type: 'boolean',
    },
  ],
  styling: [
    { description: 'The frame around the chips and the text field.', name: 'base' },
    { description: 'The floating list of suggestions.', name: 'list' },
  ],
  summary: 'A field that collects short texts as removable chips.',
  tag: 'jl-tag-input',
};
