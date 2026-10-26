import { css } from '@jadis/core';
import { Maximize, Minus, Plus, WandSparkles, X } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { setOrRemove, svgElement } from '../lib/dom';
import {
  connect,
  edgeEnds,
  edgeMidpoint,
  edgePath,
  FLOW_NODE,
  FLOW_ZOOM,
  fitView,
  isPortFree,
  layoutFlow,
  moveNode,
  nodeAt,
  outputAnchor,
  portsOf,
  portX,
  positionAfter,
  removeEdge,
  removeNode,
  revealIn,
  snap,
  toWorld,
  zoomAt,
} from '../lib/flow';
import { registerIcons } from '../lib/icons';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-flow.css?raw';

import type {
  FlowAddRequest,
  FlowEdgeEnds,
  FlowGesture,
  FlowGraph,
  FlowNode,
  FlowPoint,
  FlowPort,
  FlowViewport,
} from '../types/jl-flow.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ maximize: Maximize, minus: Minus, plus: Plus, 'wand-sparkles': WandSparkles, x: X });

const EMPTY: FlowGraph = { edges: [], nodes: [] };
const IDLE: FlowGesture = { kind: 'idle' };
const DEFAULT_LABEL = 'Flow';
const DOT_SPACING = 20;
const WHEEL_ZOOM_SPEED = 0.0018;
// Below this, a press that moves is still a press: hands shake.
const CLICK_TOLERANCE = 4;
const NUDGE = 8;
const LONG_NUDGE = 40;
const PERCENT = 100;
const ICON_SIZE = 16;
const ADD_ICON_SIZE = 12;
const CONTROL_ICON_SIZE = 14;
// Room between two exits' pills.
const PORT_GAP = 6;
const ID_LENGTH = 8;
const DELETE_KEYS = new Set(['Delete', 'Backspace']);
// Keyboard keys are PascalCase names: a Map keeps them as they are.
const ARROWS = new Map<string, FlowPoint>([
  ['ArrowDown', { x: 0, y: 1 }],
  ['ArrowLeft', { x: -1, y: 0 }],
  ['ArrowRight', { x: 1, y: 0 }],
  ['ArrowUp', { x: 0, y: -1 }],
]);

/** What the pointer is on, read from the marks the nodes, exits, edges and buttons carry. */
type Target = { node?: string; port?: string; add?: string; edge?: string; control: boolean };

const markOf = (element: Element | null, name: string): string | undefined =>
  element?.closest(`[${name}]`)?.getAttribute(name) ?? undefined;

// The composed path also crosses what a page puts in the empty slot: its buttons are controls too.
const isControl = (event: Event): boolean =>
  event.composedPath().some((element) => element instanceof Element && element.hasAttribute('data-control'));

function targetOf(event: Event): Target {
  const element = event.target instanceof Element ? event.target : null;
  return {
    add: markOf(element, 'data-add'),
    control: isControl(event),
    edge: markOf(element, 'data-edge'),
    node: markOf(element, 'data-node'),
    port: markOf(element, 'data-port'),
  };
}

const distance = (a: FlowPoint, b: FlowPoint): number => Math.hypot(a.x - b.x, a.y - b.y);

const newId = (prefix: string): string =>
  `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, ID_LENGTH)}`;

const addLabel = (node: FlowNode, port: FlowPort): string =>
  port.label ? `Add after ${node.label}, ${port.label}` : `Add after ${node.label}`;

/**
 * A flow of nodes joined by edges, to edit: people move the nodes, draw an edge from a node's exit to another node,
 * press + on a free exit to ask for the next node, and move and zoom the view. Every edit goes out as a new graph
 * (`change`); the page adds nodes itself, when `add` asks.
 */
export class JlFlow extends JlElement {
  static readonly selector = 'jl-flow';

  readonly events = this.useEvents<{ change: FlowGraph; select: string; add: FlowAddRequest }>();

  readonly graph = this.useChange<FlowGraph>(EMPTY, (graph) => this.show(graph), {
    attribute: 'graph',
    parse: jsonOf(EMPTY),
  });
  /** The id of the selected node; the view moves to show it. */
  readonly selected = this.useChange(
    '',
    (id) => {
      this.renderSelection();
      this.reveal(id);
    },
    { attribute: 'selected' }
  );
  /** View only: nodes can be selected, not moved, joined or removed. */
  readonly readonly = this.useChange(
    false,
    (value) => {
      this.reflect('readonly', value);
      this.render();
    },
    { attribute: 'readonly' }
  );
  /** The canvas's name for screen readers. */
  readonly label = this.useChange(
    '',
    (value) => this._refs.viewport.setAttribute('aria-label', value || DEFAULT_LABEL),
    {
      attribute: 'label',
    }
  );

