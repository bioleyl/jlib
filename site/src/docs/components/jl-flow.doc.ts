import { dedent } from '@syware/jlib/lib/text';

import { constSnippet } from '../../lib/snippets';

import type { FlowAddRequest, FlowEdge, FlowGraph, FlowNode, JlButton, JlCodeBlock, JlFlow } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

// The examples' data is shown in their code as it is here: these helpers keep id, label and position first.
const node = (id: string, label: string, x: number, y: number, more: Partial<FlowNode> = {}): FlowNode => ({
  id,
  label,
  position: { x, y },
  ...more,
});

const edge = (id: string, from: string, to: string, port?: string): FlowEdge => ({
  id,
  ...(port === undefined ? { from, to } : { from, port, to }),
});

/** An example's code: its blocks, each written indented in this file, one after the other. */
const code = (...blocks: string[]): string => blocks.map((block) => dedent(block)).join('\n\n');

/** An expense claim: checked, approved by a manager when it is large, then paid or refused. */
const EXPENSES: FlowGraph = {
  edges: [
    edge('e1', 'sent', 'check'),
    edge('e2', 'check', 'approve', 'yes'),
    edge('e3', 'check', 'pay', 'no'),
    edge('e4', 'approve', 'tell', 'refused'),
    edge('e5', 'approve', 'pay', 'approved'),
  ],
  nodes: [
    node('sent', 'Expense sent', 0, 0, { description: 'Form', icon: 'inbox', start: true }),
    node('check', 'Over 500?', 0, 136, {
      description: 'Condition',
      icon: 'git-branch',
      ports: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ],
      tone: 'warn',
    }),
    node('approve', 'Ask the manager', -160, 272, {
      description: 'Approval',
      icon: 'user',
      ports: [
        { id: 'refused', label: 'Refused', tone: 'danger' },
        { id: 'approved', label: 'Approved', tone: 'ok' },
      ],
      tone: 'info',
    }),
    node('tell', 'Tell the employee', -320, 408, { description: 'Email', icon: 'mail', ports: [] }),
    node('pay', 'Pay it back', 160, 408, { description: 'Payment', icon: 'credit-card', tone: 'ok' }),
  ],
};

/** A payment with three outcomes, one of which loops back to the check. */
const PAYMENT: FlowGraph = {
  edges: [
    edge('e1', 'order', 'check'),
    edge('e2', 'check', 'ship', 'paid'),
    edge('e3', 'check', 'cancel', 'failed'),
    edge('e4', 'check', 'wait', 'pending'),
    edge('e5', 'wait', 'check'),
  ],
  nodes: [
    node('order', 'Order placed', 0, 0, { icon: 'inbox', start: true }),
    node('check', 'Check the payment', 0, 136, {
      icon: 'credit-card',
      ports: [
        { id: 'paid', label: 'Paid', tone: 'ok' },
        { id: 'failed', label: 'Failed', tone: 'danger' },
        { id: 'pending', label: 'Pending', tone: 'warn' },
      ],
    }),
    node('ship', 'Ship the order', -272, 272, { icon: 'package', ports: [], tone: 'ok' }),
    node('cancel', 'Cancel the order', 0, 272, { icon: 'circle-x', ports: [], tone: 'danger' }),
    node('wait', 'Wait a day', 272, 272, { icon: 'clock', tone: 'warn' }),
  ],
};

/** One node per option, each saying which. */
const OPTIONS: FlowGraph = {
  edges: [],
  nodes: [
    node('plain', 'Only a label', 0, 0),
    node('described', 'A description', 272, 0, { description: 'A quieter second line' }),
    node('icon', 'An icon', 544, 0, { description: "icon: 'mail'", icon: 'mail' }),
    node('tone', 'A tone', 0, 136, { description: "tone: 'ok'", icon: 'circle-check', tone: 'ok' }),
    node('start', 'A start', 272, 136, { description: 'start: true, no input', icon: 'zap', start: true }),
    node('end', 'An end', 544, 136, { description: 'ports: [], no exit', icon: 'log-out', ports: [] }),
  ],
};

