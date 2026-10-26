import type { ComboboxOption, JlCombobox } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const CITIES = JSON.stringify([
  { description: 'Switzerland', label: 'Zürich', value: 'zrh' },
  { description: 'Switzerland', label: 'Genève', value: 'gva' },
  { description: 'Switzerland', label: 'Lausanne', value: 'lsn' },
  { description: 'Portugal', label: 'Lisbon', value: 'lis' },
  { description: 'Denmark', label: 'Copenhagen', value: 'cph' },
  { description: 'Japan', label: 'Kyoto', value: 'kyo' },
  { description: 'Canada', label: 'Montréal', value: 'yul' },
  { description: 'New Zealand', label: 'Wellington', value: 'wlg' },
]);

const PLANS = JSON.stringify([
  { description: 'One project, community support', label: 'Hobby', value: 'hobby' },
  { description: 'Unlimited projects, email support', label: 'Pro', value: 'pro' },
  { description: 'Single sign-on, audit logs, a named contact', label: 'Enterprise', value: 'enterprise' },
  { description: 'No longer sold', disabled: true, label: 'Legacy', value: 'legacy' },
]);

const PEOPLE = JSON.stringify([
  { label: 'Ada Lovelace', value: 'ada' },
  { label: 'Grace Hopper', value: 'grace' },
  { label: 'Margaret Hamilton', value: 'margaret' },
]);

const LANGUAGES: ComboboxOption[] = [
  'Bash',
  'C',
  'C#',
  'C++',
  'Clojure',
  'Dart',
  'Elixir',
  'Elm',
  'Erlang',
  'F#',
  'Go',
  'Haskell',
  'Java',
  'JavaScript',
  'Julia',
  'Kotlin',
  'Lua',
  'OCaml',
  'Perl',
  'PHP',
  'Python',
  'R',
  'Ruby',
  'Rust',
  'Scala',
  'Swift',
  'TypeScript',
  'Zig',
].map((name) => ({ label: name, value: name.toLowerCase() }));

// The pretend server of the example answers after this long.
const SEARCH_DELAY_MS = 250;

export const doc: ComponentDoc = {
  className: 'JlCombobox',
  description: `A text field with a list under it: typing narrows the list (case and accents do not matter, and
labels that start with the text come first), the arrows move through it, Enter or a click chooses. The field then
shows the option's label, while value and the form hold its value.

Without allow-custom, leaving the field with text no option has brings the chosen label back; with it, that text
becomes the value. Listen to input to load options from a server as people type, and set them with options.set().`,
  events: [
    {
      description: 'An option was chosen, the free text was taken, or the field was cleared.',
      detail: 'string',
      name: 'change',
    },
    { description: 'Each change of the typed text, to fetch options for it.', detail: 'string', name: 'input' },
  ],
  examples: [
    {
      description: 'Type "ge" or "zu": the matching part is highlighted, accents or not.',
      html: `
        <div class="narrow">
          <jl-combobox label="City" placeholder="Search a city" clearable options='${CITIES}'></jl-combobox>
        </div>`,
      title: 'Search a list',
    },
    {
      description: 'A second line explains each option; a disabled one shows but cannot be chosen.',
      html: `
        <div class="narrow">
          <jl-combobox label="Plan" value="pro" options='${PLANS}'></jl-combobox>
        </div>`,
      title: 'Descriptions and disabled options',
    },
    {
      description: 'With allow-custom, a name nobody has is a value too. The paragraph listens to change.',
      html: `
        <div class="stack narrow">
          <jl-combobox class="demo-assign" label="Assignee" placeholder="Name or email" allow-custom clearable options='${PEOPLE}'></jl-combobox>
          <p class="muted demo-assign-out">Nobody assigned.</p>
        </div>`,
      script: `
        const combobox = root.querySelector('.demo-assign');
        const out = root.querySelector('.demo-assign-out');
        combobox.events.register('change', (value) => {
          out.textContent = value === '' ? 'Nobody assigned.' : \`Assigned to \${value}.\`;
        });`,
      setup: (root) => {
        const combobox = root.querySelector<JlCombobox>('.demo-assign');
        const out = root.querySelector('.demo-assign-out');
        combobox?.events.register('change', (value) => {
          if (out !== null) {
            out.textContent = value === '' ? 'Nobody assigned.' : `Assigned to ${value}.`;
          }
        });
      },
      title: 'Free text',
    },
    {
      description: 'The options come from a pretend server, a moment after each keystroke.',
      html: `
        <div class="narrow">
          <jl-combobox class="demo-remote" label="Language" placeholder="Type a language" empty-text="No language by that name"></jl-combobox>
        </div>`,
      script: `
        // LANGUAGES: [{ value: 'rust', label: 'Rust' }, …]
        const combobox = root.querySelector('.demo-remote');
        combobox.events.register('input', (text) => {
          setTimeout(() => {
            const query = text.toLowerCase();
            combobox.options.set(LANGUAGES.filter((option) => option.value.includes(query)));
          }, 250);
        });`,
      setup: (root) => {
        const combobox = root.querySelector<JlCombobox>('.demo-remote');
        combobox?.events.register('input', (text) => {
          setTimeout(() => {
            const query = text.toLowerCase();
            combobox.options.set(LANGUAGES.filter((option) => option.value.includes(query)));
          }, SEARCH_DELAY_MS);
        });
      },
      title: 'Options from a server',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-combobox size="sm" label="Small" placeholder="Small" options='${CITIES}'></jl-combobox>
          <jl-combobox label="Medium" value="lis" options='${CITIES}'></jl-combobox>
          <jl-combobox size="lg" label="Large" placeholder="Large" options='${CITIES}'></jl-combobox>
          <jl-combobox label="Disabled" value="kyo" disabled options='${CITIES}'></jl-combobox>
          <jl-combobox label="Invalid" placeholder="Nothing chosen" invalid options='${CITIES}'></jl-combobox>
        </div>`,
      title: 'Sizes and states',
    },
  ],
  level: 'molecule',
  methods: [
    { description: 'Focuses the text field.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
    {
      description: 'Whether a required combobox has a value.',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'Combobox',
  playground: {
    attributes: { clearable: true, label: 'City', options: CITIES, placeholder: 'Search a city' },
    height: 360,
  },
  props: [
    {
      attribute: 'options',
      control: { kind: 'json' },
      default: '[]',
      description: 'The choices: value, label, and optionally a description and disabled.',
      name: 'options',
      type: 'ComboboxOption[]',
    },
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: "The chosen option's value; with allow-custom, any text.",
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'placeholder',
      control: { kind: 'text' },
      default: "''",
      description: 'Shown while the field is empty.',
      name: 'placeholder',
      type: 'string',
    },
    {
      attribute: 'allow-custom',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Text no option has as its label becomes the value.',
      name: 'allowCustom',
      type: 'boolean',
    },
    {
      attribute: 'clearable',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'A button empties the field while it holds text.',
      name: 'clearable',
      type: 'boolean',
    },
    {
      attribute: 'empty-text',
      control: { kind: 'text' },
      default: "'No results'",
      description: 'What the list says when no option matches.',
      name: 'emptyText',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The height.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'name',
      default: "''",
      description: "The field's name in the form's data.",
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
      description: 'The form cannot be submitted without a value.',
      name: 'required',
      type: 'boolean',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Cannot be changed or focused.',
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
    { description: 'The frame around the text field.', name: 'base' },
    { description: 'The floating list of options.', name: 'list' },
  ],
  summary: 'A text field with a list of options that narrows as people type.',
  tag: 'jl-combobox',
};
