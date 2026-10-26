import { describe, expect, it } from 'vitest';

import { clampPage, pageItems } from '../src/lib/pagination';

import type { PageItem } from '../src/types/pagination.types';

/** The entries as a short text: page numbers, and … for gaps. */
const shown = (items: PageItem[]): string =>
  items.map((item) => (item.type === 'page' ? String(item.page) : '…')).join(' ');

describe('pageItems', () => {
  it('lists every page when they all fit', () => {
    expect(shown(pageItems(1, 5))).toBe('1 2 3 4 5');
    expect(shown(pageItems(4, 7))).toBe('1 2 3 4 5 6 7');
  });

  it('puts one gap on the far side near either end', () => {
    expect(shown(pageItems(1, 12))).toBe('1 2 3 4 5 … 12');
    expect(shown(pageItems(12, 12))).toBe('1 … 8 9 10 11 12');
  });

  it('puts gaps on both sides in the middle', () => {
    expect(shown(pageItems(6, 12))).toBe('1 … 5 6 7 … 12');
  });

  it('keeps the same number of entries on every page', () => {
    const lengths = Array.from({ length: 20 }, (_, index) => pageItems(index + 1, 20).length);
    expect(new Set(lengths)).toEqual(new Set([7]));
  });

  it('shows a page instead of a gap that would hide only that page', () => {
    expect(shown(pageItems(4, 12))).toBe('1 2 3 4 5 … 12');
    expect(shown(pageItems(5, 12))).toBe('1 … 4 5 6 … 12');
  });

  it('follows the number of siblings and boundary pages', () => {
    expect(shown(pageItems(10, 20, 2, 1))).toBe('1 … 8 9 10 11 12 … 20');
    expect(shown(pageItems(10, 20, 1, 2))).toBe('1 2 … 9 10 11 … 19 20');
    expect(shown(pageItems(10, 20, 0, 1))).toBe('1 … 10 … 20');
  });

  it('can leave the boundary pages out', () => {
    expect(shown(pageItems(10, 20, 1, 0))).toBe('… 9 10 11 …');
    expect(shown(pageItems(1, 20, 1, 0))).toBe('1 2 3 4 …');
  });

  it('marks which side each gap stands for', () => {
    const gaps = pageItems(6, 12).filter((item) => item.type === 'gap');
    expect(gaps).toEqual([
      { side: 'start', type: 'gap' },
      { side: 'end', type: 'gap' },
    ]);
  });

  it('handles one page, two pages and none', () => {
    expect(shown(pageItems(1, 1))).toBe('1');
    expect(shown(pageItems(2, 2))).toBe('1 2');
    expect(pageItems(1, 0)).toEqual([]);
  });

  it('treats a page out of range as the nearest end', () => {
    expect(shown(pageItems(40, 12))).toBe(shown(pageItems(12, 12)));
    expect(shown(pageItems(-3, 12))).toBe(shown(pageItems(1, 12)));
  });
});

describe('clampPage', () => {
  it('keeps the page within 1 and the last page', () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(11, 10)).toBe(10);
    expect(clampPage(4, 10)).toBe(4);
  });

  it('gives the first page for nonsense', () => {
    expect(clampPage(Number.NaN, 10)).toBe(1);
    expect(clampPage(3, 0)).toBe(1);
  });
});
