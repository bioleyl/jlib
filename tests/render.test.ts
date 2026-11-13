// @vitest-environment happy-dom
// Render budget: what each component builds when it draws, and when its inputs change. Guards against the
// redraw regressions (a component rebuilding its children for every input, which froze the UI in 0.12).
// The budgets are the measured numbers: renders and nodes are exact, the input callbacks may fire fewer times.
import { Jadis } from '@jadis/core';
import { beforeAll, describe, expect, it } from 'vitest';

import { JlBadge } from '../src/atoms/jl-badge';
import { JlButton } from '../src/atoms/jl-button';
import { JlIcon } from '../src/atoms/jl-icon';
import { JlInput } from '../src/atoms/jl-input';
import { JlSelect } from '../src/atoms/jl-select';
import { JlCalendar } from '../src/molecules/jl-calendar';
import { JlChipGroup } from '../src/molecules/jl-chip-group';
import { JlMenu } from '../src/molecules/jl-menu';
import { JlTable } from '../src/organisms/jl-table';
import { JlTree } from '../src/organisms/jl-tree';

/** What one element (with the components it draws inside) built: template renders, input callbacks, nodes added. */
type Builds = { renders: number; changes: number; nodes: number };

const NO_BUILD = (): Builds => ({ changes: 0, nodes: 0, renders: 0 });

let builds = NO_BUILD();

beforeAll(() => {
  const prototype = Jadis.prototype as unknown as {
    renderTemplate: () => void;
    useChange: (
      value: unknown,
      onChange: (next: unknown, previous: unknown) => void,
      options?: unknown
    ) => unknown;
  };
  const renderTemplate = prototype.renderTemplate;
  const useChange = prototype.useChange;
  // Both are inherited by every jl-* element, so wrapping them on the prototype counts every component.
  prototype.renderTemplate = function (this: Jadis) {
    builds.renders += 1;
    renderTemplate.call(this);
  };
  prototype.useChange = function (
    this: Jadis,
    value: unknown,
    onChange: (next: unknown, previous: unknown) => void,
    options?: unknown
  ) {
    return useChange.call(
      this,
      value,
      (next: unknown, previous: unknown) => {
        builds.changes += 1;
        onChange(next, previous);
      },
      options
    );
  };
});

/** Puts an element in the page, watching what it builds, so a test can measure one step at a time. */
type Watched<Element extends HTMLElement> = {
  element: Element;
  /** Reads what the element built up to the next frame, and starts a new count. */
  measure: () => Promise<Builds>;
  remove: () => void;
};

function watch<Element extends HTMLElement>(tag: string): Watched<Element> {
  const element = document.createElement(tag) as Element;
  const observer = new MutationObserver((records) => {
    builds.nodes += records.reduce((total, record) => total + record.addedNodes.length, 0);
  });
  builds = NO_BUILD();
  document.body.append(element);
  observer.observe(element.shadowRoot ?? element, { childList: true, subtree: true });
  return {
    element,
    async measure() {
      await new Promise((resolve) => setTimeout(resolve, 0));
      const measured = builds;
      builds = NO_BUILD();
      return measured;
    },
    remove() {
      observer.disconnect();
      element.remove();
    },
  };
}

/** The budget of each draw: a component over it means something builds its children again. */
function expectBuild(measured: Builds, budget: Builds): void {
  expect(measured.renders).toBe(budget.renders);
  expect(measured.nodes).toBe(budget.nodes);
  expect(measured.changes).toBeLessThanOrEqual(budget.changes);
}

const COLUMNS = JSON.stringify([
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { format: 'number', key: 'seats', label: 'Seats' },
]);
const ROWS = Array.from({ length: 25 }, (_, index) => ({
  city: 'Lyon',
  id: `r${index}`,
  name: `Row ${index}`,
  seats: index,
}));
const OPTIONS = Array.from({ length: 10 }, (_, index) => ({ label: `Option ${index}`, value: `o${index}` }));
const TREE_ITEMS = [
  {
    children: [
      { id: 'a1', label: 'main.ts' },
      { id: 'a2', label: 'app.ts' },
    ],
    id: 'a',
    label: 'Sources',
  },
  { children: [{ id: 'b1', label: 'index.md' }], id: 'b', label: 'Docs' },
];

