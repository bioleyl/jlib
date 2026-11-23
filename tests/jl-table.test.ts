// @vitest-environment jsdom
// jl-table as an app's tests meet it, in jsdom: sorting left to the page, hidden columns and the column chooser.
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { jlTexts } from '../src/lib/texts';
import { JlTable } from '../src/organisms/jl-table';

import type { JlButton } from '../src/atoms/jl-button';
import type { JlCheckbox } from '../src/atoms/jl-checkbox';
import type { JlIcon } from '../src/atoms/jl-icon';
import type { JlPopover } from '../src/molecules/jl-popover';
import type { TableColumn, TableSort } from '../src/types/jl-table.types';

type Member = { id: number; name: string; email: string; role: string };

const MEMBERS: Member[] = [
  { email: 'chen@acme.dev', id: 3, name: 'Chen', role: 'Viewer' },
  { email: 'ada@acme.dev', id: 1, name: 'Ada', role: 'Owner' },
  { email: 'ben@acme.dev', id: 2, name: 'Ben', role: 'Editor' },
];

const COLUMNS: TableColumn<Member>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role' },
];

const LOCKED_NAME: TableColumn<Member>[] = [
  { hideable: false, key: 'name', label: 'Name', sortable: true },
  ...COLUMNS.slice(1),
];

const POPOVER_OPEN = ':popover-open';

/** A popover's toggle event, saying the state it goes to, as a browser sends it. */
const toggleEvent = (type: string, open: boolean): Event =>
  Object.assign(new Event(type), { newState: open ? 'open' : 'closed', oldState: open ? 'closed' : 'open' });

/**
 * What jsdom lacks that the chooser uses: the popover API (shown, hidden, `:popover-open`, `beforetoggle` before
 * the change and `toggle` a task after it; no light dismiss) and `checkVisibility`.
 */
function fillBrowserGaps(): void {
  const shown = new WeakSet<Element>();
  const toggle = (popover: HTMLElement, open: boolean): void => {
    if (shown.has(popover) === open) {
      return;
    }
    popover.dispatchEvent(toggleEvent('beforetoggle', open));
    open ? shown.add(popover) : shown.delete(popover);
    setTimeout(() => popover.dispatchEvent(toggleEvent('toggle', open)));
  };
  HTMLElement.prototype.matches = function matches(this: HTMLElement, selectors: string) {
    return selectors === POPOVER_OPEN ? shown.has(this) : Element.prototype.matches.call(this, selectors);
  } as HTMLElement['matches'];
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    toggle(this, true);
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    toggle(this, false);
  };
  Element.prototype.checkVisibility = () => true;
}

/** Lets the table draw what it queued: its inputs draw on a microtask, onConnect and the popover's toggle a task later. */
const settle = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve));
  await new Promise((resolve) => setTimeout(resolve));
};

async function mountTable(setup: (table: JlTable<Member>) => void): Promise<JlTable<Member>> {
  const table = new JlTable<Member>();
  table.columns.set(COLUMNS);
  table.rows.set(MEMBERS);
  setup(table);
  document.body.append(table);
  await settle();
  return table;
}

function rootOf(table: JlTable<Member>): ShadowRoot {
  if (table.shadowRoot === null) {
    throw new Error('The table has no shadow root');
  }
  return table.shadowRoot;
}

/** The names of the rows, in the order shown. */
const shownNames = (table: JlTable<Member>): string[] =>
  [...rootOf(table).querySelectorAll('tbody tr[data-index]')].map(
    (row) => row.querySelector('td[class*="format-"]')?.textContent ?? ''
  );

const headerKeys = (table: JlTable<Member>): string[] =>
  [...rootOf(table).querySelectorAll<HTMLElement>('thead th[data-key]')].map((cell) => cell.dataset.key ?? '');

const cellCount = (table: JlTable<Member>): number =>
  rootOf(table).querySelectorAll('tbody tr[data-index="0"] td[class*="format-"]').length;

const headerOf = (table: JlTable<Member>, key: string): HTMLElement | null =>
  rootOf(table).querySelector<HTMLElement>(`thead th[data-key="${key}"]`);

async function pressHeader(table: JlTable<Member>, key: string): Promise<void> {
  rootOf(table).querySelector<HTMLButtonElement>(`button.sort[data-key="${key}"]`)?.click();
  await settle();
}

const popoverOf = (table: JlTable<Member>): JlPopover | null =>
  rootOf(table).querySelector<JlPopover>('jl-popover');
const chooserButton = (table: JlTable<Member>): JlButton | null =>
  rootOf(table).querySelector<JlButton>('.chooser jl-button');
const boxesOf = (table: JlTable<Member>): JlCheckbox[] => [
  ...rootOf(table).querySelectorAll<JlCheckbox>('.column-list jl-checkbox'),
];

/** Ticks or clears a box as a click on it would: through its native checkbox. */
async function pressBox(box: JlCheckbox | undefined): Promise<void> {
  box?.shadowRoot?.querySelector('input')?.click();
  await settle();
}