  private readonly _state = {
    edge: '',
    fitted: false,
    gesture: IDLE,
    graph: EMPTY,
    viewport: { x: 0, y: 0, zoom: 1 } as FlowViewport,
  };
  private readonly _nodes = new Map<string, HTMLElement>();
  private readonly _svg = {
    draft: svgElement('path', { class: 'edge draft' }),
    root: svgElement('svg', { class: 'edges', height: '1', width: '1' }),
  };

  private readonly _refs = this.useRefs((ref) => ({
    empty: ref('.empty'),
    fit: ref<HTMLButtonElement>('.fit'),
    nodes: ref('.nodes'),
    removeEdge: ref('.remove-edge'),
    tidy: ref<HTMLButtonElement>('.tidy'),
    viewport: ref('.viewport'),
    world: ref('.world'),
    zoomIn: ref<HTMLButtonElement>('.zoom-in'),
    zoomLabel: ref('.zoom-label'),
    zoomOut: ref<HTMLButtonElement>('.zoom-out'),
  }));

  /** Moves and zooms the view to show every node, never larger than life. */
  fit(): void {
    this.whenRendered(() => {
      const { width, height } = this._refs.viewport.getBoundingClientRect();
      if (width === 0) {
        return;
      }
      this._state.fitted = true;
      this.setViewport(fitView(this._state.graph.nodes, width, height));
    });
  }

  /** Lays the nodes out again, in rows from the starts down (`change` gives the new positions), and shows them all. */
  layout(): void {
    this.whenRendered(() => {
      this.commit(layoutFlow(this._state.graph));
      this.fit();
    });
  }