/** An order from placed to delivered, with a branch. */
const ORDER: FlowGraph = {
  edges: [
    edge('e1', 'placed', 'pack'),
    edge('e2', 'pack', 'ship', 'ready'),
    edge('e3', 'pack', 'refund', 'missing'),
  ],
  nodes: [
    node('placed', 'Order placed', 0, 0, { description: 'Shop', icon: 'inbox', start: true }),
    node('pack', 'Pack it', 0, 136, {
      description: 'Warehouse',
      icon: 'package',
      ports: [
        { id: 'ready', label: 'Ready' },
        { id: 'missing', label: 'Missing', tone: 'danger' },
      ],
    }),
    node('ship', 'Ship it', -136, 272, { description: 'Carrier', icon: 'rocket', ports: [] }),
    node('refund', 'Refund', 136, 272, { description: 'Payment', icon: 'credit-card', ports: [] }),
  ],
};

const START: FlowGraph = {
  edges: [],
  nodes: [node('start', 'Start', 0, 0, { icon: 'zap', start: true })],
};

/** The node a page adds when `add` asks: a plain step, joined to the exit it was asked from. */
function addStep(flow: JlFlow, { from, port, position }: FlowAddRequest): void {
  const { edges, nodes } = flow.graph.get();
  const id = `step-${nodes.length + 1}`;
  flow.graph.set({
    edges: [...edges, { from, id: `edge-${id}`, port, to: id }],
    nodes: [...nodes, { icon: 'zap', id, label: `Step ${nodes.length + 1}`, position }],
  });
  flow.selected.set(id);
}

const ADD_STEP_SCRIPT = `
  // + on a free exit, or an edge dropped on empty space: the page adds the node, and its edge.
  flow.events.register('add', ({ from, port, position }) => {
    const { edges, nodes } = flow.graph.get();
    const id = \`step-\${nodes.length + 1}\`;
    flow.graph.set({
      edges: [...edges, { id: \`edge-\${id}\`, from, port, to: id }],
      nodes: [...nodes, { id, label: \`Step \${nodes.length + 1}\`, icon: 'zap', position }],
    });
    flow.selected.set(id);
  });`;

/** The edges one per line: how each names the exit it leaves by. */
const edgeLines = (graph: FlowGraph): string => graph.edges.map((item) => JSON.stringify(item)).join('\n');

