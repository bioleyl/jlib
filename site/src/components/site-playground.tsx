import { css } from '@jadis/core';
import {
  JlButton,
  JlCodeBlock,
  JlElement,
  JlInput,
  JlSegmented,
  JlSelect,
  JlSwitch,
  JlTextarea,
} from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { applyAttribute, defaultValue, formatDetail, isValidJson, prettyJson } from '../lib/playground';
import { htmlSnippet, jsxSnippet } from '../lib/snippets';
import { EXAMPLE_STYLES } from '../styles/site-styles';
import styles from './site-playground.css?raw';

import type { ComponentDoc, Control, PropDoc } from '../types/docs.types';

// The log keeps the latest events only.
const MAX_LOG = 8;

type ControlledProp = PropDoc & { attribute: string; control: Control };

const isControlled = (prop: PropDoc): prop is ControlledProp =>
  prop.attribute !== undefined && prop.control !== undefined;

type Attributes = Record<string, string | boolean>;

const CODE_TABS = [
  { label: 'HTML', value: 'html' },
  { label: 'JSX', value: 'jsx' },
];

// The width a block component gets on the stage when its docs do not say: a form's column, not the whole stage.
const BLOCK_WIDTH = 'min(100%, 440px)';
const INLINE_DISPLAYS = ['inline', 'inline-block', 'inline-flex', 'inline-grid', 'contents'];

/** Inline components keep their own width; block ones get the docs' width, or a column's. */
function stageWidth(doc: ComponentDoc, element: HTMLElement): string {
  const width = doc.playground.width;
  if (width === 'full') {
    return '100%';
  }
  if (width !== undefined) {
    return `min(100%, ${width}px)`;
  }
  return INLINE_DISPLAYS.includes(getComputedStyle(element).display) ? 'auto' : BLOCK_WIDTH;
}

/**
 * A live component with a control for each of its properties, the code that makes it as it stands, and the
 * events it fires. The controls set attributes on the live element: what is tested is what pages get.
 */
export class SitePlayground extends JlElement {
  static readonly selector = 'site-playground';

  /** The component's documentation, set as a property. */
  readonly doc = this.useChange<ComponentDoc | null>(null, () => this.build());

  private readonly _state = {
    attributes: {} as Attributes,
    element: null as HTMLElement | null,
    listeners: new AbortController(),
  };

  private readonly _refs = this.useRefs((ref) => ({
    empty: ref('.empty'),
    fields: ref('.fields'),
    html: ref<JlCodeBlock>('.html-code'),
    jsx: ref<JlCodeBlock>('.jsx-code'),
    log: ref('.log'),
    noControls: ref('.no-controls'),
    reset: ref<JlButton>('.reset'),
    stage: ref('.stage'),
    tabs: ref<JlSegmented>('.tabs'),
  }));