describe('render budget', () => {
  it('jl-icon draws one svg', async () => {
    const icon = watch<JlIcon>('jl-icon');
    icon.element.name.set('x');
    expectBuild(await icon.measure(), { changes: 5, nodes: 1, renders: 1 });
    icon.remove();
  });

  it('jl-button draws its label, icon and press feedback once', async () => {
    const button = watch<JlButton>('jl-button');
    button.element.label.set('Save');
    button.element.icon.set('save');
    button.element.variant.set('primary');
    expectBuild(await button.measure(), { changes: 33, nodes: 1, renders: 4 });
    button.remove();
  });

  it('jl-badge draws its parts once', async () => {
    const badge = watch<JlBadge>('jl-badge');
    badge.element.showStatus({ label: 'Shipped', tone: 'ok' });
    expectBuild(await badge.measure(), { changes: 19, nodes: 2, renders: 2 });
    badge.remove();
  });

  it('jl-input builds its native field once', async () => {
    const input = watch<JlInput>('jl-input');
    input.element.label.set('Name');
    input.element.value.set('Mila');
    input.element.icon.set('user');
    expectBuild(await input.measure(), { changes: 38, nodes: 0, renders: 4 });
    input.remove();
  });

  it('jl-select builds its 10 options once', async () => {
    const select = watch<JlSelect>('jl-select');
    select.element.options.set(OPTIONS);
    select.element.value.set('o3');
    expectBuild(await select.measure(), { changes: 17, nodes: 10, renders: 2 });
    select.remove();
  });

  it('jl-chip-group builds its 10 chips once', async () => {
    const group = watch<JlChipGroup>('jl-chip-group');
    group.element.options.set(OPTIONS);
    group.element.value.set(['o2']);
    expectBuild(await group.measure(), { changes: 52, nodes: 10, renders: 11 });
    group.remove();
  });

  it('jl-menu builds its 10 items once', async () => {
    const menu = watch<JlMenu>('jl-menu');
    menu.element.items.set(OPTIONS);
    expectBuild(await menu.measure(), { changes: 4, nodes: 0, renders: 1 });
    menu.remove();
  });

  it('jl-calendar builds its month grid once', async () => {
    const calendar = watch<JlCalendar>('jl-calendar');
    calendar.element.value.set('2026-03-10');
    expectBuild(await calendar.measure(), { changes: 22, nodes: 43, renders: 3 });
    calendar.remove();
  });

  it('jl-table builds its 25 rows once', async () => {
    const table = watch<JlTable>('jl-table');
    table.element.columns.set(JSON.parse(COLUMNS));
    table.element.rows.set(ROWS);
    expectBuild(await table.measure(), { changes: 18, nodes: 26, renders: 1 });
    table.remove();
  });

  it('jl-tree builds its expanded folder once', async () => {
    const tree = watch<JlTree>('jl-tree');
    tree.element.items.set(TREE_ITEMS);
    tree.element.expanded.set(['a']);
    expectBuild(await tree.measure(), { changes: 42, nodes: 2, renders: 8 });
    tree.remove();
  });
});

describe('render budget on a burst of state changes', () => {
  it('jl-table keeps its rows when the selection, the marks and the sort change', async () => {
    const table = watch<JlTable>(JlTable.selector);
    table.element.columns.set(JSON.parse(COLUMNS));
    table.element.rows.set(ROWS);
    await table.measure();
    const rowBefore = table.element.shadowRoot?.querySelector('tr[data-index="0"]');
    table.element.selected.set(['r2']);
    table.element.marked.set(['r1']);
    table.element.sortKey.set('city');
    table.element.sortDirection.set('desc');
    expectBuild(await table.measure(), { changes: 4, nodes: 0, renders: 0 });
    expect(table.element.shadowRoot?.querySelector('tr[data-index="0"]')).toBe(rowBefore);
    table.remove();
  });

  it('jl-select keeps its option elements when the value changes', async () => {
    const select = watch<JlSelect>(JlSelect.selector);
    select.element.options.set(OPTIONS);
    await select.measure();
    const native = select.element.shadowRoot?.querySelector('select');
    const firstOption = native?.options[0];
    select.element.value.set('o7');
    expectBuild(await select.measure(), { changes: 1, nodes: 0, renders: 0 });
    expect(native?.options[0]).toBe(firstOption);
    select.remove();
  });

  it('jl-tree keeps its rows when a folder opens', async () => {
    const tree = watch<JlTree>(JlTree.selector);
    tree.element.items.set(TREE_ITEMS);
    await tree.measure();
    const rowsBefore = tree.element.shadowRoot?.querySelectorAll('tr').length;
    tree.element.expanded.set(['a']);
    expectBuild(await tree.measure(), { changes: 2, nodes: 0, renders: 0 });
    expect(tree.element.shadowRoot?.querySelectorAll('tr').length).toBe(rowsBefore);
    tree.remove();
  });
});

describe('registered classes', () => {
  it('registers every component the suite creates', () => {
    for (const component of [
      JlIcon,
      JlButton,
      JlBadge,
      JlInput,
      JlSelect,
      JlChipGroup,
      JlMenu,
      JlCalendar,
      JlTable,
      JlTree,
    ]) {
      expect(customElements.get(component.selector)).toBe(component);
    }
  });
});
