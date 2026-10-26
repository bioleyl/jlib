import type { Tone } from './options.types';

/** A point in the flow's own pixels, which the view moves and zooms. */
export type FlowPoint = { x: number; y: number };

/** An exit of a node, along its bottom edge. Its edges take its tone: `danger` ones are dashed. */
export type FlowPort = { id: string; label?: string; tone?: Tone };

/** How a node did in a run, shown on it: at work, finished, waiting for someone, or failed. */
export type FlowNodeStatus = 'running' | 'done' | 'waiting' | 'failed';

export type FlowNode = {
  id: string;
  label: string;
  /** The node's top left corner. */
  position: FlowPoint;
  /** A second, quieter line under the label. */
  description?: string;
  /** A third line, under a dashed rule: what the node is set to do. The node is taller with it. */
  detail?: string;
  icon?: string;
  /** The colour of the icon: `accent` by default. */
  tone?: Tone;
  /** The icon's colour as any CSS colour, for kinds the tones do not cover (`var(--my-ai)`); wins over `tone`. */
  color?: string;
  /** How it did in a run. */
  status?: FlowNodeStatus;
  /** The exit a run left it by: that exit, and its edges to nodes with a status, stand out. */
  taken?: string;
  /** Something to fix before the flow can run: a mark on the node, with this text as its explanation. */
  problem?: string;
  /** The exits. Absent, the node has one without a name; empty, it has none (it ends the flow). */
  ports?: FlowPort[];
  /** A start takes no incoming edge. */
  start?: boolean;
};

export type FlowEdge = {
  id: string;
  from: string;
  /** The exit of `from` it leaves by; absent, the first one. */
  port?: string;
  to: string;
};

export type FlowGraph = { nodes: FlowNode[]; edges: FlowEdge[] };

/** Asks the page for a node after an exit: where to put it, and what to connect it to. */
export type FlowAddRequest = { from: string; port: string; position: FlowPoint };

/** Asks for a node where something was dropped: what it carried, and where to put the node. */
export type FlowDropRequest = { data: string; position: FlowPoint };

/** How far the view is moved, and how much it is zoomed. */
export type FlowViewport = { x: number; y: number; zoom: number };

/** Where an edge starts and ends, and the tone of the exit it leaves by. */
export type FlowEdgeEnds = { from: FlowPoint; to: FlowPoint; tone: Tone };

/** What a press on the canvas is doing: moving the view, moving a node, or drawing an edge from an exit. */
export type FlowGesture =
  | { kind: 'idle' }
  | { kind: 'pan'; start: FlowPoint; origin: FlowViewport; moved: boolean; edge: string }
  | { kind: 'drag'; node: string; offset: FlowPoint; start: FlowPoint; moved: boolean }
  | { kind: 'connect'; node: string; port: string; start: FlowPoint };
