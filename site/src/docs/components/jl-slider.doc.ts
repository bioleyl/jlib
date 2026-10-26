import type { JlSlider } from 'jlib';
import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlSlider',
  description: `A number picked by dragging, for values where the feel matters more than the digit: a volume, an
opacity, a budget range. When people know the exact number, prefer a number input.

It is the browser's own range input, styled: the arrow keys move it by a step, Page Up and Page Down by more, Home
and End to the ends, and screen readers read its value. The track fills in the accent colour up to the thumb. marks
draws ticks under the track, with labels when you give them.`,
  events: [
    { description: 'Each move while dragging or pressing keys.', detail: 'number', name: 'input' },
    {
      description: 'The value was committed: the drag ended or a key was released.',
      detail: 'number',
      name: 'change',
    },
  ],
  examples: [
    {
      html: `
        <div class="stack narrow">
          <jl-slider label="Volume" value="40" show-value></jl-slider>
          <jl-slider label="Opacity" value="80"></jl-slider>
        </div>`,
      title: 'Basic',
    },
    {
      description: 'A step of 25 with a tick at each stop.',
      html: `
        <div class="narrow">
          <jl-slider label="Zoom" min="0" max="100" step="25" value="50" marks="[0, 25, 50, 75, 100]"></jl-slider>
        </div>`,
      title: 'Steps and ticks',
    },
    {
      html: `
        <div class="narrow">
          <jl-slider
            label="Quality"
            min="1"
            max="3"
            value="2"
            marks='[{"value":1,"label":"Draft"},{"value":2,"label":"Good"},{"value":3,"label":"Best"}]'
          ></jl-slider>
        </div>`,
      title: 'Labelled marks',
    },
    {
      html: `
        <div class="narrow">
          <jl-slider label="Locked" value="30" show-value disabled></jl-slider>
        </div>`,
      title: 'Disabled',
    },
    {
      description: 'input follows the drag, change fires when it ends.',
      html: `
        <div class="stack narrow">
          <jl-slider class="demo-budget" label="Budget" min="0" max="5000" step="100" value="1200"></jl-slider>
          <p class="muted demo-out">Budget: 1200 CHF (saved 1200)</p>
        </div>`,
      script: `
        const slider = root.querySelector('.demo-budget');
        const out = root.querySelector('.demo-out');
        let saved = 1200;
        slider.events.register('input', (value) => {
          out.textContent = \`Budget: \${value} CHF (saved \${saved})\`;
        });
        slider.events.register('change', (value) => {
          saved = value;
          out.textContent = \`Budget: \${value} CHF (saved \${saved})\`;
        });`,
      setup: (root) => {
        const slider = root.querySelector<JlSlider>('.demo-budget');
        const out = root.querySelector('.demo-out');
        const state = { saved: 1200 };
        const write = (value: number): void => {
          if (out !== null) {
            out.textContent = `Budget: ${value} CHF (saved ${state.saved})`;
          }
        };
        slider?.events.register('input', write);
        slider?.events.register('change', (value) => {
          state.saved = value;
          write(value);
        });
      },
      title: 'Listening',
    },
  ],
  level: 'atom',
  methods: [
    { description: 'Focuses the slider.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
  ],
  name: 'Slider',
  playground: {
    attributes: { label: 'Volume', 'show-value': true, value: '40' },
  },
  props: [
    {
      attribute: 'value',
      control: { kind: 'number' },
      default: '0',
      description: 'The number, kept between min and max, on a step.',
      name: 'value',
      type: 'number',
    },
    {
      attribute: 'min',
      control: { kind: 'number' },
      default: '0',
      description: 'The lowest value.',
      name: 'min',
      type: 'number',
    },
    {
      attribute: 'max',
      control: { kind: 'number' },
      default: '100',
      description: 'The highest value.',
      name: 'max',
      type: 'number',
    },
    {
      attribute: 'step',
      control: { kind: 'number', min: 0 },
      default: '1',
      description: 'The gap between two values.',
      name: 'step',
      type: 'number',
    },
    {
      attribute: 'show-value',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shows the number at the end of the track.',
      name: 'showValue',
      type: 'boolean',
    },
    {
      attribute: 'marks',
      control: { kind: 'json' },
      default: '[]',
      description: 'Ticks under the track: numbers, or { value, label } for a tick with a label.',
      name: 'marks',
      type: 'Array<number | SliderMark>',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The accessible name, when no visible label names the slider.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'name',
      default: "''",
      description: "The field's name in the form's data.",
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Cannot be moved or focused.',
      name: 'disabled',
      type: 'boolean',
    },
  ],
  styling: [
    { description: 'The row holding the track and the number.', name: 'base' },
    { description: 'The thumb size (16px).', name: '--thumb' },
    { description: 'The track thickness (4px).', name: '--track' },
    { description: 'The colour of the filled part and the thumb ring.', name: '--fill' },
    { description: 'The colour of the rest of the track.', name: '--rest' },
  ],
  summary: 'A number picked by dragging along a track that fills in the accent colour.',
  tag: 'jl-slider',
};
