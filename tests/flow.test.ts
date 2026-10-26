import { describe, expect, it } from 'vitest';

import {
  connect,
  edgeEnds,
  edgeMidpoint,
  edgePath,
  edgeRoute,
  FLOW_NODE,
  FLOW_ZOOM,
  fitView,
  isPortFree,
  layoutFlow,
  moveNode,
  nodeAt,
  outputAnchor,
  positionAfter,
  removeEdge,
  removeNode,
  revealIn,
  roundedPath,
  snap,
  toWorld,
  zoomAt,
} from '../src/lib/flow';

import type { FlowGraph, FlowNode } from '../src/types/jl-flow.types';

const start: FlowNode = { id: 'start', label: 'Form sent', position: { x: 0, y: 0 }, start: true };
const check: FlowNode = {
  id: 'check',
  label: 'Check',
  ports: [
    { id: 'yes', label: 'Yes', tone: 'ok' },
    { id: 'no', label: 'No', tone: 'danger' },
  ],
  position: { x: 0, y: 200 },
};
const mail: FlowNode = { id: 'mail', label: 'Send', ports: [], position: { x: 400, y: 400 } };

const graph: FlowGraph = {
  edges: [{ from: 'start', id: 'e1', to: 'check' }],
  nodes: [start, check, mail],
};

describe('anchors and edges', () => {
  it('spreads the exits along the bottom edge, below their pills', () => {
    const yes = outputAnchor(check, 'yes');
    const no = outputAnchor(check, 'no');
    expect(yes?.x).toBe(FLOW_NODE.width / 4);
    expect(no?.x).toBe((FLOW_NODE.width * 3) / 4);
    expect(yes?.y).toBeGreaterThan(check.position.y + FLOW_NODE.height);
    expect(outputAnchor(check, 'maybe')).toBeUndefined();
  });

  it('gives a node without ports one exit, and an edge without a port its first', () => {
    const ends = edgeEnds(graph, { from: 'start', id: 'x', to: 'check' });
    expect(ends?.from.x).toBe(FLOW_NODE.width / 2);
    expect(ends?.to).toEqual({ x: FLOW_NODE.width / 2, y: 200 });
    expect(ends?.tone).toBe('neutral');
  });

  it('takes the tone of the exit, and draws nothing for a missing end', () => {
    expect(edgeEnds(graph, { from: 'check', id: 'x', port: 'no', to: 'mail' })?.tone).toBe('danger');
    expect(edgeEnds(graph, { from: 'check', id: 'x', to: 'gone' })).toBeUndefined();
    expect(edgeEnds(graph, { from: 'mail', id: 'x', to: 'check' })).toBeUndefined();
  });

  it('runs straight down, across halfway and down again, its corners rounded', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 200 };
    expect(edgeRoute(from, to)).toEqual([from, { x: 0, y: 100 }, { x: 100, y: 100 }, to]);
    expect(edgePath(from, to)).toBe('M 0 0 L 0 88 Q 0 100 12 100 L 88 100 Q 100 100 100 112 L 100 200');
    expect(edgeMidpoint(from, to)).toEqual({ x: 50, y: 100 });
  });

  it('draws a straight line between two points one above the other', () => {
    expect(edgePath({ x: 10, y: 0 }, { x: 10, y: 100 })).toBe('M 10 0 L 10 100');
  });

  it('goes around the side, clear of the nodes, back up to an earlier node', () => {
    const route = edgeRoute({ x: 100, y: 300 }, { x: 120, y: 0 });
    expect(route).toHaveLength(6);
    expect(Math.max(...route.map((point) => point.x))).toBeGreaterThanOrEqual(120 + FLOW_NODE.width);
    expect(route[1]?.y).toBeGreaterThan(300);
    expect(route[4]?.y).toBeLessThan(0);
  });

  it('keeps the corners within short runs', () => {
    expect(
      roundedPath([
        { x: 0, y: 0 },
        { x: 0, y: 4 },
        { x: 10, y: 4 },
      ])
    ).toBe('M 0 0 L 0 2 Q 0 4 2 4 L 10 4');
    expect(roundedPath([])).toBe('');
  });
});

