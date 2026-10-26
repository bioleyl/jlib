import type { PageItem } from '../types/pagination.types';

const FIRST_PAGE = 1;

const range = (start: number, end: number): number[] =>
  end < start ? [] : Array.from({ length: end - start + 1 }, (_, index) => start + index);

const pageItem = (page: number): PageItem => ({ page, type: 'page' });

/** A page number kept within 1 and the last page; a missing or unreadable one is the first page. */
export function clampPage(page: number, pages: number): number {
  if (Number.isNaN(page) || pages < FIRST_PAGE) {
    return FIRST_PAGE;
  }
  return Math.min(Math.max(Math.round(page), FIRST_PAGE), pages);
}

/** Between the first pages and the siblings: a gap, the one page a gap would hide, or nothing. */
function startJoint(siblingsStart: number, boundaries: number, pages: number): PageItem[] {
  if (siblingsStart > boundaries + 2) {
    return [{ side: 'start', type: 'gap' }];
  }
  if (boundaries + 1 < pages - boundaries) {
    return [pageItem(boundaries + 1)];
  }
  return [];
}

/** Between the siblings and the last pages: a gap, the one page a gap would hide, or nothing. */
function endJoint(siblingsEnd: number, boundaries: number, pages: number): PageItem[] {
  if (siblingsEnd < pages - boundaries - 1) {
    return [{ side: 'end', type: 'gap' }];
  }
  if (pages - boundaries > boundaries) {
    return [pageItem(pages - boundaries)];
  }
  return [];
}

/**
 * The entries of a pagination: the first and the last `boundaries` pages, the current page with `siblings` pages
 * on each side, and gaps for the pages between. The list has the same length on every page, so the buttons do not
 * move under the pointer while people step through.
 */
export function pageItems(page: number, pages: number, siblings = 1, boundaries = 1): PageItem[] {
  if (pages < FIRST_PAGE) {
    return [];
  }
  const current = clampPage(page, pages);
  const startPages = range(FIRST_PAGE, Math.min(boundaries, pages));
  const endPages = range(Math.max(pages - boundaries + 1, boundaries + 1), pages);
  const siblingsStart = Math.max(
    Math.min(current - siblings, pages - boundaries - siblings * 2 - 1),
    boundaries + 2
  );
  const lastBeforeEnd = endPages.length > 0 ? (endPages[0] ?? pages) - 2 : pages - 1;
  const siblingsEnd = Math.min(Math.max(current + siblings, boundaries + siblings * 2 + 2), lastBeforeEnd);
  return [
    ...startPages.map(pageItem),
    ...startJoint(siblingsStart, boundaries, pages),
    ...range(siblingsStart, siblingsEnd).map(pageItem),
    ...endJoint(siblingsEnd, boundaries, pages),
    ...endPages.map(pageItem),
  ];
}