describe('jl-table, sorted by the page', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('shows the sort and emits it on a heading press, the rows staying in the order given', async () => {
    const table = await mountTable((created) => created.sortMode.set('remote'));
    const heard: TableSort<Member>[] = [];
    table.events.register('sort', (sort) => heard.push(sort));

    await pressHeader(table, 'name');
    expect(shownNames(table)).toEqual(['Chen', 'Ada', 'Ben']);
    expect(headerOf(table, 'name')?.getAttribute('aria-sort')).toBe('ascending');
    expect(headerOf(table, 'name')?.querySelector<JlIcon>('.sort-icon')?.name.get()).toBe('arrow-up');

    await pressHeader(table, 'name');
    expect(shownNames(table)).toEqual(['Chen', 'Ada', 'Ben']);
    expect(headerOf(table, 'name')?.getAttribute('aria-sort')).toBe('descending');
    expect(heard).toEqual([
      { direction: 'asc', key: 'name' },
      { direction: 'desc', key: 'name' },
    ]);
  });

  it('shows the rows the page gives next in its order, never sorting them again', async () => {
    const table = await mountTable((created) => {
      created.sortMode.set('remote');
      created.sortKey.set('name');
      created.sortDirection.set('desc');
    });
    expect(shownNames(table)).toEqual(['Chen', 'Ada', 'Ben']);

    table.rows.set([...MEMBERS].sort((a, b) => a.name.localeCompare(b.name)));
    await settle();
    expect(shownNames(table)).toEqual(['Ada', 'Ben', 'Chen']);
  });

  it('emits nothing when the page sets the sort, and shows it', async () => {
    const table = await mountTable((created) => created.sortMode.set('remote'));
    const heard: TableSort<Member>[] = [];
    table.events.register('sort', (sort) => heard.push(sort));

    table.sortKey.set('email');
    table.sortDirection.set('asc');
    await settle();
    expect(heard).toEqual([]);
    expect(headerOf(table, 'email')?.getAttribute('aria-sort')).toBe('ascending');
    expect(shownNames(table)).toEqual(['Chen', 'Ada', 'Ben']);
  });

  it('reads the mode from its attribute', async () => {
    const table = await mountTable((created) => created.setAttribute('sort-mode', 'remote'));
    await pressHeader(table, 'name');
    expect(table.sortMode.get()).toBe('remote');
    expect(shownNames(table)).toEqual(['Chen', 'Ada', 'Ben']);
  });

  it('sorts the rows itself in local mode, the default', async () => {
    const table = await mountTable(() => undefined);
    const heard: TableSort<Member>[] = [];
    table.events.register('sort', (sort) => heard.push(sort));

    await pressHeader(table, 'name');
    expect(table.sortMode.get()).toBe('local');
    expect(shownNames(table)).toEqual(['Ada', 'Ben', 'Chen']);
    expect(heard).toEqual([{ direction: 'asc', key: 'name' }]);
  });
});

describe('jl-table, hidden columns', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('draws neither the heading nor the cells of a hidden column', async () => {
    const table = await mountTable((created) => created.hiddenColumns.set(['email']));
    expect(headerKeys(table)).toEqual(['name', 'role']);
    expect(cellCount(table)).toBe(2);
  });

  it('reads them from its attribute, a JSON list or a single key', async () => {
    const listed = await mountTable((created) => created.setAttribute('hidden-columns', '["email","role"]'));
    expect(headerKeys(listed)).toEqual(['name']);
    const single = await mountTable((created) => created.setAttribute('hidden-columns', 'email'));
    expect(headerKeys(single)).toEqual(['name', 'role']);
  });

  it('keeps a column that cannot be hidden', async () => {
    const table = await mountTable((created) => {
      created.columns.set(LOCKED_NAME);
      created.hiddenColumns.set(['name', 'role']);
    });
    expect(headerKeys(table)).toEqual(['name', 'email']);
  });

  it('keeps the selection, the open rows and the sort when they change', async () => {
    const table = await mountTable((created) => {
      created.selectable.set(true);
      created.selected.set([1]);
      created.expandable.set('single');
      created.expanded.set([2]);
      created.detail = (member) => document.createTextNode(`More on ${member.name}`);
      created.sortKey.set('name');
      created.sortDirection.set('asc');
    });

    table.hiddenColumns.set(['role']);
    await settle();
    expect(headerKeys(table)).toEqual(['name', 'email']);
    expect(shownNames(table)).toEqual(['Ada', 'Ben', 'Chen']);
    expect(headerOf(table, 'name')?.getAttribute('aria-sort')).toBe('ascending');
    // jsdom finds no `:scope >` match in the rows, so a row's own box stays clear there: the header's box tells.
    expect(table.selected.get()).toEqual([1]);
    expect(rootOf(table).querySelector<HTMLInputElement>('thead .checkbox')?.indeterminate).toBe(true);
    expect(rootOf(table).querySelector('tbody tr.detail')?.textContent).toBe('More on Ben');
  });

  it('keeps the sort of a column it hides, and shows it when the column comes back', async () => {
    const table = await mountTable((created) => {
      created.sortKey.set('name');
      created.sortDirection.set('desc');
    });

    table.hiddenColumns.set(['name']);
    await settle();
    expect(table.sortKey.get()).toBe('name');
    expect(rootOf(table).querySelectorAll('tbody tr[data-index]')[0]?.textContent).toContain('chen@acme.dev');

    table.hiddenColumns.set([]);
    await settle();
    expect(shownNames(table)).toEqual(['Chen', 'Ben', 'Ada']);
    expect(headerOf(table, 'name')?.getAttribute('aria-sort')).toBe('descending');
  });
});

