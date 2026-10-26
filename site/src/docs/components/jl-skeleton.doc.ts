import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlSkeleton',
  description: `Skeletons hold the place of content that is loading, in its shape, so the page does not jump when it
arrives. Use them for loads that take more than a moment; for short waits, a spinner on the button is enough.

Screen readers skip skeletons: set aria-busy="true" on the region they fill, and remove it once the content is in.
With reduced motion, the shimmer stops.`,
  examples: [
    {
      description: 'Lines of text; the last of several is shorter.',
      html: `
        <div class="stack narrow">
          <jl-skeleton></jl-skeleton>
          <jl-skeleton lines="3"></jl-skeleton>
        </div>`,
      title: 'Text',
    },
    {
      description: 'Sizes take any CSS length; a plain number is in pixels.',
      html: `
        <div class="row">
          <jl-skeleton shape="circle" width="24"></jl-skeleton>
          <jl-skeleton shape="circle"></jl-skeleton>
          <jl-skeleton shape="circle" width="56"></jl-skeleton>
          <jl-skeleton shape="rect" width="160" height="90"></jl-skeleton>
          <jl-skeleton shape="rect" width="90" height="90"></jl-skeleton>
        </div>`,
      title: 'Circles and blocks',
    },
    {
      description: 'The shape of a list of people while it loads.',
      html: `
        <div class="stack narrow" aria-busy="true">
          <div class="row">
            <jl-skeleton shape="circle"></jl-skeleton>
            <div class="stack" style="flex: 1; gap: 8px">
              <jl-skeleton width="40%"></jl-skeleton>
              <jl-skeleton width="70%"></jl-skeleton>
            </div>
          </div>
          <div class="row">
            <jl-skeleton shape="circle"></jl-skeleton>
            <div class="stack" style="flex: 1; gap: 8px">
              <jl-skeleton width="55%"></jl-skeleton>
              <jl-skeleton width="80%"></jl-skeleton>
            </div>
          </div>
        </div>`,
      title: 'A list loading',
    },
    {
      description: 'In a card: a picture, a heading and a paragraph.',
      html: `
        <jl-card class="narrow" aria-busy="true">
          <jl-skeleton slot="media" shape="rect" height="120" style="--jl-radius: 0"></jl-skeleton>
          <div class="stack">
            <jl-skeleton width="50%" style="font-size: 20px"></jl-skeleton>
            <jl-skeleton lines="3"></jl-skeleton>
          </div>
        </jl-card>`,
      title: 'A card loading',
    },
  ],
  level: 'atom',
  name: 'Skeleton',
  playground: { attributes: { lines: '3', shape: 'text' }, width: 360 },
  props: [
    {
      attribute: 'shape',
      control: { kind: 'select', options: ['text', 'rect', 'circle'] },
      default: "'text'",
      description: 'Lines of text, a block, or a circle.',
      name: 'shape',
      type: "'text' | 'rect' | 'circle'",
    },
    {
      attribute: 'width',
      control: { kind: 'text' },
      default: "''",
      description: 'A CSS length (a plain number is in pixels). Text and blocks fill the width; a circle is 40px.',
      name: 'width',
      type: 'string',
    },
    {
      attribute: 'height',
      control: { kind: 'text' },
      default: "''",
      description: 'A CSS length. Text lines follow the font size, blocks are 96px, a circle matches its width.',
      name: 'height',
      type: 'string',
    },
    {
      attribute: 'lines',
      control: { kind: 'number', max: 20, min: 1 },
      default: '1',
      description: 'For text: how many lines.',
      name: 'lines',
      type: 'number',
    },
  ],
  styling: [
    { description: 'The box around the lines or the shape.', name: 'base' },
    { description: 'The placeholder colour.', name: '--base' },
    { description: 'The colour of the shimmer that crosses it.', name: '--shine' },
  ],
  summary: 'A shimmering placeholder in the shape of content that is loading.',
  tag: 'jl-skeleton',
};
