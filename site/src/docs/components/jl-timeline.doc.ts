import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlTimeline',
  description: `A timeline tells what happened, in order: the activity of a project, the steps of a deployment, the
history of an order. Each event has a title, and optionally a time (shown on the right, in muted monospace), a
description and a tone that colours its marker. An icon draws the marker as a circle; without one it is a dot.

Give the events newest first or oldest first, as the page reads best: the timeline keeps the order it is given.
compact tightens it for a side panel.`,
  examples: [
    {
      description: 'Icons in circles, coloured by tone.',
      html: `
        <div class="narrow">
          <jl-timeline label="Deployment of v2.4.0" items='[
            {"title":"Deployed to production","time":"14:32","description":"v2.4.0 is live for every workspace.","tone":"ok","icon":"rocket"},
            {"title":"Checks passed","time":"14:27","description":"312 tests, lint and types.","tone":"ok","icon":"circle-check"},
            {"title":"Merged feat/offline-mode","time":"14:18","description":"Ada merged 14 commits into main.","tone":"accent","icon":"git-merge"},
            {"title":"Review requested","time":"11:05","description":"Ben and Hana were asked to review.","icon":"message"},
            {"title":"Branch created","time":"09:41","icon":"git-branch"}
          ]'></jl-timeline>
        </div>`,
      title: 'Deployment',
    },
    {
      description: 'Dots: the tone says how it went.',
      html: `
        <div class="narrow">
          <jl-timeline label="Order 10482" items='[
            {"title":"Delivered","time":"Mar 6","tone":"ok"},
            {"title":"Delivery attempt failed","time":"Mar 5","description":"Nobody was home; a second attempt is planned.","tone":"warn"},
            {"title":"Shipped","time":"Mar 3","description":"Parcel 3S-88213 left the warehouse."},
            {"title":"Payment received","time":"Mar 2","tone":"info"},
            {"title":"Order placed","time":"Mar 2"}
          ]'></jl-timeline>
        </div>`,
      title: 'Order history',
    },
    {
      description: 'Compact, for a side panel.',
      html: `
        <div style="max-width: 300px">
          <jl-timeline compact label="Activity" items='[
            {"title":"Hana commented","time":"2m","icon":"message","tone":"accent"},
            {"title":"Build failed on fix/login","time":"18m","icon":"circle-x","tone":"danger"},
            {"title":"Ben uploaded 3 files","time":"1h","icon":"upload"},
            {"title":"Chen joined the project","time":"3h","icon":"user","tone":"ok"}
          ]'></jl-timeline>
        </div>`,
      title: 'Compact',
    },
  ],
  level: 'molecule',
  name: 'Timeline',
  playground: {
    attributes: {
      items:
        '[{"title":"Deployed to production","time":"14:32","tone":"ok","icon":"rocket"},{"title":"Checks passed","time":"14:27","description":"312 tests, lint and types.","tone":"ok"},{"title":"Branch created","time":"09:41"}]',
    },
    width: 420,
  },
  props: [
    {
      attribute: 'items',
      control: { kind: 'json' },
      default: '[]',
      description:
        'The events, in the order shown: title, and optionally time, description, tone (neutral, accent, ok, warn, danger, info) and icon.',
      name: 'items',
      type: 'TimelineItem[]',
    },
    {
      attribute: 'compact',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Smaller markers and less space between events.',
      name: 'compact',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The name of the list for screen readers.',
      name: 'label',
      type: 'string',
    },
  ],
  styling: [{ description: 'The list of events.', name: 'base' }],
  summary: 'What happened, in order, along a vertical line with markers coloured by tone.',
  tag: 'jl-timeline',
};
