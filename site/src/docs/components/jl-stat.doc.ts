import type { ComponentDoc } from '../../types/docs.types';

const REVENUE = '[31, 34, 33, 38, 36, 41, 44, 43, 48]';
const SIGNUPS = '[120, 132, 128, 141, 150, 147, 162, 170, 168, 181]';
const CHURN = '[3.1, 3.0, 2.8, 2.9, 2.6, 2.5, 2.4]';

export const doc: ComponentDoc = {
  className: 'JlStat',
  description: `A stat shows one key figure: what it measures, its value, how it moved and, if given, a sparkline of
its recent points. It has no frame of its own: put it in a card for a tile, and several cards in a row for a
dashboard.

The delta is coloured by its trend: up in green, down in red, flat in grey. The trend comes from the delta's sign
unless trend says otherwise; invert swaps the colours for figures where down is good, such as costs or errors.`,
  examples: [
    {
      html: `<jl-stat label="Revenue" value="$48,210" delta="+12.5%" caption="vs. last month"></jl-stat>`,
      title: 'A figure',
    },
    {
      description: 'Tiles in cards, side by side: the dashboard row.',
      html: `
        <div class="row" style="align-items: stretch">
          <jl-card style="flex: 1 1 200px">
            <jl-stat label="Revenue" icon="credit-card" value="$48,210" delta="+12.5%" caption="vs. last month" points='${REVENUE}'></jl-stat>
          </jl-card>
          <jl-card style="flex: 1 1 200px">
            <jl-stat label="Sign-ups" icon="users" value="1,204" delta="+8.1%" caption="vs. last month" points='${SIGNUPS}'></jl-stat>
          </jl-card>
          <jl-card style="flex: 1 1 200px">
            <jl-stat label="Churn" icon="log-out" value="2.4%" delta="-0.7 pt" invert caption="vs. last month" points='${CHURN}'></jl-stat>
          </jl-card>
        </div>`,
      title: 'A row of stats',
    },
    {
      description: 'Down in red; invert for figures where down is good; flat in grey.',
      html: `
        <div class="row" style="align-items: flex-start; gap: 40px">
          <jl-stat label="Active users" value="8,912" delta="-3.2%"></jl-stat>
          <jl-stat label="Load time" value="1.2 s" delta="-0.3 s" invert></jl-stat>
          <jl-stat label="Error rate" value="0.8%" delta="+0.2 pt" invert></jl-stat>
          <jl-stat label="Open tickets" value="42" delta="0" ></jl-stat>
        </div>`,
      title: 'Trends',
    },
    {
      description: 'The sparkline alone says the direction, when the exact change matters less.',
      html: `
        <jl-card class="narrow">
          <jl-stat label="Requests per minute" value="3,480" caption="Last 24 hours" points="[12, 18, 15, 22, 30, 26, 34, 41, 38, 46, 44, 52]"></jl-stat>
        </jl-card>`,
      title: 'Sparkline',
    },
  ],
  level: 'molecule',
  name: 'Stat',
  playground: {
    attributes: {
      caption: 'vs. last month',
      delta: '+12.5%',
      icon: 'credit-card',
      label: 'Revenue',
      points: REVENUE,
      value: '$48,210',
    },
    width: 280,
  },
  props: [
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'What the figure measures.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The figure, as people read it: "$48,210", "98.2%".',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'delta',
      control: { kind: 'text' },
      default: "''",
      description: 'How it changed: "+12.5%", "-3". Its sign gives the trend.',
      name: 'delta',
      type: 'string',
    },
    {
      attribute: 'trend',
      control: { kind: 'select', options: ['', 'up', 'down', 'flat'] },
      default: "''",
      description: "Which way it went, when the delta's sign does not say it.",
      name: 'trend',
      type: "'' | 'up' | 'down' | 'flat'",
    },
    {
      attribute: 'invert',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Down is good: down in green, up in red.',
      name: 'invert',
      type: 'boolean',
    },
    {
      attribute: 'icon',
      control: { kind: 'text' },
      default: "''",
      description: 'An icon beside the label.',
      name: 'icon',
      type: 'string',
    },
    {
      attribute: 'caption',
      control: { kind: 'text' },
      default: "''",
      description: 'A note under the figure.',
      name: 'caption',
      type: 'string',
    },
    {
      attribute: 'points',
      control: { kind: 'json' },
      default: '[]',
      description: 'Recent values, oldest first, drawn as a sparkline.',
      name: 'points',
      type: 'number[]',
    },
  ],
  styling: [{ description: 'The stat.', name: 'base' }],
  summary: 'A key figure with its label, its change and a sparkline of recent values.',
  tag: 'jl-stat',
};