  templateHtml(): Node {
    return (
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the canvas takes the focus, for the keys that act on it
      <div class="viewport" role="application" tabIndex={0} attrs={{ part: 'base' }}>
        <div class="world">
          {this._svg.root}
          <div class="nodes" />
          <button type="button" class="remove-edge" data-control="" hidden aria-label="Remove this edge">
            <JlIcon name="x" size={ADD_ICON_SIZE} />
          </button>
        </div>
        <div class="empty" data-control="" hidden>
          <slot name="empty">Nothing here yet.</slot>
        </div>
        <div class="controls" data-control="">
          <button type="button" class="control zoom-out" title="Zoom out" aria-label="Zoom out">
            <JlIcon name="minus" size={CONTROL_ICON_SIZE} />
          </button>
          <span class="zoom-label" />
          <button type="button" class="control zoom-in" title="Zoom in" aria-label="Zoom in">
            <JlIcon name="plus" size={CONTROL_ICON_SIZE} />
          </button>
          <button type="button" class="control fit" title="Show every node" aria-label="Show every node">
            <JlIcon name="maximize" size={CONTROL_ICON_SIZE} />
          </button>
          <button type="button" class="control tidy" title="Tidy up the layout" aria-label="Tidy up the layout">
            <JlIcon name="wand-sparkles" size={CONTROL_ICON_SIZE} />
          </button>
        </div>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const viewport = this._refs.viewport;
    this.on(viewport, 'pointerdown', (event) => this.pointerDown(event));
    this.on(viewport, 'pointermove', (event) => this.pointerMove(event));
    this.on(viewport, 'pointerup', (event) => this.pointerUp(event));
    this.on(viewport, 'pointercancel', (event) => this.pointerUp(event));
    this.on(viewport, 'wheel', (event) => this.wheel(event));
    this.on(viewport, 'keydown', (event) => this.key(event));
    this.on(viewport, 'click', (event) => this.pressAdd(event));
    this.on(viewport, 'focusin', (event) => {
      const node = targetOf(event).node;
      if (node !== undefined) {
        this.select(node);
      }
    });
    this.on(this._refs.removeEdge, 'click', () => this.removeSelection());
    this.on(this._refs.zoomIn, 'click', () => this.zoomBy(FLOW_ZOOM.step));
    this.on(this._refs.zoomOut, 'click', () => this.zoomBy(1 / FLOW_ZOOM.step));
    this.on(this._refs.fit, 'click', () => this.fit());
    this.on(this._refs.tidy, 'click', () => this.layout());
    this.applyViewport();
  }

  private show(graph: FlowGraph): void {
    this._state.graph = graph;
    this.render();
    if (!this._state.fitted && graph.nodes.length > 0) {
      requestAnimationFrame(() => this.fit());
    }
  }

  /** An edit: drawn, kept, and sent to the page. */
  private commit(graph: FlowGraph): void {
    this.graph.set(graph);
    this.events.emit('change', graph);
  }

  private select(id: string): void {
    if (this._state.edge !== '') {
      this._state.edge = '';
      this.renderEdges();
    }
    if (id === this.selected.get()) {
      return;
    }
    this.selected.set(id);
    this.events.emit('select', id);
  }

  private selectEdge(id: string): void {
    this.select('');
    this._state.edge = id;
    this.renderEdges();
  }

  private removeSelection(): void {
    const { edge, graph } = this._state;
    const node = this.selected.get();
    if (edge !== '') {
      this._state.edge = '';
      this.commit(removeEdge(graph, edge));
      return;
    }
    if (node === '') {
      return;
    }
    this.select('');
    this.commit(removeNode(graph, node));
  }

  private nodeOf(id: string): FlowNode | undefined {
    return this._state.graph.nodes.find((node) => node.id === id);
  }

  private pointerDown(event: PointerEvent): void {
    const target = targetOf(event);
    if (event.button !== 0 || target.control || target.add !== undefined) {
      return;
    }
    if (target.node !== undefined) {
      this.select(target.node);
    }
    this._state.gesture = this.gestureFor(target, event);
    this._refs.viewport.setPointerCapture(event.pointerId);
  }

  private gestureFor(target: Target, event: PointerEvent): FlowGesture {
    const start = { x: event.clientX, y: event.clientY };
    const node = target.node === undefined ? undefined : this.nodeOf(target.node);
    if (node && target.port !== undefined && !this.readonly.get()) {
      return { kind: 'connect', node: node.id, port: target.port, start };
    }
    if (node) {
      const world = this.worldPoint(event);
      const offset = { x: world.x - node.position.x, y: world.y - node.position.y };
      return { kind: 'drag', moved: false, node: node.id, offset, start };
    }
    return { edge: target.edge ?? '', kind: 'pan', moved: false, origin: this._state.viewport, start };
  }

  private pointerMove(event: PointerEvent): void {
    const gesture = this._state.gesture;
    const screen = { x: event.clientX, y: event.clientY };
    if (gesture.kind === 'pan') {
      this._state.gesture = {
        ...gesture,
        moved: gesture.moved || distance(screen, gesture.start) > CLICK_TOLERANCE,
      };
      this.setViewport({
        ...gesture.origin,
        x: gesture.origin.x + screen.x - gesture.start.x,
        y: gesture.origin.y + screen.y - gesture.start.y,
      });
      return;
    }
    if (gesture.kind === 'drag') {
      this.drag(gesture, screen, event);
      return;
    }
    if (gesture.kind === 'connect') {
      this.drawDraft(gesture, event);
    }
  }

  private drag(gesture: Extract<FlowGesture, { kind: 'drag' }>, screen: FlowPoint, event: PointerEvent): void {
    const moved = gesture.moved || distance(screen, gesture.start) > CLICK_TOLERANCE;
    if (!moved || this.readonly.get()) {
      return;
    }
    this._state.gesture = { ...gesture, moved };
    const world = this.worldPoint(event);
    const position = snap({ x: world.x - gesture.offset.x, y: world.y - gesture.offset.y });
    this._state.graph = moveNode(this._state.graph, gesture.node, position);
    const element = this._nodes.get(gesture.node);
    if (element) {
      this.place(element, position);
    }
    this.renderEdges();
  }

  private drawDraft(gesture: Extract<FlowGesture, { kind: 'connect' }>, event: PointerEvent): void {
    const node = this.nodeOf(gesture.node);
    const from = node ? outputAnchor(node, gesture.port) : undefined;
    if (from) {
      this._svg.draft.setAttribute('d', edgePath(from, this.worldPoint(event)));
    }
  }

  private pointerUp(event: PointerEvent): void {
    const gesture = this._state.gesture;
    this._state.gesture = IDLE;
    if (gesture.kind === 'connect') {
      this._svg.draft.removeAttribute('d');
      this.connectAt(gesture, event);
      return;
    }
    if (gesture.kind === 'drag' && gesture.moved) {
      this.commit(this._state.graph);
      return;
    }
    if (gesture.kind === 'pan' && !gesture.moved) {
      this.selectEdge(gesture.edge);
    }
  }

  /** An edge dropped on a node joins it; dropped on empty space, it asks for a node there. */
  private connectAt(gesture: Extract<FlowGesture, { kind: 'connect' }>, event: PointerEvent): void {
    if (distance({ x: event.clientX, y: event.clientY }, gesture.start) <= CLICK_TOLERANCE) {
      return;
    }
    const at = this.worldPoint(event);
    const target = nodeAt(this._state.graph, at, gesture.node);
    if (!target) {
      const position = snap({ x: at.x - FLOW_NODE.width / 2, y: at.y });
      this.events.emit('add', { from: gesture.node, port: gesture.port, position });
      return;
    }
    const joined = connect(this._state.graph, {
      from: gesture.node,
      id: newId('e'),
      port: gesture.port,
      to: target.id,
    });
    if (joined) {
      this.commit(joined);
    }
  }

  private pressAdd(event: MouseEvent): void {
    const { add, node } = targetOf(event);
    if (add === undefined || node === undefined || this.readonly.get()) {
      return;
    }
    this.events.emit('add', { from: node, port: add, position: positionAfter(this._state.graph, node, add) });
  }

  private key(event: KeyboardEvent): void {
    const target = targetOf(event);
    if (target.control || target.add !== undefined) {
      return;
    }
    if (event.key === 'Escape') {
      this.select('');
      return;
    }
    if (this.readonly.get()) {
      return;
    }
    if (DELETE_KEYS.has(event.key)) {
      event.preventDefault();
      this.removeSelection();
      return;
    }
    this.nudge(event);
  }

  /** The arrows move the selected node; with Shift, further. */
  private nudge(event: KeyboardEvent): void {
    const arrow = ARROWS.get(event.key);
    const node = this.nodeOf(this.selected.get());
    if (!arrow || !node) {
      return;
    }
    event.preventDefault();
    const step = event.shiftKey ? LONG_NUDGE : NUDGE;
    const position = { x: node.position.x + arrow.x * step, y: node.position.y + arrow.y * step };
    this.commit(moveNode(this._state.graph, node.id, position));
    this.reveal(node.id);
  }

  /** Moves the view, when needed, so that a node is in sight: one just added, or moved with the keys. */
  private reveal(id: string): void {
    const node = this.nodeOf(id);
    const { width, height } = this._refs.viewport.getBoundingClientRect();
    if (!node || width === 0) {
      return;
    }
    this.setViewport(revealIn(this._state.viewport, node, width, height));
  }

  /** Two fingers or the wheel move the view; with Ctrl or ⌘ (a pinch on a trackpad), they zoom. */
  private wheel(event: WheelEvent): void {
    event.preventDefault();
    const viewport = this._state.viewport;
    if (event.ctrlKey || event.metaKey) {
      this.setViewport(zoomAt(viewport, this.screenPoint(event), Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED)));
      return;
    }
    this.setViewport({ ...viewport, x: viewport.x - event.deltaX, y: viewport.y - event.deltaY });
  }

