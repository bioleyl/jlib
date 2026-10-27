import { css } from '@jadis/core';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { define } from '../lib/define';
import { setOrRemove, uniqueId } from '../lib/dom';
import { moveIndicator } from '../lib/indicator';
import { watchSizes } from '../lib/resize';
import { firstIndex, lastIndex, stepIndex } from '../lib/roving';
import { BASE_STYLES } from '../styles/shared';
import { JlTabPanel } from './jl-tab-panel';
import styles from './jl-tabs.css?raw';

import type { TabsVariant } from '../types/jl-tabs.types';

export const TAB_VARIANTS: readonly TabsVariant[] = ['line', 'pill'];

define(JlTabPanel);

const ICON_SIZE = 16;
// The panel attributes a tab shows: a change to one of them redraws the tabs.
const PANEL_ATTRIBUTES = ['name', 'label', 'icon', 'badge', 'disabled'];

type KeyMove = (enabled: readonly boolean[], from: number) => number;

// Keyboard keys are PascalCase names: a Map keeps them as they are.
const KEY_MOVES = new Map<string, KeyMove>([
  ['ArrowLeft', (enabled, from) => stepIndex(enabled, from, -1)],
  ['ArrowRight', (enabled, from) => stepIndex(enabled, from, 1)],
  ['End', lastIndex],
  ['Home', firstIndex],
]);

const isPanel = (element: Element): element is HTMLElement => element.localName === JlTabPanel.selector;

/** A panel's name for `value`: its `name`, or its position when it has none. */
const panelName = (panel: HTMLElement, index: number): string => panel.getAttribute('name') || String(index);

const isDisabled = (panel: HTMLElement): boolean => panel.hasAttribute('disabled');

/**
 * Tabs over panels: the `jl-tab-panel` children make the tabs, and one panel shows at a time. `value` is the open
 * panel's name (the first panel by default); `change` fires with the name when people pick another tab.
 */
export class JlTabs extends JlElement {
  static readonly selector = 'jl-tabs';

  readonly events = this.useEvents<{ change: string }>();

  readonly value = this.useChange('', () => this.render(), { attribute: 'value' });
  readonly variant = this.useChange<TabsVariant>(
    'line',
    (value) => {
      this.reflect('variant', value);
      this.placeIndicator();
    },
    { attribute: 'variant', parse: oneOf(TAB_VARIANTS, 'line') }
  );
  /** The tabs share the whole width. */
  readonly block = this.useChange(
    false,
    (value) => {
      this.reflect('block', value);
      this.placeIndicator();
    },
    { attribute: 'block' }
  );
  /** The tab list's name for screen readers, when the page has no heading that says it. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.list, 'aria-label', value), {
    attribute: 'label',
  });

  private readonly _observers = {
    mutations: new MutationObserver((records) => this.onMutations(records)),
    resize: watchSizes(() => this.placeIndicator()),
  };

  private readonly _refs = this.useRefs((ref) => ({
    indicator: ref('.indicator'),
    list: ref('.list'),
  }));

  templateHtml(): Node {
    return (
      <div class="tabs" attrs={{ part: 'base' }}>
        <div class="scroller">
          <div class="list" role="tablist" />
          <span class="indicator" aria-hidden="true" hidden />
        </div>
        <div class="panels">
          <slot />
        </div>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.render();
    this._observers.mutations.observe(this, {
      attributeFilter: PANEL_ATTRIBUTES,
      attributes: true,
      childList: true,
      subtree: true,
    });
    this._observers.resize.observe(this._refs.list);
    this.on(this._refs.list, 'click', (event) => {
      const tab = (event.target as Element).closest<HTMLElement>('[role="tab"]');
      if (tab !== null) {
        this.choose(this.tabs().indexOf(tab), false);
      }
    });
    this.on(this._refs.list, 'keydown', (event) => this.onKeydown(event));
  }

  onDisconnect(): void {
    this._observers.mutations.disconnect();
    this._observers.resize.disconnect();
  }

  private panels(): HTMLElement[] {
    return [...this.children].filter(isPanel);
  }

  private tabs(): HTMLElement[] {
    return [...this._refs.list.children] as HTMLElement[];
  }

  /** Only the tabs' own panels matter, not the attributes of what the panels hold. */
  private onMutations(records: MutationRecord[]): void {
    const concernsPanels = records.some(
      (record) => record.target === this || (record.target as Element).parentElement === this
    );
    if (concernsPanels) {
      this.render();
    }
  }

  /** The index of the open panel: the one `value` names, or the first that can open. */
  private selectedIndex(panels: HTMLElement[]): number {
    const value = this.value.get();
    const named = panels.findIndex((panel, index) => panelName(panel, index) === value && !isDisabled(panel));
    return named === -1 ? panels.findIndex((panel) => !isDisabled(panel)) : named;
  }

  private render(): void {
    const panels = this.panels();
    this.syncTabCount(panels.length);
    const selected = this.selectedIndex(panels);
    const tabs = this.tabs();
    panels.forEach((panel, index) => {
      const tab = tabs[index];
      if (tab !== undefined) {
        this.renderTab(tab, panel, index === selected);
      }
    });
    this.placeIndicator();
  }

  /** Adds or removes tab buttons to match the panels; the buttons left keep their focus. */
  private syncTabCount(count: number): void {
    const list = this._refs.list;
    while (list.childElementCount > count) {
      list.lastElementChild?.remove();
    }
    while (list.childElementCount < count) {
      list.append(<button type="button" role="tab" class="tab" id={uniqueId('jl-tab')} />);
    }
  }

  private renderTab(tab: HTMLElement, panel: HTMLElement, selected: boolean): void {
    const icon = panel.getAttribute('icon') ?? '';
    const badge = panel.getAttribute('badge') ?? '';
    tab.replaceChildren(
      icon === '' ? '' : <JlIcon name={icon} size={ICON_SIZE} />,
      <span class="label">{panel.getAttribute('label') ?? ''}</span>,
      badge === '' ? '' : <span class="badge">{badge}</span>
    );
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    tab.toggleAttribute('aria-disabled', isDisabled(panel));
    if (panel.id === '') {
      panel.id = uniqueId('jl-tab-panel');
    }
    // The panel lives outside this shadow root: an id reference cannot reach it, the element reference can.
    tab.ariaControlsElements = [panel];
    panel.toggleAttribute('selected', selected);
    panel.tabIndex = 0;
  }

  private placeIndicator(): void {
    const selected = this.tabs().find((tab) => tab.getAttribute('aria-selected') === 'true') ?? null;
    moveIndicator(this._refs.indicator, selected);
  }

  private onKeydown(event: KeyboardEvent): void {
    const move = KEY_MOVES.get(event.key);
    const tabs = this.tabs();
    const from = tabs.indexOf(event.target as HTMLElement);
    if (move === undefined || from === -1) {
      return;
    }
    event.preventDefault();
    const enabled = tabs.map((tab) => !tab.hasAttribute('aria-disabled'));
    this.choose(move(enabled, from), true);
  }

  /** Opens the panel of a tab people picked, and says so. */
  private choose(index: number, focus: boolean): void {
    const panels = this.panels();
    const panel = panels[index];
    const tab = this.tabs()[index];
    if (panel === undefined || tab === undefined || isDisabled(panel)) {
      return;
    }
    if (focus) {
      tab.focus();
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    if (index === this.selectedIndex(panels)) {
      return;
    }
    const name = panelName(panel, index);
    this.value.set(name);
    this.events.emit('change', name);
  }
}

JlTabs.register();
