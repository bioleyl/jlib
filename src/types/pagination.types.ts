/** One entry of a pagination's list: a page to go to, or a gap standing for the pages left out. */
export type PageItem = { type: 'page'; page: number } | { type: 'gap'; side: 'start' | 'end' };