describe('jl-table, the column chooser', () => {
  beforeAll(fillBrowserGaps);

  afterEach(async () => {
    document.body.replaceChildren();
    await jlTexts.setLocale('en');
  });

  it('builds no chooser unless asked', async () => {
    const table = await mountTable(() => undefined);
    expect(popoverOf(table)).toBeNull();
  });

  it('lists the columns in their order, by label, the shown ones ticked', async () => {
    const table = await mountTable((created) => {
      created.columnChooser.set(true);
      created.hiddenColumns.set(['email']);
    });
    expect(boxesOf(table).map((box) => box.label.get())).toEqual(['Name', 'Email', 'Role']);
    expect(boxesOf(table).map((box) => box.checked.get())).toEqual([true, false, true]);
  });

  it('hides and shows a column as its box is cleared and ticked, and emits the hidden keys', async () => {
    const table = await mountTable((created) => created.setAttribute('column-chooser', ''));
    const heard: string[][] = [];
    table.events.register('columns', (hidden) => heard.push(hidden));

    await pressBox(boxesOf(table)[2]);
    expect(headerKeys(table)).toEqual(['name', 'email']);
    expect(table.hiddenColumns.get()).toEqual(['role']);

    await pressBox(boxesOf(table)[2]);
    expect(headerKeys(table)).toEqual(['name', 'email', 'role']);
    expect(heard).toEqual([['role'], []]);
  });

  it('ticks the boxes again when the page changes the hidden columns, the boxes staying', async () => {
    const table = await mountTable((created) => created.columnChooser.set(true));
    const [name] = boxesOf(table);

    table.hiddenColumns.set(['name']);
    await settle();
    expect(boxesOf(table)[0]).toBe(name);
    expect(name?.checked.get()).toBe(false);
  });

  it('will not hide the last column shown', async () => {
    const table = await mountTable((created) => {
      created.columnChooser.set(true);
      created.hiddenColumns.set(['email']);
    });

    await pressBox(boxesOf(table)[2]);
    const [name, email, role] = boxesOf(table);
    expect([name?.checked.get(), name?.disabled.get()]).toEqual([true, true]);
    expect([email?.disabled.get(), role?.disabled.get()]).toEqual([false, false]);
  });

  it('shows a column that cannot be hidden ticked and off', async () => {
    const table = await mountTable((created) => {
      created.columns.set(LOCKED_NAME);
      created.columnChooser.set(true);
      created.hiddenColumns.set(['name']);
    });
    const [name] = boxesOf(table);
    expect([name?.checked.get(), name?.disabled.get()]).toEqual([true, true]);
  });

  it('names its button and its list, in jlib’s language or as the page says', async () => {
    const table = await mountTable((created) => created.columnChooser.set(true));
    const control = (): Element | null | undefined => chooserButton(table)?.shadowRoot?.querySelector('button');
    const list = rootOf(table).querySelector('.column-list');
    expect(control()?.getAttribute('aria-label')).toBe('Columns');
    expect(list?.getAttribute('aria-label')).toBe('Columns');
    expect(popoverOf(table)?.heading.get()).toBe('Columns');

    await jlTexts.setLocale('fr');
    await settle();
    expect(control()?.getAttribute('aria-label')).toBe('Colonnes');

    table.columnsLabel.set('Fields');
    expect(control()?.getAttribute('aria-label')).toBe('Fields');
    expect(list?.getAttribute('aria-label')).toBe('Fields');
  });

  // The focus as it opens, the keys and Escape are the browser's: the e2e suite presses them in Chromium. jsdom takes
  // every jl-* control for disabled (`:disabled` reads their `disabled` input, an object), so it would focus none.
  it('opens from its button, stays open as boxes change, and gives the focus back to its button when it closes', async () => {
    const table = await mountTable((created) => created.columnChooser.set(true));

    chooserButton(table)?.click();
    await settle();
    expect(popoverOf(table)?.open.get()).toBe(true);

    boxesOf(table)[1]?.focus();
    await pressBox(boxesOf(table)[1]);
    expect(headerKeys(table)).toEqual(['name', 'role']);
    expect(popoverOf(table)?.open.get()).toBe(true);

    popoverOf(table)?.hide();
    await settle();
    expect(rootOf(table).activeElement).toBe(chooserButton(table));
  });
});