export const doc: ComponentDoc = {
  className: 'JlFlow',
  description: `A flow of nodes joined by edges, to edit: the steps of a workflow, the stages of a pipeline, the
screens of a journey. People drag nodes (they snap to an 8-pixel grid), draw an edge from an exit to another node,
select an edge and remove it with its button or Delete. They move the view by dragging the background or with two
fingers, and zoom with Ctrl or ⌘ and the wheel, a pinch, or the buttons. With the focus on a node (Tab), the arrows
move it, Shift for further, and Delete removes it; Escape clears the selection. The wand lays the nodes out again:
each a row below the nodes leading to it, under the exit it hangs from (layout() does the same from code).

The graph is plain data. A node has an id, a label and a position (its top left corner), and optionally a
description, an icon, a tone (the icon's colour), start (nothing leads to it) and ports: its exits, left to right
along its bottom edge, each with an id, a label and a tone (the colour of its edges). Without ports a node has one
exit; with an empty list, none. An edge has an id, from, to, and the port it leaves by (the first one when absent).

Every edit goes out as a whole new graph in change: keep it, save it. The flow does not invent nodes: + on a free
exit, or an edge dropped on empty space, emits add with where the node should go, and the page adds the node and its
edge to the graph (a menu of node kinds, a dialog, or a plain step, as in the examples).`,
  events: [
    {
      description: 'The graph after an edit: a node moved, joined, removed.',
      detail: 'FlowGraph',
      name: 'change',
    },
    { description: 'A node was selected: its id, or an empty string for none.', detail: 'string', name: 'select' },
    {
      description: 'Asks for a node after an exit: the node and exit to join it to, and where to put it.',
      detail: '{ from: string; port: string; position: FlowPoint }',
      name: 'add',
    },
  ],
  examples: [
    {
      description:
        'Drag the nodes, draw an edge from an exit to a node, press + under Pay it back to add a step after it, then the wand to tidy up.',
      html: '<jl-flow class="expenses" label="Expense claim" style="height: 520px"></jl-flow>',
      script: code(
        constSnippet('expenses', EXPENSES),
        `
        const flow = root.querySelector('jl-flow.expenses');
        flow.graph.set(expenses);`,
        ADD_STEP_SCRIPT
      ),
      setup: (root) => {
        const flow = root.querySelector<JlFlow>('jl-flow.expenses');
        flow?.graph.set(EXPENSES);
        flow?.events.register('add', (request) => addStep(flow, request));
      },
      title: 'A workflow',
    },
    {
      description: `ports lists a node's exits, left to right. A tone colours an exit and its edges; danger ones are
dashed. Each edge names the exit it leaves by in port. Wait a day loops back up to the check: its edge goes around.
Connect or remove an edge, and watch the list.`,
      html: `
        <div class="stack">
          <jl-flow class="payment" label="Payment" style="height: 480px"></jl-flow>
          <jl-code-block class="edge-list" language="ts" heading="graph.edges"></jl-code-block>
        </div>`,
      script: code(
        constSnippet('payment', PAYMENT),
        `
        const flow = root.querySelector('jl-flow.payment');
        const list = root.querySelector('.edge-list');
        const showEdges = (graph) => list.code.set(graph.edges.map((edge) => JSON.stringify(edge)).join('\\n'));
        flow.graph.set(payment);
        showEdges(payment);
        flow.events.register('change', showEdges);`
      ),
      setup: (root) => {
        const flow = root.querySelector<JlFlow>('jl-flow.payment');
        const list = root.querySelector<JlCodeBlock>('.edge-list');
        const showEdges = (graph: FlowGraph): void => list?.code.set(edgeLines(graph));
        flow?.graph.set(PAYMENT);
        showEdges(PAYMENT);
        flow?.events.register('change', showEdges);
      },
      title: 'Several exits',
    },
    {
      description: `Every node has an id, a label and a position; the rest is optional. An icon is any registered
name, and a tone is one of neutral, accent (the default), ok, warn, danger and info.`,
      html: '<jl-flow class="options" label="Node options" readonly style="height: 300px"></jl-flow>',
      script: code(
        constSnippet('options', OPTIONS),
        `
        root.querySelector('jl-flow.options').graph.set(options);`
      ),
      setup: (root) => {
        root.querySelector<JlFlow>('jl-flow.options')?.graph.set(OPTIONS);
      },
      title: 'What a node shows',
    },
    {
      description: `The parts restyle the nodes from the page with ::part(): node (also start and selected), icon,
label, description, port, edge (also selected), and base, the canvas. Every look keeps to the design tokens. The
sizes stay: the flow computes every edge from the node's box, 240 by 64 pixels.`,
      html: `
        <style>
          jl-flow.styled::part(base) {
            background-color: var(--jl-surface);
            background-image: none;
          }
          jl-flow.styled::part(node) {
            border-radius: var(--jl-radius-pill);
            box-shadow: none;
          }
          jl-flow.styled::part(node start) {
            border-color: var(--jl-accent-line);
            background: var(--jl-accent-soft);
          }
          jl-flow.styled::part(node selected) {
            border-color: var(--jl-text);
          }
          jl-flow.styled::part(icon) {
            border-radius: var(--jl-radius-pill);
          }
          jl-flow.styled::part(port) {
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          jl-flow.styled::part(edge) {
            stroke-width: 1.5;
          }
        </style>
        <jl-flow class="styled" label="Order" style="height: 420px"></jl-flow>`,
      script: code(
        constSnippet('order', ORDER),
        `
        root.querySelector('jl-flow.styled').graph.set(order);`
      ),
      setup: (root) => {
        root.querySelector<JlFlow>('jl-flow.styled')?.graph.set(ORDER);
      },
      title: 'Your own look',
    },
    {
      description:
        'readonly: nodes are selected, not moved, joined or removed. For people who look and do not edit.',
      html: '<jl-flow class="viewed" label="Order" readonly selected="pack" style="height: 420px"></jl-flow>',
      script: code(
        constSnippet('order', ORDER),
        `
        root.querySelector('jl-flow.viewed').graph.set(order);`
      ),
      setup: (root) => {
        root.querySelector<JlFlow>('jl-flow.viewed')?.graph.set(ORDER);
      },
      title: 'View only',
    },
    {
      description: 'The empty slot shows while there is no node: say how to start.',
      html: `
        <jl-flow class="blank" label="New workflow" style="height: 300px">
          <div slot="empty" class="stack" style="align-items: center">
            <strong>How does it start?</strong>
            <jl-button class="first" icon="plus" label="Add a start"></jl-button>
          </div>
        </jl-flow>`,
      script: code(
        constSnippet('start', START),
        `
        const flow = root.querySelector('jl-flow.blank');
        root.querySelector('.first').events.register('press', () => flow.graph.set(start));`,
        ADD_STEP_SCRIPT
      ),
      setup: (root) => {
        const flow = root.querySelector<JlFlow>('jl-flow.blank');
        root.querySelector<JlButton>('.first')?.events.register('press', () => flow?.graph.set(START));
        flow?.events.register('add', (request) => addStep(flow, request));
      },
      title: 'Empty',
    },
  ],
  level: 'organism',
  methods: [
    { description: 'Moves and zooms the view to show every node.', name: 'fit', signature: 'fit(): void' },
    {
      description:
        'Lays the nodes out again, as the wand does: in rows from the starts down, each under the exit it hangs from. Emits change, then shows every node.',
      name: 'layout',
      signature: 'layout(): void',
    },
  ],
  name: 'Flow',
  playground: {
    attributes: {
      graph: JSON.stringify({ edges: ORDER.edges.slice(0, 1), nodes: ORDER.nodes.slice(0, 2) }),
      label: 'Order',
      readonly: false,
      selected: '',
    },
    height: 440,
    setup: (element) => {
      const flow = element as JlFlow;
      flow.events.register('add', (request) => addStep(flow, request));
    },
    width: 'full',
  },
  props: [
    {
      attribute: 'graph',
      control: { kind: 'json' },
      default: '{ nodes: [], edges: [] }',
      description:
        'The nodes (id, label, position, and optionally description, icon, tone, ports, start) and the edges (id, from, port, to).',
      name: 'graph',
      type: 'FlowGraph',
    },
    {
      attribute: 'selected',
      control: { kind: 'text' },
      default: "''",
      description: 'The id of the selected node; the view moves to show it.',
      name: 'selected',
      type: 'string',
    },
    {
      attribute: 'readonly',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'View only: nodes can be selected, not moved, joined or removed.',
      name: 'readonly',
      type: 'boolean',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The canvas’s name for screen readers: “Flow” when empty.',
      name: 'label',
      type: 'string',
    },
  ],
  slots: [{ description: 'Shown in the middle of the canvas while there is no node.', name: 'empty' }],
  styling: [
    { description: 'The canvas.', name: 'base' },
    { description: 'A node; also named start or selected when it is one.', name: 'node' },
    { description: 'The square around a node’s icon.', name: 'icon' },
    { description: 'A node’s label.', name: 'label' },
    { description: 'A node’s description.', name: 'description' },
    { description: 'An exit: its dot, its label and its + button.', name: 'port' },
    { description: 'An edge’s line; also named selected when it is.', name: 'edge' },
  ],
  summary: 'Nodes joined by edges, to move, connect and extend: a workflow editor.',
  tag: 'jl-flow',
};
