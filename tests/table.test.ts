import { describe, expect, it } from 'vitest';

import {
  cellOf,
  columnAlign,
  columnChoices,
  columnWidth,
  compareCells,
  formatCell,
  frozenCells,
  frozenCss,
  nextSortDirection,
  openRows,
  rowKeyOf,
  rowToggles,
  selectionState,
  shownColumns,
  sortRows,
  stickyOffsets,
  toggleAll,
  toggleKey,
  withRowOpen,
} from '../src/lib/table';

const LOCALE = 'en-US';

const ids = (rows: Record<string, unknown>[]): unknown[] => rows.map((row) => row.id);

describe('nextSortDirection', () => {
  it('cycles ascending, descending, none', () => {
    expect(nextSortDirection('none')).toBe('asc');
    expect(nextSortDirection('asc')).toBe('desc');
    expect(nextSortDirection('desc')).toBe('none');
  });
});

describe('compareCells', () => {
  it('compares numbers by value, not as text', () => {
    expect(compareCells(9, 10, 'number')).toBeLessThan(0);
    expect(compareCells('9', '10', 'number')).toBeLessThan(0);
  });

  it('compares dates by time', () => {
    expect(compareCells('2024-03-01', '2023-12-31', 'date')).toBeGreaterThan(0);
    expect(compareCells(new Date(2020, 0, 1), '2021-01-01', 'date')).toBeLessThan(0);
  });

  it('compares text with localeCompare, numbers inside it by value', () => {
    expect(compareCells('apple', 'Banana', 'text', LOCALE)).toBeLessThan(0);
    expect(compareCells('Item 2', 'Item 10', 'text', LOCALE)).toBeLessThan(0);
    expect(compareCells('éclair', 'fudge', 'text', LOCALE)).toBeLessThan(0);
  });

  it('puts empty and unreadable values last', () => {
    expect(compareCells('', 'a', 'text')).toBeGreaterThan(0);
    expect(compareCells(null, 3, 'number')).toBeGreaterThan(0);
    expect(compareCells('not a date', '2024-01-01', 'date')).toBeGreaterThan(0);
  });
});

describe('sortRows', () => {
  const rows = [
    { id: 'a', joined: '2024-05-02', name: 'Mila', seats: 12 },
    { id: 'b', joined: '2023-01-15', name: 'ada', seats: 3 },
    { id: 'c', joined: '', name: 'Zoë', seats: null },
    { id: 'd', joined: '2024-01-20', name: 'Ben', seats: 100 },
  ];

  it('sorts numbers both ways, with empty values at the end', () => {
    expect(ids(sortRows(rows, 'seats', 'asc', 'number'))).toEqual(['b', 'a', 'd', 'c']);
    expect(ids(sortRows(rows, 'seats', 'desc', 'number'))).toEqual(['d', 'a', 'b', 'c']);
  });

  it('sorts dates by time', () => {
    expect(ids(sortRows(rows, 'joined', 'asc', 'date'))).toEqual(['b', 'd', 'a', 'c']);
  });

  it('sorts numbers by value in a column that names no format', () => {
    const sizes = [{ size: 1.5 }, { size: 1.25 }, { size: -3 }, { size: 10 }, { size: 2 }];
    expect(sortRows(sizes, 'size', 'asc').map(({ size }) => size)).toEqual([-3, 1.25, 1.5, 2, 10]);
    expect(sortRows(sizes, 'size', 'desc').map(({ size }) => size)).toEqual([10, 2, 1.5, 1.25, -3]);
  });

  it('sorts text ignoring case', () => {
    expect(ids(sortRows(rows, 'name', 'asc', 'text', LOCALE))).toEqual(['b', 'd', 'a', 'c']);
  });

  it('gives the rows back as they came for none, without changing the input', () => {
    const before = ids(rows);
    expect(ids(sortRows(rows, 'name', 'none'))).toEqual(before);
    sortRows(rows, 'name', 'desc');
    expect(ids(rows)).toEqual(before);
  });

  it('keeps equal rows in their order', () => {
    const ties = [
      { id: 1, team: 'B' },
      { id: 2, team: 'A' },
      { id: 3, team: 'B' },
      { id: 4, team: 'A' },
    ];
    expect(ids(sortRows(ties, 'team', 'asc'))).toEqual([2, 4, 1, 3]);
  });
});

describe('formatCell', () => {
  it('formats numbers and dates for the locale', () => {
    expect(formatCell(1234.5, 'number', LOCALE)).toBe('1,234.5');
    expect(formatCell('2024-03-05T12:00:00', 'date', LOCALE)).toBe('Mar 5, 2024');
  });

  it('keeps text, and values it cannot read, as they are', () => {
    expect(formatCell('Active', 'badge')).toBe('Active');
    expect(formatCell('abc', 'number')).toBe('abc');
    expect(formatCell(42)).toBe('42');
  });

  it('writes nothing for a missing value', () => {
    expect(formatCell(null, 'number')).toBe('');
    expect(formatCell(undefined)).toBe('');
  });
});

