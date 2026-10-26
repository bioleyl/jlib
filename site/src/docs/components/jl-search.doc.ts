import type { JlSearch } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

const LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Rust',
  'Go',
  'Kotlin',
  'Swift',
  'Ruby',
  'Elixir',
  'Haskell',
];

const listItems = (query: string): string[] =>
  LANGUAGES.filter((language) => language.toLowerCase().includes(query.trim().toLowerCase()));

export const doc: ComponentDoc = {
  className: 'JlSearch',
  description: `A search field that waits for people to stop typing: search fires once typing pauses for debounce
milliseconds (250 by default), and at once on Enter, so a list filters without a request at every key. input fires
at every key for what must follow the text exactly.

A shortcut such as "/" or "mod+k" focuses the field from anywhere on the page and shows its keys at the end of the
field (mod is ⌘ on a Mac and Ctrl elsewhere). A shortcut without a modifier is ignored while people type in another
field. Escape empties the field; loading shows a spinner in place of the search icon while results come.`,
  events: [
    {
      description: 'Typing paused for debounce milliseconds, Enter was pressed, or the field was cleared.',
      detail: 'string',
      name: 'search',
    },
    { description: 'Each change as people type.', detail: 'string', name: 'input' },
  ],
  examples: [
    {
      description: 'Press ⌘K (Ctrl K elsewhere) anywhere on the page.',
      html: `
        <div class="narrow">
          <jl-search placeholder="Search the docs" shortcut="mod+k"></jl-search>
        </div>`,
      title: 'Shortcut',
    },
    {
      description: 'The list filters once typing pauses; the spinner shows while the search "runs".',
      html: `
        <div class="stack narrow">
          <jl-search class="demo-filter" placeholder="Filter languages" debounce="300"></jl-search>
          <p class="muted demo-results"></p>
        </div>`,
      script: `
        const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Kotlin', 'Swift', 'Ruby', 'Elixir', 'Haskell'];
        const search = root.querySelector('.demo-filter');
        const results = root.querySelector('.demo-results');
        const show = (query) => {
          const found = LANGUAGES.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
          results.textContent = found.length === 0 ? 'No language matches.' : found.join(' · ');
        };
        search.events.register('input', () => search.loading.set(true));
        search.events.register('search', (query) => {
          setTimeout(() => {
            search.loading.set(false);
            show(query);
          }, 300);
        });
        show('');`,
      setup: (root) => {
        const search = root.querySelector<JlSearch>('.demo-filter');
        const results = root.querySelector('.demo-results');
        if (search === null || results === null) {
          return;
        }
        const show = (query: string): void => {
          const found = listItems(query);
          results.textContent = found.length === 0 ? 'No language matches.' : found.join(' · ');
        };
        search.events.register('input', () => search.loading.set(true));
        search.events.register('search', (query) => {
          setTimeout(() => {
            search.loading.set(false);
            show(query);
          }, 300);
        });
        show('');
      },
      title: 'Debounced filter',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-search size="sm" placeholder="Small"></jl-search>
          <jl-search placeholder="Medium" value="Medium, with text"></jl-search>
          <jl-search size="lg" placeholder="Large"></jl-search>
        </div>`,
      title: 'Sizes',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-search placeholder="Searching…" value="invoices 2026" loading></jl-search>
          <jl-search placeholder="Disabled" disabled></jl-search>
        </div>`,
      title: 'Loading and disabled',
    },
  ],
  level: 'molecule',
  methods: [
    { description: 'Focuses the field.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
    { description: 'Selects the whole text.', name: 'select', signature: 'select(): void' },
  ],
  name: 'Search',
  playground: {
    attributes: { placeholder: 'Search projects', shortcut: '/' },
  },
  props: [
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The text.',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'placeholder',
      control: { kind: 'text' },
      default: "''",
      description: 'Shown while empty.',
      name: 'placeholder',
      type: 'string',
    },
    {
      attribute: 'debounce',
      control: { kind: 'number', min: 0, step: 50 },
      default: '250',
      description: 'How long typing must pause, in milliseconds, before search fires.',
      name: 'debounce',
      type: 'number',
    },
    {
      attribute: 'shortcut',
      control: { kind: 'text' },
      default: "''",
      description: 'Keys that focus the field from anywhere: "/", "mod+k", "ctrl+shift+f".',
      name: 'shortcut',
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
      attribute: 'loading',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'A spinner in place of the search icon.',
      name: 'loading',
      type: 'boolean',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Cannot be changed or focused; the shortcut is ignored.',
      name: 'disabled',
      type: 'boolean',
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
      description: 'The accessible name; "Search" when not set.',
      name: 'label',
      type: 'string',
    },
  ],
  styling: [{ description: 'The frame around the field.', name: 'base' }],
  summary: 'A search field that waits for a pause in the typing, with a keyboard shortcut.',
  tag: 'jl-search',
};
