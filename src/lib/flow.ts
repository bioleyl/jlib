import type {
  FlowEdge,
  FlowEdgeEnds,
  FlowGraph,
  FlowNode,
  FlowPoint,
  FlowPort,
  FlowViewport,
} from '../types/jl-flow.types';

/** A node's box: fixed, so that every anchor and edge is computed without measuring the page. */
export const FLOW_NODE = { height: 64, width: 240 } as const;

export const FLOW_ZOOM = { max: 2, min: 0.25, step: 1.2 } as const;

/** The exit of a node that names none. */
export const DEFAULT_PORT: FlowPort = { id: 'out' };

// An edge starts under its exit's pill, which straddles the node's bottom edge.
const PORT_DROP = 12;
// Nodes land on this grid: they line up without trying.
const GRID = 8;
// An edge runs straight out of an exit and into a node this far before it turns, and turns with this radius.
const STUB = 24;
const CORNER_RADIUS = 12;
const FIT_PADDING = 48;
// Room kept between a node brought into view and the edge of the canvas.
const REVEAL_MARGIN = 48;
// Room between a node and one added after it, and between nodes added side by side.
const ROW_GAP = 72;
const COLUMN_GAP = 32;

export const portsOf = (node: FlowNode): FlowPort[] => node.ports ?? [DEFAULT_PORT];

/** The exit an edge leaves by: its own, or its node's first. */
export const portOfEdge = (node: FlowNode, edge: FlowEdge): string => edge.port ?? portsOf(node)[0]?.id ?? '';

const nodeById = (graph: FlowGraph, id: string): FlowNode | undefined =>
  graph.nodes.find((node) => node.id === id);

// Adding 0 turns -0 into 0, which the graph's JSON and the tests read as the same number.
const toGrid = (value: number): number => Math.round(value / GRID) * GRID + 0;

export const snap = (point: FlowPoint): FlowPoint => ({ x: toGrid(point.x), y: toGrid(point.y) });

/** Where a node's n-th exit sits along its bottom edge: the edge cut in equal parts, each exit in the middle of one. */
export const portX = (index: number, count: number): number => (FLOW_NODE.width * (index + 0.5)) / count;

export function outputAnchor(node: FlowNode, portId: string): FlowPoint | undefined {
  const ports = portsOf(node);
  const index = ports.findIndex((port) => port.id === portId);
  if (index < 0) {
    return undefined;
  }
  return {
    x: node.position.x + portX(index, ports.length),
    y: node.position.y + FLOW_NODE.height + PORT_DROP,
  };
}

export const inputAnchor = (node: FlowNode): FlowPoint => ({
  x: node.position.x + FLOW_NODE.width / 2,
  y: node.position.y,
});

const distance = (a: FlowPoint, b: FlowPoint): number => Math.hypot(a.x - b.x, a.y - b.y);

/** The point `length` away from `from`, towards `to`. */
function towards(from: FlowPoint, to: FlowPoint, length: number): FlowPoint {
  const span = distance(from, to);
  const ratio = span === 0 ? 0 : length / span;
  return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
}

/**
 * The corners an edge goes through, in straight runs: down from the exit, across halfway, down into the node. An
 * edge that goes back up turns around the side, clear of the nodes.
 */
export function edgeRoute(from: FlowPoint, to: FlowPoint): FlowPoint[] {
  const forward = to.y - from.y >= STUB * 2;
  if (forward && to.x === from.x) {
    return [from, to];
  }
  if (forward) {
    const middle = (from.y + to.y) / 2;
    return [from, { x: from.x, y: middle }, { x: to.x, y: middle }, to];
  }
  const below = from.y + STUB;
  const above = to.y - STUB;
  // Exits and inputs lie within their node's width: a node's width away from both, the edge passes every node.
  const apart = Math.abs(to.x - from.x) > FLOW_NODE.width;
  const side = apart ? (from.x + to.x) / 2 : Math.max(from.x, to.x) + FLOW_NODE.width;
  return [from, { x: from.x, y: below }, { x: side, y: below }, { x: side, y: above }, { x: to.x, y: above }, to];
}