describe('columns', () => {
  it('aligns numbers right unless told otherwise', () => {
    expect(columnAlign({ format: 'number' })).toBe('right');
    expect(columnAlign({})).toBe('left');
    expect(columnAlign({ align: 'center', format: 'number' })).toBe('center');
  });

  it('reads widths as pixels when they are numbers', () => {
    expect(columnWidth(120)).toBe('120px');
    expect(columnWidth('20%')).toBe('20%');
    expect(columnWidth(undefined)).toBe('');
  });
});

describe('selection', () => {
  it('reads the key field, or falls back to the position', () => {
    expect(rowKeyOf({ id: 7 }, 'id', 0)).toBe(7);
    expect(rowKeyOf({ email: 'a@b.c' }, 'email', 0)).toBe('a@b.c');
    expect(rowKeyOf({}, 'id', 3)).toBe(3);
  });

  it('tells none, some and all', () => {
    expect(selectionState([1, 2, 3], new Set())).toBe('none');
    expect(selectionState([1, 2, 3], new Set([2]))).toBe('some');
    expect(selectionState([1, 2, 3], new Set([1, 2, 3]))).toBe('all');
    expect(selectionState([], new Set())).toBe('none');
  });

  it('selects every row, then none, keeping keys of other rows', () => {
    expect(toggleAll([1, 2, 3], new Set([2, 9]))).toEqual([9, 1, 2, 3]);
    expect(toggleAll([1, 2], new Set([1, 2, 9]))).toEqual([9]);
  });

  it('adds and takes out one row', () => {
    expect(toggleKey([1], 2, true)).toEqual([1, 2]);
    expect(toggleKey([1, 2], 1, false)).toEqual([2]);
    expect(toggleKey([1], 1, true)).toEqual([1]);
  });
});

describe('hidden columns', () => {
  const Columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
  ];
  const keys = (columns: { key: string }[]): string[] => columns.map(({ key }) => key);
  const LockedName = [{ hideable: false, key: 'name', label: 'Name' }, ...Columns.slice(1)];

  it('draws every column when none is hidden', () => {
    expect(keys(shownColumns(Columns, []))).toEqual(['name', 'email', 'role']);
  });

  it('leaves out the hidden ones, in their order, and ignores keys of no column', () => {
    expect(keys(shownColumns(Columns, ['role', 'gone', 'name']))).toEqual(['email']);
  });

  it('draws none when all are hidden', () => {
    expect(shownColumns(Columns, ['name', 'email', 'role'])).toEqual([]);
  });

  it('keeps a column that cannot be hidden, whatever hides it', () => {
    expect(keys(shownColumns(LockedName, ['name', 'email']))).toEqual(['name', 'role']);
  });

  it('adds and takes out a hidden column', () => {
    expect(toggleKey(['email'], 'role', true)).toEqual(['email', 'role']);
    expect(toggleKey(['email', 'role'], 'email', false)).toEqual(['role']);
  });
});

describe('the column chooser', () => {
  const Columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
  ];

  it('lists every column in its order, by label, the shown ones ticked', () => {
    expect(columnChoices(Columns, ['email'])).toEqual([
      { key: 'name', label: 'Name', locked: false, shown: true },
      { key: 'email', label: 'Email', locked: false, shown: false },
      { key: 'role', label: 'Role', locked: false, shown: true },
    ]);
  });

  it('locks the last column shown, so the chooser cannot hide them all', () => {
    expect(columnChoices(Columns, ['email', 'role']).map(({ locked }) => locked)).toEqual([true, false, false]);
  });

  it('locks none of the two last columns shown', () => {
    expect(columnChoices(Columns, ['role']).some(({ locked }) => locked)).toBe(false);
  });

  it('locks nothing when every column is hidden, so one can be shown again', () => {
    expect(columnChoices(Columns, ['name', 'email', 'role']).some(({ locked }) => locked)).toBe(false);
  });

  it('shows a column that cannot be hidden ticked and locked, even when listed as hidden', () => {
    const columns = [{ hideable: false, key: 'name', label: 'Name' }, ...Columns.slice(1)];
    expect(columnChoices(columns, ['name'])[0]).toEqual({ key: 'name', label: 'Name', locked: true, shown: true });
  });

  it('lets the last column that can be hidden go while one that cannot stays shown', () => {
    const columns = [{ hideable: false, key: 'name', label: 'Name' }, ...Columns.slice(1)];
    expect(columnChoices(columns, ['email']).map(({ locked }) => locked)).toEqual([true, false, false]);
  });
});

