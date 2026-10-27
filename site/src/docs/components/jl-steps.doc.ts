import type { JlButton, JlSteps } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const CHECKOUT =
  '[{"label":"Cart","description":"3 items"},{"label":"Shipping","description":"Address and speed"},{"label":"Payment","description":"Card or invoice"},{"label":"Review"}]';

const ONBOARDING =
  '[{"label":"Create your account","description":"Email and password"},{"label":"Invite your team","description":"Or do it later from Settings"},{"label":"Connect a repository","description":"GitHub, GitLab or Bitbucket"},{"label":"Deploy","description":"Your first preview in a minute"}]';

export const doc: ComponentDoc = {
  className: 'JlSteps',
  description: `The steps of a process and where people are in it. Each item is { label, description? }; current is
the index of the step people are on, from 0. Steps before it are done and show a check, the current one is in the
accent colour, the rest wait. current equal to the number of steps marks them all done.

clickable turns done steps into buttons: people go back to one, and change fires with its index. Narrower than 560
pixels, horizontal steps keep their markers and the current step's text.`,
  events: [
    { description: 'People went back to a done step; the detail is its index.', detail: 'number', name: 'change' },
  ],
  examples: [
    {
      description: 'A step that failed: the process stopped there, and says so.',
      html: `
        <jl-steps current="3" items='[{"label":"Received","description":"10:42:01"},{"label":"Planned","description":"10:42:03"},{"label":"Rolled back","description":"The package was refused","failed":true}]'></jl-steps>`,
      title: 'A failed step',
    },
    {
      html: `<jl-steps current="2" items='${CHECKOUT}'></jl-steps>`,
      title: 'Horizontal',
    },
    {
      html: `<jl-steps orientation="vertical" current="1" items='${ONBOARDING}' class="narrow"></jl-steps>`,
      title: 'Vertical',
    },
    {
      description: 'Done steps are buttons that go back; the buttons below move forward.',
      html: `
        <div class="stack">
          <jl-steps class="demo-steps" clickable current="2" items='${CHECKOUT}'></jl-steps>
          <div class="row">
            <jl-button class="demo-back" icon="arrow-left" label="Back"></jl-button>
            <jl-button class="demo-next" variant="primary" icon-end="arrow-right" label="Continue"></jl-button>
          </div>
        </div>`,
      script: `
        const steps = root.querySelector('jl-steps');
        const move = (by) => steps.current.set((current) => Math.min(Math.max(current + by, 0), 4));
        root.querySelector('.demo-back').events.register('press', () => move(-1));
        root.querySelector('.demo-next').events.register('press', () => move(1));`,
      setup: (root) => {
        const steps = root.querySelector<JlSteps>('.demo-steps');
        if (steps === null) {
          return;
        }
        const move = (by: number): void => steps.current.set((current) => Math.min(Math.max(current + by, 0), 4));
        root.querySelector<JlButton>('.demo-back')?.events.register('press', () => move(-1));
        root.querySelector<JlButton>('.demo-next')?.events.register('press', () => move(1));
      },
      title: 'Going back to a done step',
    },
    {
      html: `<jl-steps current="4" items='[{"label":"Upload"},{"label":"Check"},{"label":"Publish"},{"label":"Share"}]'></jl-steps>`,
      title: 'All done',
    },
  ],
  level: 'molecule',
  name: 'Steps',
  playground: {
    attributes: { current: '1', items: CHECKOUT },
    width: 'full',
  },
  props: [
    {
      attribute: 'items',
      control: { kind: 'json' },
      default: '[]',
      description:
        'The steps, in order: { label, description?, failed? }. A failed step (a payment refused, a transaction rolled back) shows an × in the danger colour.',
      name: 'items',
      type: 'StepItem[]',
    },
    {
      attribute: 'current',
      control: { kind: 'number', max: 10, min: 0 },
      default: '0',
      description: 'The index of the current step, from 0; the number of steps when all are done.',
      name: 'current',
      type: 'number',
    },
    {
      attribute: 'orientation',
      control: { kind: 'select', options: ['horizontal', 'vertical'] },
      default: "'horizontal'",
      description: 'In a row, or in a column with the descriptions beside the markers.',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
    },
    {
      attribute: 'clickable',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Done steps become buttons that go back to them.',
      name: 'clickable',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "'Progress'",
      description: 'The list’s name for screen readers.',
      name: 'label',
      type: 'string',
    },
  ],
  styling: [
    { description: 'The ordered list of steps.', name: 'base' },
    { description: 'The size of the round markers (28px).', name: '--marker' },
  ],
  summary: 'The steps of a process and where people are: done, current, and still to come.',
  tag: 'jl-steps',
};
