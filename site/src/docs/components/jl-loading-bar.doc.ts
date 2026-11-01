import type { JlButton, JlLoadingBar } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const SLOW_MS = 2500;
const QUICK_MS = 100;

/** Makes the example's button set the bar active for a while. */
function waitOnPress(root: HTMLElement, buttonSelector: string, milliseconds: number): void {
  const bar = root.querySelector<JlLoadingBar>('jl-loading-bar');
  root.querySelector<JlButton>(buttonSelector)?.events.register('press', () => {
    bar?.active.set(true);
    setTimeout(() => bar?.active.set(false), milliseconds);
  });
}

export const doc: ComponentDoc = {
  className: 'JlLoadingBar',
  description: `A loading bar says that something is on its way, without saying how far it has come: the next page, a
report being made. It shows nothing for a moment, so a quick wait shows nothing at all; then it grows from the start,
fast then slower, and never reaches the end while the wait lasts. When the wait ends, it runs to the end and fades.

It sits at the top of what it is loading. jl-page-outlet draws one over the page while the next one loads; use one
alone for the other waits that replace what is shown. With reduced motion, it shows still.`,
  examples: [
    {
      description: 'A wait of 2.5 seconds, then a quick one: the quick one shows nothing.',
      html: `
        <div class="stack narrow">
          <jl-card heading="Monthly report">
            <jl-loading-bar slot="media"></jl-loading-bar>
            <p class="muted">Sales by region, refreshed on demand.</p>
          </jl-card>
          <div class="row">
            <jl-button class="slow" label="Refresh (2.5 s)"></jl-button>
            <jl-button class="quick" label="Refresh (0.1 s)"></jl-button>
          </div>
        </div>`,
      script: `
        const bar = root.querySelector('jl-loading-bar');
        root.querySelector('.slow').events.register('press', async () => {
          bar.active.set(true);
          await refresh();
          bar.active.set(false);
        });`,
      setup: (root) => {
        waitOnPress(root, '.slow', SLOW_MS);
        waitOnPress(root, '.quick', QUICK_MS);
      },
      title: 'A wait',
    },
    {
      description: 'Its colour and its height are custom properties.',
      html: `
        <div class="stack narrow">
          <jl-loading-bar active delay="0" style="--color: var(--jl-ok)"></jl-loading-bar>
          <jl-loading-bar active delay="0" style="--height: 6px"></jl-loading-bar>
        </div>`,
      title: 'Colour and height',
    },
  ],
  level: 'atom',
  name: 'Loading bar',
  playground: { attributes: { active: true } },
  props: [
    {
      attribute: 'active',
      control: { kind: 'boolean' },
      default: 'false',
      description:
        'Whether something is on its way: the line shows after delay, and finishes when it turns false.',
      name: 'active',
      type: 'boolean',
    },
    {
      attribute: 'delay',
      control: { kind: 'number', max: 5000, min: 0, step: 50 },
      default: '150',
      description: 'Milliseconds before the line shows.',
      name: 'delay',
      type: 'number',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: "What screen readers hear while the line shows; jlib's own (Loading) when empty.",
      name: 'label',
      type: 'string',
    },
  ],
  styling: [
    { description: 'The track, a progress bar for screen readers.', name: 'base' },
    { description: 'The colour of the line.', name: '--color' },
    { description: 'The height of the line.', name: '--height' },
  ],
  summary: 'A thin line that says something is on its way: nothing for a moment, then growing, never at the end.',
  tag: 'jl-loading-bar',
};