  private zoomBy(factor: number): void {
    const { width, height } = this._refs.viewport.getBoundingClientRect();
    this.setViewport(zoomAt(this._state.viewport, { x: width / 2, y: height / 2 }, factor));
  }

  private setViewport(viewport: FlowViewport): void {
    this._state.viewport = viewport;
    this.applyViewport();
  }

  private applyViewport(): void {
    const { x, y, zoom } = this._state.viewport;
    const viewport = this._refs.viewport;
    this._refs.world.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    viewport.style.backgroundSize = `${DOT_SPACING * zoom}px ${DOT_SPACING * zoom}px`;
    viewport.style.backgroundPosition = `${x}px ${y}px`;
    this._refs.zoomLabel.textContent = `${Math.round(zoom * PERCENT)}%`;
  }

  private screenPoint(event: MouseEvent): FlowPoint {
    const rect = this._refs.viewport.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private worldPoint(event: MouseEvent): FlowPoint {
    return toWorld(this._state.viewport, this.screenPoint(event));
  }

  private render(): void {
    this._refs.empty.hidden = this._state.graph.nodes.length > 0;
    this.renderNodes();
    this.renderEdges();
  }

  /** The nodes' elements stay from one drawing to the next: the focused one keeps the focus. */
  private renderNodes(): void {
    const nodes = this._state.graph.nodes;
    const ids = new Set(nodes.map((node) => node.id));
    for (const [id, element] of this._nodes) {
      if (!ids.has(id)) {
        element.remove();
        this._nodes.delete(id);
      }
    }
    for (const node of nodes) {
      this.drawNode(this._nodes.get(node.id) ?? this.createNode(node.id), node);
    }
    this.renderSelection();
  }

  private createNode(id: string): HTMLElement {
    // A node is a group (it holds its exits' buttons) that takes the focus: to be selected, moved with the arrows and
    // removed with Delete. No HTML element is both.
    const element = (
      // biome-ignore lint/a11y/useSemanticElements: a fieldset is a form's group, not a node of a canvas
      <div
        class="node"
        data-node={id}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: see above
        tabIndex={0}
        role="group"
        aria-roledescription="node"
        attrs={{ part: 'node' }}
      />
    );
    this._nodes.set(id, element);
    this._refs.nodes.append(element);
    return element;
  }

  private drawNode(element: HTMLElement, node: FlowNode): void {
    const ports = portsOf(node);
    element.setAttribute('aria-label', node.label);
    element.part.toggle('start', node.start === true);
    setOrRemove(element, 'data-tone', node.tone ?? '');
    element.replaceChildren(
      <>
        {node.start === true ? null : <span class="input" />}
        {node.icon ? (
          <span class="icon" attrs={{ part: 'icon' }}>
            <JlIcon name={node.icon} size={ICON_SIZE} />
          </span>
        ) : null}
        <span class="text">
          <span class="label" attrs={{ part: 'label' }}>
            {node.label}
          </span>
          {node.description ? (
            <span class="description" attrs={{ part: 'description' }}>
              {node.description}
            </span>
          ) : null}
        </span>
        <span class="ports">{ports.map((port, index) => this.portElement(node, port, index, ports.length))}</span>
      </>
    );
    this.place(element, node.position);
  }

  private portElement(node: FlowNode, port: FlowPort, index: number, count: number): HTMLElement {
    const free = !this.readonly.get() && isPortFree(this._state.graph, node, port.id);
    const element = (
      <span class="port" data-port={port.id} title="Drag to another node to connect" attrs={{ part: 'port' }}>
        <span class="dot" />
        {port.label ? <span class="port-label">{port.label}</span> : null}
        {free ? (
          <button type="button" class="add" data-add={port.id} aria-label={addLabel(node, port)}>
            <JlIcon name="plus" size={ADD_ICON_SIZE} />
          </button>
        ) : null}
      </span>
    );
    element.style.left = `${portX(index, count)}px`;
    element.style.maxWidth = `${FLOW_NODE.width / count - PORT_GAP}px`;
    setOrRemove(element, 'data-tone', port.tone ?? '');
    return element;
  }

  private place(element: HTMLElement, position: FlowPoint): void {
    element.style.transform = `translate(${position.x}px, ${position.y}px)`;
  }

  private renderSelection(): void {
    const selected = this.selected.get();
    for (const [id, element] of this._nodes) {
      element.classList.toggle('selected', id === selected);
      element.part.toggle('selected', id === selected);
      setOrRemove(element, 'aria-current', id === selected ? 'true' : '');
    }
  }

  private renderEdges(): void {
    const { edge: selected, graph } = this._state;
    const groups = graph.edges.flatMap((edge) => {
      const ends = edgeEnds(graph, edge);
      return ends ? [this.edgeGroup(edge.id, ends, edge.id === selected)] : [];
    });
    this._svg.root.replaceChildren(...groups, this._svg.draft);
    this.renderEdgeTool();
  }

  /** An edge, with a wide invisible twin that catches the pointer: a thin line is still easy to press. */
  private edgeGroup(id: string, ends: FlowEdgeEnds, selected: boolean): SVGGElement {
    const d = edgePath(ends.from, ends.to);
    const group = svgElement('g', { class: selected ? 'edge-group selected' : 'edge-group', 'data-edge': id });
    group.append(
      svgElement('path', { class: 'edge-hit', d }),
      svgElement('path', { class: 'edge', d, 'data-tone': ends.tone, part: selected ? 'edge selected' : 'edge' })
    );
    return group;
  }

  /** The button that removes the selected edge, in its middle. */
  private renderEdgeTool(): void {
    const { edge: selected, graph } = this._state;
    const edge = graph.edges.find((candidate) => candidate.id === selected);
    const ends = edge ? edgeEnds(graph, edge) : undefined;
    const button = this._refs.removeEdge;
    button.hidden = ends === undefined || this.readonly.get();
    if (!ends) {
      return;
    }
    const middle = edgeMidpoint(ends.from, ends.to);
    button.style.transform = `translate(${middle.x}px, ${middle.y}px) translate(-50%, -50%)`;
  }
}

JlFlow.register();