describe('edits', () => {
  it('connects an exit to a node once', () => {
    const joined = connect(graph, { from: 'check', id: 'e2', port: 'yes', to: 'mail' });
    expect(joined?.edges).toHaveLength(2);
    expect(joined && connect(joined, { from: 'check', id: 'e3', port: 'yes', to: 'mail' })).toBeUndefined();
    expect(joined && connect(joined, { from: 'check', id: 'e3', port: 'no', to: 'mail' })).toBeDefined();
  });

  it('refuses edges to itself, into a start, from an unknown exit or to a missing node', () => {
    expect(connect(graph, { from: 'check', id: 'x', port: 'yes', to: 'check' })).toBeUndefined();
    expect(connect(graph, { from: 'check', id: 'x', port: 'yes', to: 'start' })).toBeUndefined();
    expect(connect(graph, { from: 'check', id: 'x', port: 'maybe', to: 'mail' })).toBeUndefined();
    expect(connect(graph, { from: 'check', id: 'x', port: 'yes', to: 'gone' })).toBeUndefined();
  });

  it('tells free exits from taken ones', () => {
    expect(isPortFree(graph, start, 'out')).toBe(false);
    expect(isPortFree(graph, check, 'yes')).toBe(true);
  });

  it('removes a node with its edges, and an edge alone', () => {
    expect(removeNode(graph, 'check')).toEqual({ edges: [], nodes: [start, mail] });
    expect(removeEdge(graph, 'e1').edges).toEqual([]);
    expect(moveNode(graph, 'mail', { x: 8, y: 16 }).nodes[2]?.position).toEqual({ x: 8, y: 16 });
  });

  it('finds the node under a point, skipping the one asked', () => {
    expect(nodeAt(graph, { x: 10, y: 210 })?.id).toBe('check');
    expect(nodeAt(graph, { x: 10, y: 210 }, 'check')).toBeUndefined();
    expect(nodeAt(graph, { x: 300, y: 10 })).toBeUndefined();
  });

  it('puts a node added after an exit a row below, side by side with its siblings', () => {
    const after = positionAfter(graph, 'start', 'out');
    expect(after.x).toBe(0);
    expect(after.y).toBeGreaterThan(FLOW_NODE.height);
    const yes = positionAfter(graph, 'check', 'yes');
    const no = positionAfter(graph, 'check', 'no');
    expect(no.x - yes.x).toBeGreaterThan(FLOW_NODE.width);
    expect(yes.x + no.x).toBe(0);
  });

  it('snaps to the grid', () => {
    expect(snap({ x: 13, y: -3 })).toEqual({ x: 16, y: 0 });
  });
});

describe('the view', () => {
  it('turns canvas points into flow points', () => {
    expect(toWorld({ x: 100, y: 50, zoom: 2 }, { x: 300, y: 250 })).toEqual({ x: 100, y: 100 });
  });

  it('zooms around the pointer, within bounds', () => {
    const zoomed = zoomAt({ x: 0, y: 0, zoom: 1 }, { x: 100, y: 100 }, 2);
    expect(zoomed).toEqual({ x: -100, y: -100, zoom: 2 });
    expect(zoomAt(zoomed, { x: 0, y: 0 }, 10).zoom).toBe(FLOW_ZOOM.max);
    expect(zoomAt(zoomed, { x: 0, y: 0 }, 0.01).zoom).toBe(FLOW_ZOOM.min);
  });

  it('moves the view just enough to show a node, and not at all when it shows', () => {
    const view = { x: 0, y: 0, zoom: 1 };
    expect(revealIn(view, start, 1000, 800)).toEqual({ x: 48, y: 48, zoom: 1 });
    const inside: FlowNode = { ...start, position: { x: 200, y: 200 } };
    expect(revealIn(view, inside, 1000, 800)).toEqual(view);
    const below: FlowNode = { ...start, position: { x: 200, y: 900 } };
    expect(revealIn(view, below, 1000, 800).y).toBeLessThan(-900 + 800);
  });

  it('fits every node, centred, never larger than life', () => {
    const one = fitView([start], 1000, 800);
    expect(one.zoom).toBe(1);
    expect(one.x).toBe(500 - FLOW_NODE.width / 2);
    const all = fitView(graph.nodes, 400, 300);
    expect(all.zoom).toBeLessThan(1);
    expect(fitView([], 400, 300).zoom).toBe(1);
  });
});

