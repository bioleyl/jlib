import type { JlButton, JlLoadState } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const LOAD_MS = 1200;

const ROWS = `
            <jl-list-item heading="Refund request from Léa Dubois" description="Answer support emails" meta="3 days ago"></jl-list-item>
            <jl-list-item heading="Reply to Maria Rossi" description="Answer support emails" meta="3 days ago"></jl-list-item>`;

/** Waits, then answers or fails: the stand-in for a request to a server. */
const after = (milliseconds: number, fails: boolean): Promise<number> =>
  new Promise((resolve, reject) =>
    setTimeout(() => (fails ? reject(new Error('No answer')) : resolve(2)), milliseconds)
  );

export const doc: ComponentDoc = {
  className: 'JlLoadState',
  description: `A load state wraps what a list or a page draws from data that comes over the network. While the data
comes, it shows nothing for 300 milliseconds (a quick answer should not flash), then a skeleton shaped like the
content: rows, cards or lines. Then it shows the content (the default slot), the empty state of slot empty when
there is nothing, or, when loading failed, what failed and Try again, in place of the content.

load() does the work: it fetches, draws, and moves between the states; Try again runs the same load again. A later
load(), such as a live update, keeps what is shown until the new data is there, and keeps it if that load fails:
it resolves false, for the page to say so in a toast. Or set state yourself. See the Loading, empty and errors
pattern.`,
  events: [
    { description: 'Try again was pressed; the last load runs again.', detail: 'undefined', name: 'retry' },
  ],
  examples: [
    {
      description: 'Loads, then shows the rows. "Load again" keeps the rows while it reloads.',
      html: `
        <div class="stack narrow">
          <jl-load-state class="demo-rows">
            <div style="border: 1px solid var(--jl-line); border-radius: var(--jl-radius)">${ROWS}
            </div>
          </jl-load-state>
          <div><jl-button class="demo-reload" icon="refresh" label="Load again"></jl-button></div>
        </div>`,
      script: `
        const state = root.querySelector('.demo-rows');
        const load = () => state.load({ fetch: () => api.reviews(), draw: (reviews) => drawRows(reviews) });
        load();
        root.querySelector('.demo-reload').events.register('press', load);`,
      setup: (root) => {
        const state = root.querySelector<JlLoadState>('.demo-rows');
        const load = (): void => void state?.load({ draw: () => undefined, fetch: () => after(LOAD_MS, false) });
        load();
        root.querySelector<JlButton>('.demo-reload')?.events.register('press', load);
      },
      title: 'Loading, then ready',
    },
    {
      description: 'The request fails: what failed, in place of the list, and Try again (which fails again here).',
      html: `
        <jl-load-state class="demo-fails narrow" error-heading="The reviews could not be loaded"></jl-load-state>`,
      script: `
        root.querySelector('.demo-fails').load({ fetch: () => api.reviews(), draw: drawRows });`,
      setup: (root) => {
        void root
          .querySelector<JlLoadState>('.demo-fails')
          ?.load({ draw: () => undefined, fetch: () => after(LOAD_MS, true) });
      },
      title: 'Failed',
    },
    {
      description: 'Nothing to show: the empty slot, with what would be there and how it gets there.',
      html: `
        <jl-load-state state="empty" class="narrow">
          <jl-empty slot="empty" icon="inbox" heading="You are all caught up" description="New reviews show up here as workflows send them."></jl-empty>
        </jl-load-state>`,
      title: 'Empty',
    },
    {
      description: 'skeleton="cards", for a grid; it stays in the loading state.',
      html: `
        <jl-load-state skeleton="cards" count="3" delay="0"></jl-load-state>`,
      title: 'Cards',
    },
  ],
  level: 'molecule',
  methods: [
    {
      description:
        'Fetches, draws, and shows the right state: the skeleton the first time and after a failure, the content or the empty slot after. Resolves whether it worked.',
      name: 'load',
      signature:
        'load<Value>(task: { fetch(): Promise<Value>; draw(value: Value): void; isEmpty?(value: Value): boolean }): Promise<boolean>',
    },
  ],
  name: 'Load state',
  playground: {
    attributes: {
      count: '3',
      delay: '0',
      'error-heading': 'This could not be loaded',
      skeleton: 'rows',
      state: 'loading',
    },
    content: '<p class="muted" style="padding: 16px">The data, once loaded.</p>',
    width: 440,
  },
  props: [
    {
      attribute: 'state',
      control: { kind: 'select', options: ['loading', 'ready', 'empty', 'error'] },
      default: "'loading'",
      description: 'What it shows: the skeleton, the content, the empty slot, or the error.',
      name: 'state',
      type: "'loading' | 'ready' | 'empty' | 'error'",
    },
    {
      attribute: 'skeleton',
      control: { kind: 'select', options: ['rows', 'cards', 'lines'] },
      default: "'rows'",
      description: 'The shape of the skeleton; slot loading takes one of your own.',
      name: 'skeleton',
      type: "'rows' | 'cards' | 'lines'",
    },
    {
      attribute: 'count',
      control: { kind: 'number', max: 24, min: 1 },
      default: '3',
      description: 'How many rows, cards or lines the skeleton has.',
      name: 'count',
      type: 'number',
    },
    {
      attribute: 'delay',
      control: { kind: 'number', max: 5000, min: 0, step: 100 },
      default: '300',
      description: 'Milliseconds before the skeleton shows.',
      name: 'delay',
      type: 'number',
    },
    {
      attribute: 'error-heading',
      control: { kind: 'text' },
      default: "'This could not be loaded'",
      description: 'What failed: "The orders could not be loaded".',
      name: 'errorHeading',
      type: 'string',
    },
    {
      attribute: 'error-text',
      control: { kind: 'text' },
      default: "'Check the connection, then try again. Nothing was changed.'",
      description: 'The sentence under it.',
      name: 'errorText',
      type: 'string',
    },
    {
      attribute: 'retry-label',
      control: { kind: 'text' },
      default: "'Try again'",
      description: 'The button that loads again.',
      name: 'retryLabel',
      type: 'string',
    },
  ],
  slots: [
    { description: 'The content, once loaded.', name: '' },
    { description: 'What it shows when there is nothing: a jl-empty.', name: 'empty' },
    { description: 'A skeleton of your own, in place of the rows, cards or lines.', name: 'loading' },
  ],
  styling: [{ description: 'The wrapper of every state.', name: 'base' }],
  summary: 'What a list shows while its data comes, when there is none, and when it failed to come.',
  tag: 'jl-load-state',
};