/** An SVG path through the points, its corners rounded. */
export function roundedPath(points: readonly FlowPoint[], radius = CORNER_RADIUS): string {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) {
    return '';
  }
  const corners = points.slice(1, -1).map((corner, index) => {
    const before = points[index] ?? corner;
    const after = points[index + 2] ?? corner;
    const round = Math.min(radius, distance(before, corner) / 2, distance(corner, after) / 2);
    const enter = towards(corner, before, round);
    const leave = towards(corner, after, round);
    return `L ${enter.x} ${enter.y} Q ${corner.x} ${corner.y} ${leave.x} ${leave.y}`;
  });
  return [`M ${first.x} ${first.y}`, ...corners, `L ${last.x} ${last.y}`].join(' ');
}

/** The point halfway along a line through the points. */
function halfway(points: readonly FlowPoint[]): FlowPoint {
  const segments = points.slice(1).map((end, index) => ({ end, start: points[index] ?? end }));
  const total = segments.reduce((sum, { end, start }) => sum + distance(start, end), 0);
  const walk = { left: total / 2 };
  for (const { end, start } of segments) {
    const length = distance(start, end);
    if (walk.left <= length) {
      return towards(start, end, walk.left);
    }
    walk.left -= length;
  }
  return points.at(-1) ?? { x: 0, y: 0 };
}

export const edgePath = (from: FlowPoint, to: FlowPoint): string => roundedPath(edgeRoute(from, to));

/** The point halfway along `edgePath(from, to)`. */
export const edgeMidpoint = (from: FlowPoint, to: FlowPoint): FlowPoint => halfway(edgeRoute(from, to));

/** Where an edge starts and ends, or nothing when one of its ends is gone. */
export function edgeEnds(graph: FlowGraph, edge: FlowEdge): FlowEdgeEnds | undefined {
  const source = nodeById(graph, edge.from);
  const target = nodeById(graph, edge.to);
  const portId = source ? portOfEdge(source, edge) : '';
  const from = source ? outputAnchor(source, portId) : undefined;
  if (!source || !target || !from) {
    return undefined;
  }
  const tone = portsOf(source).find((port) => port.id === portId)?.tone ?? 'neutral';
  return { from, to: inputAnchor(target), tone };
}

const isInside = (point: FlowPoint, node: FlowNode): boolean =>
  point.x >= node.position.x
  && point.x <= node.position.x + FLOW_NODE.width
  && point.y >= node.position.y
  && point.y <= node.position.y + FLOW_NODE.height;

/** The node under a point, other than `except`. */
export const nodeAt = (graph: FlowGraph, point: FlowPoint, except = ''): FlowNode | undefined =>
  graph.nodes.find((node) => node.id !== except && isInside(point, node));

export const isPortFree = (graph: FlowGraph, node: FlowNode, portId: string): boolean =>
  !graph.edges.some((edge) => edge.from === node.id && portOfEdge(node, edge) === portId);

/**
 * The graph with one more edge, or nothing when the edge cannot be: a node does not connect to itself, a start takes
 * no incoming edge, and an exit joins a node once.
 */
export function connect(graph: FlowGraph, edge: FlowEdge): FlowGraph | undefined {
  const source = nodeById(graph, edge.from);
  const target = nodeById(graph, edge.to);
  if (!source || !target || source.id === target.id || target.start === true) {
    return undefined;
  }
  const port = portOfEdge(source, edge);
  const known = portsOf(source).some((candidate) => candidate.id === port);
  const exists = graph.edges.some(
    (candidate) =>
      candidate.from === source.id && candidate.to === target.id && portOfEdge(source, candidate) === port
  );
  return known && !exists ? { ...graph, edges: [...graph.edges, edge] } : undefined;
}

export const moveNode = (graph: FlowGraph, id: string, position: FlowPoint): FlowGraph => ({
  ...graph,
  nodes: graph.nodes.map((node) => (node.id === id ? { ...node, position } : node)),
});

