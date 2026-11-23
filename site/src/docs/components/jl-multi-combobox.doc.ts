import type { ComboboxOption, JlMultiCombobox } from '@syware/jlib';
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

/** Subject terms of an archive, with the other names the pretend server also finds them by. */
const TERMS: (ComboboxOption & { also: string })[] = [
  { also: 'bridge viaduct', label: 'Ponts', value: 'ponts' },
  { also: 'railway train', label: 'Chemins de fer', value: 'rail' },
  { also: 'school education', label: 'Écoles', value: 'ecoles' },
  { also: 'flood water', label: 'Inondations', value: 'inondations' },
  { also: 'church chapel', label: 'Églises', value: 'eglises' },
  { also: 'vineyard wine', label: 'Vignobles', value: 'vignobles' },
  { also: 'post mail', label: 'Postes', value: 'postes' },
  { also: 'mountain alp', label: 'Alpages', value: 'alpages' },
];

const DIACRITICS = /\p{Diacritic}/gu;

/** A text as the pretend server compares it: lower case, without accents. */
const folded = (text: string): string => text.normalize('NFD').replace(DIACRITICS, '').toLowerCase();

// The pretend server answers after this long; the field tells what was typed after this pause.
const SEARCH_DELAY_MS = 400;
const TYPING_PAUSE_MS = 250;

/** The pretend server's answer: the terms whose name or other names hold the text, accents or not. */
function findTerms(text: string): ComboboxOption[] {
  const query = folded(text.trim());
  return TERMS.filter((term) => folded(`${term.label} ${term.also}`).includes(query)).map(({ label, value }) => ({
    label,
    value,
  }));
}

/** Asks the pretend server as people type; an answer for a text typed over since is dropped. */
function wireTerms(root: HTMLElement): void {
  const terms = root.querySelector<JlMultiCombobox>('.demo-terms');
  const asked = { last: 0 };
  terms?.events.register('input', (text) => {
    asked.last += 1;
    const ask = asked.last;
    terms.loading.set(true);
    setTimeout(() => {
      if (ask !== asked.last) {
        return;
      }
      terms.options.set(findTerms(text));
      terms.loading.set(false);
    }, SEARCH_DELAY_MS);
  });
}

/** The cities chosen, said under the field. */
function wireCities(root: HTMLElement): void {
  const cities = root.querySelector<JlMultiCombobox>('.demo-cities');
  const out = root.querySelector('.demo-cities-out');
  cities?.events.register('change', (values) => {
    if (out !== null) {
      out.textContent = values.length === 0 ? 'No city chosen.' : `Chosen: ${values.join(', ')}`;
    }
  });
}

export const doc: ComponentDoc = {
  className: 'JlMultiCombobox',
  description: `A combobox that holds several values, shown as chips in the field: value and change are lists of
values. Typing narrows the list as jl-combobox's does; choosing an option adds it and keeps the list open for the next
one, and choosing it again takes it out, as do its chip's × and Backspace in the empty field. The form gets each
value under the field's name, as boxes of one name would.

Where the server finds the options, filter="none" shows them as the page gives them: listen to input, which debounce
holds back until people stop typing, and set loading while the answer comes. A value keeps its label when the options
change. For texts people write rather than choose, use jl-tag-input.`,
  events: [
    {
      description: 'An option was added or taken out, or the field was cleared: the values held.',
      detail: 'string[]',
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
      description:
        'A choice adds a chip and keeps the list open; choosing it again or its × takes it out, Backspace in the empty field takes the last.',
      html: `
        <div class="stack narrow">
          <jl-multi-combobox class="demo-cities" label="Cities" placeholder="Add a city" clearable
            value='["zrh","lis"]' options='${CITIES}'></jl-multi-combobox>
          <p class="muted demo-cities-out" aria-live="polite">Chosen: zrh, lis</p>
        </div>`,
      script: `
        const cities = root.querySelector<JlMultiCombobox>('.demo-cities');
        cities.events.register('change', (values) => {
          out.textContent = values.length === 0 ? 'No city chosen.' : \`Chosen: \${values.join(', ')}\`;
        });`,
      setup: wireCities,
      title: 'Several cities',
    },
    {
      description:
        'A pretend server finds the terms by their name or by other names, accents or not: type "bridge" or "ecole". filter="none" shows what it found, loading shows while it answers, and debounce asks once typing pauses.',
      html: `
        <div class="narrow">
          <jl-multi-combobox class="demo-terms" label="Subjects" placeholder="Search a subject"
            filter="none" debounce="${TYPING_PAUSE_MS}" empty-text="No subject by that name"></jl-multi-combobox>
        </div>`,
      script: `
        const terms = root.querySelector<JlMultiCombobox>('.demo-terms');
        const asked = { last: 0 };
        terms.events.register('input', async (text) => {
          const ask = ++asked.last;
          terms.loading.set(true);
          const found = await api.terms({ search: text });
          if (ask !== asked.last) {
            return; // an answer for a text typed over since
          }
          terms.options.set(found.map((term) => ({ value: term.id, label: term.name })));
          terms.loading.set(false);
        });`,
      setup: wireTerms,
      title: 'Terms the server finds',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-multi-combobox size="sm" label="Small" placeholder="Small" options='${CITIES}'></jl-multi-combobox>
          <jl-multi-combobox size="lg" label="Large" value='["kyo"]' options='${CITIES}'></jl-multi-combobox>
          <jl-multi-combobox label="Disabled" value='["kyo","lis"]' disabled options='${CITIES}'></jl-multi-combobox>
          <jl-multi-combobox label="Invalid" placeholder="Nothing chosen" invalid options='${CITIES}'></jl-multi-combobox>
        </div>`,
      title: 'Sizes and states',
    },
  ],
  level: 'molecule',
  methods: [
    { description: 'Focuses the text field.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
    {
      description: 'Whether a required multi-combobox holds a value.',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
    {
      description: 'The same check; when it fails, the browser shows its message on the control.',
      name: 'reportValidity',
      signature: 'reportValidity(): boolean',
    },
  ],
  name: 'Multi-combobox',
  playground: {
    attributes: { clearable: true, label: 'Cities', options: CITIES, placeholder: 'Add a city', value: '["zrh"]' },
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
      control: { kind: 'json' },
      default: '[]',
      description: 'The values held, in the order they were chosen. In HTML, a JSON list, or one value.',
      name: 'value',
      type: 'string[]',
    },
    {
      attribute: 'placeholder',
      control: { kind: 'text' },
      default: "''",
      description: 'Shown while no value is held: chips take its place.',
      name: 'placeholder',
      type: 'string',
    },
    {
      attribute: 'filter',
      control: { kind: 'select', options: ['local', 'none'] },
      default: "'local'",
      description:
        'Who narrows the options to what was typed: the multi-combobox (local), or the page (none), which hears input and gives the options it found, shown as they are.',
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
      attribute: 'allow-custom',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Typed text no option has as its label is added as a value of its own, on Enter or on leaving.',
      name: 'allowCustom',
      type: 'boolean',
    },
    {
      attribute: 'clearable',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'A button empties the field, every value with it.',
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
      description: 'The height of a line.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'name',
      default: "''",
      description: "The field's name in the form's data: each value is an entry of that name.",
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
      description: 'Cannot be changed or focused; the chips stay, without their ×.',
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
    { description: 'The floating list of options.', name: 'list' },
  ],
  summary: 'A combobox that holds several values as chips, from a list or from what the server finds.',
  tag: 'jl-multi-combobox',
};