describe('layoutFlow', () => {
  const rowStep = 136;
  const at = (x: number, y: number): FlowNode['position'] => ({ x, y });
  const positions = (laid: FlowGraph): Record<string, FlowNode['position']> =>
    Object.fromEntries(laid.nodes.map((node) => [node.id, node.position]));

  it('puts a chain in one column, a row per node, from the start down', () => {
    const chain: FlowGraph = {
      edges: [
        { from: 'b', id: 'e2', to: 'c' },
        { from: 'a', id: 'e1', to: 'b' },
      ],
      nodes: [
        { id: 'c', label: 'C', position: at(500, 9) },
        { id: 'a', label: 'A', position: at(-80, 300), start: true },
        { id: 'b', label: 'B', position: at(40, 40) },
      ],
    };
    expect(positions(layoutFlow(chain))).toEqual({ a: at(0, 0), b: at(0, rowStep), c: at(0, rowStep * 2) });
  });

  it('hangs each node under its exit: the first to the left, the last to the right', () => {
    const laid = positions(layoutFlow(graph));
    const joined = connect(graph, { from: 'check', id: 'e2', port: 'no', to: 'mail' });
    const branches = joined ? positions(layoutFlow(joined)) : {};
    expect(laid.check).toEqual(at(laid.start?.x ?? Number.NaN, rowStep));
    expect(branches.mail?.x).toBeGreaterThan(branches.check?.x ?? 0);
    expect(branches.mail?.y).toBe(rowStep * 2);
  });

  it('leaves out the edge that loops back up: the loop does not push rows down', () => {
    const loop: FlowGraph = {
      edges: [
        { from: 'start', id: 'e1', to: 'check' },
        { from: 'check', id: 'e2', port: 'no', to: 'mail' },
        { from: 'mail', id: 'e3', to: 'check' },
      ],
      nodes: [start, check, { ...mail, ports: undefined }],
    };
    const laid = positions(layoutFlow(loop));
    expect(laid.check?.y).toBe(rowStep);
    expect(laid.mail?.y).toBe(rowStep * 2);
  });

  it('keeps the nodes of a row apart, centred under what leads to them', () => {
    const fan: FlowGraph = {
      edges: ['x', 'y', 'z'].map((id) => ({ from: 'start', id: `e-${id}`, to: id })),
      nodes: [start, ...['x', 'y', 'z'].map((id) => ({ id, label: id, position: at(0, 0) }))],
    };
    const laid = positions(layoutFlow(fan));
    const xs = ['x', 'y', 'z'].map((id) => laid[id]?.x ?? 0);
    expect(xs[1]).toBe(0);
    expect((xs[1] ?? 0) - (xs[0] ?? 0)).toBeGreaterThanOrEqual(FLOW_NODE.width);
    expect((xs[2] ?? 0) - (xs[1] ?? 0)).toBeGreaterThanOrEqual(FLOW_NODE.width);
  });

  it('puts nodes nothing leads to on the first row, side by side', () => {
    const loose: FlowGraph = { edges: [], nodes: [start, { ...check, id: 'other' }] };
    const laid = positions(layoutFlow(loose));
    expect(laid.start?.y).toBe(0);
    expect(laid.other?.y).toBe(0);
    expect(Math.abs((laid.other?.x ?? 0) - (laid.start?.x ?? 0))).toBeGreaterThanOrEqual(FLOW_NODE.width);
  });

  it('changes nothing but the positions', () => {
    const laid = layoutFlow(graph);
    expect(laid.edges).toEqual(graph.edges);
    expect(laid.nodes.map(({ position: _position, ...rest }) => rest)).toEqual(
      graph.nodes.map(({ position: _position, ...rest }) => rest)
    );
  });
});