/** The graph without the node, and without its edges. */
export const removeNode = (graph: FlowGraph, id: string): FlowGraph => ({
  edges: graph.edges.filter((edge) => edge.from !== id && edge.to !== id),
  nodes: graph.nodes.filter((node) => node.id !== id),
});

export const removeEdge = (graph: FlowGraph, id: string): FlowGraph => ({
  ...graph,
  edges: graph.edges.filter((edge) => edge.id !== id),
});

// A row and a column of the flow: a node and the room around it.
const ROW = FLOW_NODE.height + ROW_GAP;
const COLUMN = FLOW_NODE.width + COLUMN_GAP;

/** How far across a node hangs from its parent's exit: the exits share the row out, side by side, around it. */
function portShift(node: FlowNode, portId: string): number {
  const ports = portsOf(node);
  const index = Math.max(
    0,
    ports.findIndex((port) => port.id === portId)
  );
  return (index - (ports.length - 1) / 2) * COLUMN;
}

/** Where a node added after an exit goes: a row below, under its exit, clear of the nodes after the other exits. */
export function positionAfter(graph: FlowGraph, from: string, portId: string): FlowPoint {
  const source = nodeById(graph, from);
  if (!source) {
    return { x: 0, y: 0 };
  }
  return snap({ x: source.position.x + portShift(source, portId), y: source.position.y + ROW });
}

/** The edges that close a loop, found walking from the starts: the layout leaves them out, or a loop has no top. */
function loopEdges(graph: FlowGraph): Set<string> {
  const loops = new Set<string>();
  const done = new Set<string>();
  const path = new Set<string>();
  const visit = (id: string): void => {
    if (done.has(id)) {
      return;
    }
    path.add(id);
    for (const edge of graph.edges.filter((candidate) => candidate.from === id)) {
      if (path.has(edge.to)) {
        loops.add(edge.id);
        continue;
      }
      visit(edge.to);
    }
    path.delete(id);
    done.add(id);
  };
  const starts = graph.nodes.filter((node) => node.start === true);
  for (const node of [...starts, ...graph.nodes]) {
    visit(node.id);
  }
  return loops;
}

/** Each node's row: one below the lowest node leading to it, so the flow reads from top to bottom. */
function rowsOf(graph: FlowGraph, edges: readonly FlowEdge[]): Map<string, number> {
  const rows = new Map(graph.nodes.map((node) => [node.id, 0]));
  const rowOf = (id: string): number => rows.get(id) ?? 0;
  // Without loops, the longest path settles within as many rounds as there are nodes.
  for (const _round of graph.nodes) {
    const deeper = edges.filter((edge) => rowOf(edge.to) <= rowOf(edge.from));
    if (deeper.length === 0) {
      break;
    }
    for (const edge of deeper) {
      rows.set(edge.to, Math.max(rowOf(edge.to), rowOf(edge.from) + 1));
    }
  }
  return rows;
}

/** Where a node wants to be across: under its parents, each by the exit it hangs from. */
function wantedX(
  graph: FlowGraph,
  edges: readonly FlowEdge[],
  id: string,
  placed: ReadonlyMap<string, number>
): number {
  const parents = edges.flatMap((edge) => {
    const source = nodeById(graph, edge.from);
    const x = placed.get(edge.from);
    return edge.to === id && source && x !== undefined ? [x + portShift(source, portOfEdge(source, edge))] : [];
  });
  return parents.length === 0 ? 0 : parents.reduce((sum, x) => sum + x, 0) / parents.length;
}

/** A row's nodes where they want to be, pushed apart where they would overlap, the row kept centred on them. */
function placeRow(wanted: readonly { id: string; x: number }[], placed: Map<string, number>): void {
  const sorted = [...wanted].sort((a, b) => a.x - b.x);
  const pushed: number[] = [];
  for (const item of sorted) {
    pushed.push(Math.max(item.x, (pushed.at(-1) ?? Number.NEGATIVE_INFINITY) + COLUMN));
  }
  const drift =
    pushed.reduce((sum, x, index) => sum + x - (sorted[index]?.x ?? x), 0) / Math.max(1, pushed.length);
  for (const [index, item] of sorted.entries()) {
    placed.set(item.id, (pushed[index] ?? item.x) - drift);
  }
}

