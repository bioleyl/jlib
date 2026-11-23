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

// The pretend server of the example answers after this long; the combobox tells what was typed after this pause.
const SEARCH_DELAY_MS = 400;
const TYPING_PAUSE_MS = 250;

/** What the pretend server also finds a language by: its file extension, which is not in its label. */
const EXTENSIONS: Record<string, string> = {
  js: 'javascript',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  ts: 'typescript',
};

/** The pretend server's answer: the languages whose name holds the text, or whose extension it is. */
function findLanguages(text: string): ComboboxOption[] {
  const query = text.trim().toLowerCase();
  return LANGUAGES.filter((option) => option.value.includes(query) || EXTENSIONS[query] === option.value);
}

/** Asks the pretend server as people type; an answer for a text typed over since is dropped. */
function wireServerSearch(root: HTMLElement): void {
  const combobox = root.querySelector<JlCombobox>('.demo-remote');
  const asked = { last: 0 };
  combobox?.events.register('input', (text) => {
    asked.last += 1;
    const ask = asked.last;
    combobox.loading.set(true);
    setTimeout(() => {
      if (ask !== asked.last) {
        return;
      }
      combobox.options.set(findLanguages(text));
      combobox.loading.set(false);
    }, SEARCH_DELAY_MS);
  });
}

export const doc: ComponentDoc = {
  className: 'JlCombobox',
  description: `A text field with a list under it: typing narrows the list (case and accents do not matter, and
labels that start with the text come first), the arrows move through it, Enter or a click chooses. The field then
shows the option's label, while value and the form hold its value. An Enter that chooses nothing (the list closed,
nothing typed) submits the form, as from a native field.

Without allow-custom, leaving the field with text no option has brings the chosen label back; with it, that text
becomes the value.

Where the server finds the options (among thousands, or by more than their label: without accents, by another
field), filter="none" shows them as the page gives them, whatever was typed. Listen to input, which debounce holds
back until people stop typing, set loading while the answer comes (the open list says so, and the typed text stays),
then set the options and loading back. The page drops an answer for a text typed over since: the combobox shows the
options it was given last. A chosen option keeps its label when the options change.

For several values, as chips in the field, use jl-multi-combobox.`,
  events: [
    {
      description: 'An option was chosen, the free text was taken, or the field was cleared.',
      detail: 'string',
      name: 'change',
    },
    {
      description:
        'The typed text changed, to find options for it: at each keystroke, or once typing pauses for debounce milliseconds.',
      detail: 'string',
      name: 'input',
    },
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
      description:
        'A pretend server finds the languages, by their name or by their file extension: type "js". filter="none" shows what it found, which the combobox would otherwise filter again by the typed text; loading shows while it answers, and debounce asks once typing pauses.',
      html: `
        <div class="narrow">
          <jl-combobox class="demo-remote" label="Language" placeholder="Type a language or an extension"
            filter="none" debounce="${TYPING_PAUSE_MS}" empty-text="No language by that name"></jl-combobox>
        </div>`,
      script: `
        const combobox = root.querySelector<JlCombobox>('.demo-remote');
        const asked = { last: 0 };
        combobox.events.register('input', async (text) => {
          const ask = ++asked.last;
          combobox.loading.set(true);
          const found = await api.languages({ search: text });
          if (ask !== asked.last) {
            return; // an answer for a text typed over since
          }
          combobox.options.set(found.map((language) => ({ value: language.id, label: language.name })));
          combobox.loading.set(false);
        });`,
      setup: wireServerSearch,
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
    {
      description: 'The same check; when it fails, the browser shows its message on the control.',
      name: 'reportValidity',
      signature: 'reportValidity(): boolean',
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
      attribute: 'filter',
      control: { kind: 'select', options: ['local', 'none'] },
      default: "'local'",
      description:
        'Who narrows the options to what was typed: the combobox (local), or the page (none), which hears input and gives the options it found, shown as they are.',
      name: 'filter',
      type: "'local' | 'none'",
    },
    {
      attribute: 'loading',
      control: { kind: 'boolean' },
      default: 'false',
      description:
        'The page is finding options: the open list says so above the options it holds, with aria-busy, and screen readers hear it. An empty answer then shows empty-text.',
      name: 'loading',
      type: 'boolean',
    },
    {
      attribute: 'loading-text',
      control: { kind: 'text' },
      default: "''",
      description: "What the list says while loading. Empty: jlib's own text, in the language shown.",
      name: 'loadingText',
      type: 'string',
    },
    {
      attribute: 'debounce',
      control: { kind: 'number' },
      default: '0',
      description:
        'How long people stop typing, in milliseconds, before input fires; 0 fires it at every keystroke. A choice made before cancels it.',
      name: 'debounce',
      type: 'number',
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
      default: "''",
      description: "What the list says when no option matches. Empty: jlib's own text, in the language shown.",
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
  summary: 'A text field with a list of options that narrows as people type, or that the server finds.',
  tag: 'jl-combobox',
};
