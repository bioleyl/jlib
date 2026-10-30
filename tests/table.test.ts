import { describe, expect, it } from 'vitest';

import {
  cellOf,
  columnAlign,
  columnWidth,
  compareCells,
  formatCell,
  nextSortDirection,
  openRows,
  rowKeyOf,
  rowToggles,
  selectionState,
  sortRows,
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
    expect(columnAlign({ format: 'number', key: 'a', label: 'A' })).toBe('right');
    expect(columnAlign({ key: 'a', label: 'A' })).toBe('left');
    expect(columnAlign({ align: 'center', format: 'number', key: 'a', label: 'A' })).toBe('center');
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
