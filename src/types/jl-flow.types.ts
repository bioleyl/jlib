import type { Tone } from './options.types';

/** A point in the flow's own pixels, which the view moves and zooms. */
export type FlowPoint = { x: number; y: number };

/** An exit of a node, along its bottom edge. Its edges take its tone: `danger` ones are dashed. */
export type FlowPort = { id: string; label?: string; tone?: Tone };

export type FlowNode = {
  id: string;
  label: string;
  /** The node's top left corner. */
  position: FlowPoint;
  /** A second, quieter line under the label. */
  description?: string;
  icon?: string;
  /** The colour of the icon: `accent` by default. */
  tone?: Tone;
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