/**
 * The nodes laid out again, top to bottom in the order they run: the starts and the nodes nothing leads to on the
 * first row, each other node a row below the lowest node leading to it, under the exits it hangs from. Edges that
 * loop back up do not count. Only the positions change.
 */
export function layoutFlow(graph: FlowGraph): FlowGraph {
  const ids = new Set(graph.nodes.map((node) => node.id));
  const loops = loopEdges(graph);
  const edges = graph.edges.filter((edge) => !loops.has(edge.id) && ids.has(edge.from) && ids.has(edge.to));
  const rows = rowsOf(graph, edges);
  const placed = new Map<string, number>();
  for (const row of [...new Set(rows.values())].sort((a, b) => a - b)) {
    const members = graph.nodes.filter((node) => rows.get(node.id) === row);
    placeRow(
      members.map((node) => ({ id: node.id, x: wantedX(graph, edges, node.id, placed) })),
      placed
    );
  }
  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: snap({ x: placed.get(node.id) ?? 0, y: (rows.get(node.id) ?? 0) * ROW }),
    })),
  };
}

const clampZoom = (zoom: number): number => Math.min(FLOW_ZOOM.max, Math.max(FLOW_ZOOM.min, zoom));

/** Where a point of the canvas (relative to its top left corner) is in the flow's own pixels. */
export const toWorld = (viewport: FlowViewport, screen: FlowPoint): FlowPoint => ({
  x: (screen.x - viewport.x) / viewport.zoom,
  y: (screen.y - viewport.y) / viewport.zoom,
});

/** Zooms by `factor`, keeping the point under `screen` where it is: zooming follows the pointer. */
export function zoomAt(viewport: FlowViewport, screen: FlowPoint, factor: number): FlowViewport {
  const zoom = clampZoom(viewport.zoom * factor);
  const world = toWorld(viewport, screen);
  return { x: screen.x - world.x * zoom, y: screen.y - world.y * zoom, zoom };
}

/** The view that shows every node, centred in a canvas of this size, never larger than life. */
export function fitView(nodes: readonly FlowNode[], width: number, height: number): FlowViewport {
  if (nodes.length === 0) {
    return { x: FIT_PADDING, y: FIT_PADDING, zoom: 1 };
  }
  const left = Math.min(...nodes.map((node) => node.position.x));
  const top = Math.min(...nodes.map((node) => node.position.y));
  const right = Math.max(...nodes.map((node) => node.position.x + FLOW_NODE.width));
  const bottom = Math.max(...nodes.map((node) => node.position.y + FLOW_NODE.height + PORT_DROP));
  const zoom = clampZoom(
    Math.min(1, (width - FIT_PADDING * 2) / (right - left), (height - FIT_PADDING * 2) / (bottom - top))
  );
  return {
    x: width / 2 - ((left + right) / 2) * zoom,
    y: height / 2 - ((top + bottom) / 2) * zoom,
    zoom,
  };
}

/** How far to move a span so that it fits between the margins of `size`: nothing when it already does. */
function shiftInto(start: number, end: number, size: number): number {
  if (start < REVEAL_MARGIN) {
    return REVEAL_MARGIN - start;
  }
  return end > size - REVEAL_MARGIN ? size - REVEAL_MARGIN - end : 0;
}

/** The view moved just enough for a node to be seen whole, its exits included; unchanged when it already is. */
export function revealIn(viewport: FlowViewport, node: FlowNode, width: number, height: number): FlowViewport {
  const { zoom } = viewport;
  const left = viewport.x + node.position.x * zoom;
  const top = viewport.y + node.position.y * zoom;
  return {
    x: viewport.x + shiftInto(left, left + FLOW_NODE.width * zoom, width),
    y: viewport.y + shiftInto(top, top + (FLOW_NODE.height + PORT_DROP) * zoom, height),
    zoom,
  };
}