  templateHtml(): Node {
    return (
      <div class="playground">
        <div class="stage-area">
          <div class="stage" />
          <JlButton class="reset" variant="ghost" size="sm" icon="refresh" hint="Reset" />
        </div>
        <aside class="controls">
          <p class="label">Properties</p>
          <div class="fields" />
          <p class="no-controls" hidden>
            Nothing to set on this one: try the examples below.
          </p>
        </aside>
        <div class="code">
          <JlSegmented class="tabs" size="sm" label="Code" options={CODE_TABS} value="html" />
          <JlCodeBlock class="html-code" language="html" />
          <JlCodeBlock class="jsx-code" language="ts" hidden />
        </div>
        <div class="events">
          <p class="label">Events</p>
          <ol class="log" />
          <p class="empty">Use the component: its events show here.</p>
        </div>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${EXAMPLE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.reset.events.register('press', () => this.build());
    this._refs.tabs.events.register('change', (tab) => this.showTab(tab));
  }

  onDisconnect(): void {
    this._state.listeners.abort();
  }

  private build(): void {
    const doc = this.doc.get();
    if (doc === null) {
      return;
    }
    this._state.attributes = { ...doc.playground.attributes };
    this.renderStage(doc);
    this.renderControls(doc);
    this.renderCode();
    this.clearLog();
  }

  private renderStage(doc: ComponentDoc): void {
    this._state.listeners.abort();
    this._state.listeners = new AbortController();
    const element = document.createElement(doc.tag);
    for (const [name, value] of Object.entries(this._state.attributes)) {
      applyAttribute(element, name, value);
    }
    element.innerHTML = doc.playground.content ?? '';
    for (const event of doc.events ?? []) {
      element.addEventListener(event.name, (fired) => this.log(event.name, (fired as CustomEvent).detail), {
        signal: this._state.listeners.signal,
      });
    }
    const stage = this._refs.stage;
    stage.style.minHeight = doc.playground.height === undefined ? '' : `${doc.playground.height}px`;
    // A block holder: as a flex item of the stage, the element itself would be blockified and lose its display.
    const holder = <div class="holder">{element}</div>;
    stage.replaceChildren(holder);
    holder.style.width = stageWidth(doc, element);
    this._state.element = element;
    doc.playground.setup?.(element);
  }

  private renderControls(doc: ComponentDoc): void {
    const props = doc.props.filter(isControlled);
    this._refs.fields.replaceChildren(...props.map((prop) => this.field(prop)));
    this._refs.noControls.hidden = props.length > 0;
  }

  private field(prop: ControlledProp): HTMLElement {
    return (
      <div class="field">
        <span class="name">{prop.attribute}</span>
        {this.controlFor(prop)}
      </div>
    );
  }

  /** The control of one property, made of jlib's own fields. */
  private controlFor(prop: ControlledProp): HTMLElement {
    const value = this._state.attributes[prop.attribute] ?? defaultValue(prop.default);
    const text = typeof value === 'string' ? value : '';
    const set = (next: string | boolean): void => this.changeAttribute(prop.attribute, next);
    const makers: Record<Control['kind'], () => HTMLElement> = {
      boolean: () => {
        const toggle = (<JlSwitch size="sm" checked={value === true} />) as JlSwitch;
        toggle.events.register('change', (checked) => set(checked));
        return toggle;
      },
      json: () => {
        const area = (
          <JlTextarea
            class="json"
            value={prettyJson(text)}
            rows={4}
            autosize
            maxRows={14}
            label={prop.attribute}
          />
        ) as JlTextarea;
        area.events.register('input', (json) => {
          const valid = json.trim() === '' || isValidJson(json);
          area.invalid.set(!valid);
          if (valid) {
            set(json);
          }
        });
        return area;
      },
      number: () => {
        const input = (<JlInput type="number" size="sm" value={text} label={prop.attribute} />) as JlInput;
        if (prop.control.kind === 'number') {
          input.min.set(prop.control.min === undefined ? '' : String(prop.control.min));
          input.max.set(prop.control.max === undefined ? '' : String(prop.control.max));
          input.step.set(prop.control.step === undefined ? '' : String(prop.control.step));
        }
        input.events.register('input', (next) => set(next));
        return input;
      },
      select: () => {
        const options = prop.control.kind === 'select' ? prop.control.options : [];
        const select = (
          <JlSelect
            size="sm"
            value={text}
            label={prop.attribute}
            options={options.map((option) => ({ label: option, value: option }))}
          />
        ) as JlSelect;
        select.events.register('change', (next) => set(next));
        return select;
      },
      text: () => {
        const input = (<JlInput size="sm" value={text} label={prop.attribute} />) as JlInput;
        input.events.register('input', (next) => set(next));
        return input;
      },
    };
    return makers[prop.control.kind]();
  }

  /** Changes one attribute of the live element, and the code that shows it. */
  private changeAttribute(name: string, value: string | boolean): void {
    this._state.attributes[name] = value;
    if (this._state.element !== null) {
      applyAttribute(this._state.element, name, value);
    }
    this.renderCode();
  }

  private renderCode(): void {
    const doc = this.doc.get();
    if (doc === null) {
      return;
    }
    const source = {
      attributes: this._state.attributes,
      className: doc.className,
      content: doc.playground.content ?? '',
      props: doc.props,
      tag: doc.tag,
    };
    this._refs.html.code.set(htmlSnippet(source));
    this._refs.jsx.code.set(jsxSnippet(source));
  }

  private showTab(tab: string): void {
    this._refs.html.hidden = tab !== 'html';
    this._refs.jsx.hidden = tab !== 'jsx';
  }

  private log(name: string, detail: unknown): void {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = (
      <li>
        <span class="event-name">{name}</span>
        <code class="detail">{formatDetail(detail)}</code>
        <time>{time}</time>
      </li>
    );
    const log = this._refs.log;
    log.prepend(entry);
    while (log.childElementCount > MAX_LOG) {
      log.lastElementChild?.remove();
    }
    this._refs.empty.hidden = true;
  }

  private clearLog(): void {
    this._refs.log.replaceChildren();
    this._refs.empty.hidden = false;
  }
}

SitePlayground.register();
