// The names of the places in a page that a link can point at: `#examples-pages-in-the-footer`.

const NOT_A_WORD = /[^\p{Letter}\p{Number}]+/gu;
const EDGE_DASHES = /^-+|-+$/g;
const SEPARATOR = '-';

/** A title as it reads in an address: "Pages, in the footer" gives `pages-in-the-footer`. */
export const slugOf = (title: string): string =>
  title.toLowerCase().replace(NOT_A_WORD, SEPARATOR).replace(EDGE_DASHES, '');

/** A subtitle's name starts with its title's, so "Added" under two versions gives two names that stay the same. */
export const subtitleSlug = (titleSlug: string, subtitle: string): string =>
  [titleSlug, slugOf(subtitle)].filter((part) => part !== '').join(SEPARATOR);

/** The name itself, or the first of `name-2`, `name-3`… that no place of the page has yet. */
export function freeSlug(slug: string, taken: ReadonlySet<string>): string {
  if (!taken.has(slug)) {
    return slug;
  }
  const FirstCopy = 2;
  const copies = Array.from({ length: taken.size + 1 }, (_, index) => `${slug}${SEPARATOR}${index + FirstCopy}`);
  return copies.find((copy) => !taken.has(copy)) ?? slug;
}
