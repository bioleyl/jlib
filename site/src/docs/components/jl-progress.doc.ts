import type { JlButton, JlProgress } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const TONE_OPTIONS = ['accent', 'ok', 'warn', 'danger'];

export const doc: ComponentDoc = {
  className: 'JlProgress',
  description: `A progress bar shows how much of a task is done, when the page knows it: an upload, an import, a quota.
Without a value, the bar runs back and forth: the work goes on, its end is unknown.

It is a progressbar for screen readers, named by its label (or "Progress"), with its value as a percentage. Keep the
accent while work runs; use the semantic tones for what a level means, such as a quota nearly full.`,
  examples: [
    {
      html: `
        <div class="stack narrow">
          <jl-progress value="20"></jl-progress>
          <jl-progress value="55"></jl-progress>
          <jl-progress value="100" tone="ok"></jl-progress>
        </div>`,
      title: 'Values',
    },
    {
      description: 'The label above at the start, the percentage at the end.',
      html: `
        <div class="stack narrow">
          <jl-progress label="Uploading report.pdf" value="64" show-value></jl-progress>
          <jl-progress label="Storage" value="9.1" max="10" tone="warn" show-value></jl-progress>
          <jl-progress label="API quota" value="98" tone="danger" show-value></jl-progress>
        </div>`,
      title: 'Label and value',
    },
    {
      description: 'No value: work of unknown length.',
      html: `
        <div class="stack narrow">
          <jl-progress label="Preparing the export"></jl-progress>
          <jl-progress size="sm"></jl-progress>
        </div>`,
      title: 'Indeterminate',
    },
    {
      description: 'sm is 4 pixels high, for a card or a table row; md is 8.',
      html: `
        <div class="stack narrow">
          <jl-progress size="sm" value="40"></jl-progress>
          <jl-progress value="40"></jl-progress>
        </div>`,
      title: 'Sizes',
    },
    {
      description: 'The value set from code as the work advances.',
      html: `
        <div class="stack narrow">
          <jl-progress class="demo-upload" label="Uploading 12 files" value="0" show-value></jl-progress>
          <div class="row"><jl-button class="demo-start" icon="upload" label="Start upload"></jl-button></div>
        </div>`,
      script: `
        const progress = root.querySelector('.demo-upload');
        const start = root.querySelector('.demo-start');
        start.events.register('press', () => {
          progress.value.set(0);
          progress.tone.set('accent');
          const timer = setInterval(() => {
            const next = Math.min(100, (progress.value.get() ?? 0) + 8);
            progress.value.set(next);
            if (next === 100) {
              clearInterval(timer);
              progress.tone.set('ok');
            }
          }, 200);
        });`,
      setup: (root) => {
        const progress = root.querySelector<JlProgress>('.demo-upload');
        const start = root.querySelector<JlButton>('.demo-start');
        start?.events.register('press', () => {
          if (progress === null) {
            return;
          }
          progress.value.set(0);
          progress.tone.set('accent');
          const timer = setInterval(() => {
            const next = Math.min(100, (progress.value.get() ?? 0) + 8);
            progress.value.set(next);
            if (next === 100) {
              clearInterval(timer);
              progress.tone.set('ok');
            }
          }, 200);
        });
      },
      title: 'From code',
    },
  ],
  level: 'atom',
  name: 'Progress',
  playground: { attributes: { label: 'Uploading report.pdf', 'show-value': true, value: '64' } },
  props: [
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: 'null',
      description: 'How much is done, out of max. Without it, the bar is indeterminate.',
      name: 'value',
      type: 'number | null',
    },
    {
      attribute: 'max',
      control: { kind: 'number', min: 1 },
      default: '100',
      description: 'The value of a finished task.',
      name: 'max',
      type: 'number',
    },
    {
      attribute: 'tone',
      control: { kind: 'select', options: TONE_OPTIONS },
      default: "'accent'",
      description: 'The colour of the bar.',
      name: 'tone',
      type: "'accent' | 'ok' | 'warn' | 'danger'",
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['md', 'sm'] },
      default: "'md'",
      description: '8 or 4 pixels high.',
      name: 'size',
      type: "'sm' | 'md'",
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'Above the bar, at the start; also its name for screen readers.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'show-value',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Prints the percentage above the bar, at the end.',
      name: 'showValue',
      type: 'boolean',
    },
  ],
  styling: [
    { description: 'The label, the percentage and the bar.', name: 'base' },
    { description: 'The height of the bar.', name: '--height' },
    { description: 'The colour of the bar, beyond the tones.', name: '--color' },
  ],
  summary: 'A bar that shows how much of a task is done, or that work goes on.',
  tag: 'jl-progress',
};