describe('frozen columns', () => {
  it('freezes nothing when nothing is asked', () => {
    expect(frozenCells(5, 2, { end: 0, start: 0 })).toEqual({ end: 0, start: 0 });
    expect(frozenCss({ end: 0, start: 0 })).toBe('');
  });

  it('freezes the checkbox and chevron cells with the start, never alone', () => {
    expect(frozenCells(5, 2, { end: 0, start: 1 })).toEqual({ end: 0, start: 3 });
    expect(frozenCells(5, 2, { end: 1, start: 0 })).toEqual({ end: 1, start: 0 });
  });

  it('freezes no more columns than are shown, the end giving way to the start', () => {
    expect(frozenCells(3, 0, { end: 1, start: 9 })).toEqual({ end: 0, start: 3 });
    expect(frozenCells(3, 0, { end: 2, start: 2 })).toEqual({ end: 1, start: 2 });
    expect(frozenCells(3, 0, { end: 3, start: 0 })).toEqual({ end: 3, start: 0 });
    expect(frozenCells(0, 1, { end: 1, start: 1 })).toEqual({ end: 0, start: 0 });
  });

  it('reads a count below zero as none', () => {
    expect(frozenCells(3, 1, { end: -2, start: -1 })).toEqual({ end: 0, start: 0 });
  });

  it('adds up the widths before each cell', () => {
    expect(stickyOffsets([])).toEqual([]);
    expect(stickyOffsets([44])).toEqual([0]);
    expect(stickyOffsets([44, 120.5, 80])).toEqual([0, 44, 164.5]);
  });

  it('keeps each frozen cell in view by its place in the row, its offset measured', () => {
    const rules = frozenCss({ end: 1, start: 2 });
    expect(rules).toContain(':is(:nth-child(-n + 2), :nth-last-child(-n + 1)) { position: sticky; }');
    expect(rules).toContain('> :nth-child(1) { left: var(--frozen-start-0); }');
    expect(rules).toContain('> :nth-child(2) { left: var(--frozen-start-1); }');
    expect(rules).toContain('> :nth-last-child(1) { right: var(--frozen-end-0); }');
    expect(rules).not.toContain('--frozen-end-1');
  });

  it("leaves an open row's detail and the empty row alone, and lets the rows' shades win", () => {
    const rules = frozenCss({ end: 0, start: 1 });
    expect(rules.split('\n').every((rule) => rule.includes('tr:not(.detail, .empty)'))).toBe(true);
    expect(rules).toContain(':where(tbody tr:not(.detail, .empty) > :is(:nth-child(-n + 1)))');
    expect(rules).not.toContain('nth-last-child');
  });
});

describe('open rows', () => {
  it('shows none when rows do not open, the last one opened when one at a time, all of them otherwise', () => {
    expect(openRows([1, 2], 'none')).toEqual([]);
    expect(openRows([1, 2], 'single')).toEqual([2]);
    expect(openRows([], 'single')).toEqual([]);
    expect(openRows([1, 2], 'multiple')).toEqual([1, 2]);
  });

  it('closes the open row when another opens, one at a time', () => {
    expect(withRowOpen([1], 2, true, 'single')).toEqual([2]);
    expect(withRowOpen([2], 2, false, 'single')).toEqual([]);
    expect(withRowOpen([1, 2], 1, false, 'single')).toEqual([2]);
  });

  it('opens and closes rows on their own when any number can be open', () => {
    expect(withRowOpen([1], 2, true, 'multiple')).toEqual([1, 2]);
    expect(withRowOpen([1, 2], 1, false, 'multiple')).toEqual([2]);
  });

  it('leaves the open rows alone when rows do not open', () => {
    expect(withRowOpen([1], 2, true, 'none')).toEqual([1]);
  });

  it('tells the rows closed, then those opened', () => {
    expect(rowToggles([1], [2])).toEqual([
      { key: 1, open: false },
      { key: 2, open: true },
    ]);
    expect(rowToggles([1, 2], [1, 2])).toEqual([]);
  });
});

describe('datetime cells and typed renderers', () => {
  it('formats a date with its time, and orders such dates by time', () => {
    expect(formatCell('2026-10-23T14:44:48Z', 'datetime', 'en-GB')).toMatch(/23 Oct 2026, \d\d:44/);
    expect(compareCells('2026-10-23T14:44:48Z', '2026-10-24T08:00:00Z', 'datetime')).toBeLessThan(0);
  });

  it("hands a renderer the page's row as it gave it", () => {
    // The unit tests run without a DOM: a stand-in for the node is enough.
    const draw = cellOf<{ name: string }>((row) => ({ textContent: row.name.toUpperCase() }) as unknown as Node);
    expect(draw({ name: 'ada' }).textContent).toBe('ADA');
  });
});
