/** The atomic level of a component: one element, a few with one job, a section with behaviour, or a layout. */
export type Level = 'atom' | 'molecule' | 'organism' | 'template';

/** How the playground lets people change a property. */
export type Control =
  | { kind: 'text' }
  | { kind: 'boolean' }
  | { kind: 'number'; min?: number; max?: number; step?: number }
  | { kind: 'select'; options: readonly string[] }
  /** A list or an object, edited as JSON and written to the attribute as JSON. */
  | { kind: 'json' };

export type PropDoc = {
  /** The JavaScript property: `iconEnd`. */
  name: string;
  /** The HTML attribute bound to it: `icon-end`. Absent for a property that has none. */
  attribute?: string;
  /** The TypeScript type, as text: `'sm' | 'md' | 'lg'`. */
  type: string;
  /** The default value, as code: `'md'`, `false`, `[]`. */
  default: string;
  description: string;
  /** Shown in the playground when given. */
  control?: Control;
};

export type EventDoc = {
  name: string;
  /** The type of the event's detail, as text: `string`, `undefined`. */
  detail: string;
  description: string;
};

export type SlotDoc = {
  /** `''` for the default slot. */
  name: string;
  description: string;
};

export type MethodDoc = {
  name: string;
  /** `show(): void`. */
  signature: string;
  description: string;
};

export type StyleDoc = {
  /** A CSS custom property (`--width`) or a part (`base`). */
  name: string;
  description: string;
};

export type Example = {
  title: string;
  description?: string;
  /** Rendered as it is, and shown as the example's code. */
  html: string;
  /** Wiring once the HTML is in the page: open a dialog on a press, fill a table. */
  setup?: (root: HTMLElement) => void;
  /** The code shown for `setup`. */
  script?: string;
};

export type Playground = {
  /** The attributes the element starts with; the controls change them live. */
  attributes: Record<string, string | boolean>;
  /** Children of the element (slotted content), as HTML. */
  content?: string;
  /** Wiring once the element is in the page, as for examples. */
  setup?: (element: HTMLElement) => void;
  /** A taller stage, in pixels, for what needs room. */
  height?: number;
  /**
   * The element's width on the stage, in pixels or the whole stage. Without it, inline components keep their own
   * width and block ones get a column of 440 pixels.
   */
  width?: number | 'full';
};

/**
 * A component typed by what it holds (its values, its rows): how a page writes it. The snippets are files that
 * TypeScript checks, shown without their lines marked `// (not shown)`.
 */
export type TypingDoc = {
  /** What the type parameter is, and what TypeScript then checks. */
  description: string;
  /** The typed form in code, without JSX: a query with the type, then its inputs and events. */
  code: string;
  /** The typed form in a view written in JSX. */
  jsx: string;
};

export type ComponentDoc = {
  tag: `jl-${string}`;
  className: string;
  /** The display name: `Button`, `Copy button`. */
  name: string;
  level: Level;
  /** One sentence: what it is for. */
  summary: string;
  /** More about when and how to use it; paragraphs separated by blank lines. */
  description?: string;
  playground: Playground;
  props: PropDoc[];
  events?: EventDoc[];
  slots?: SlotDoc[];
  methods?: MethodDoc[];
  /** CSS custom properties read on the host, and the `part`s exposed for `::part()`. */
  styling?: StyleDoc[];
  examples: Example[];
  /** For a component typed by what it holds: how a page writes it typed. */
  typing?: TypingDoc;
};
