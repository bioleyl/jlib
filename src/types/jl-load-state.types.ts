/** Where the data of a list or a page is: on its way, shown, there but empty, or failed to come. */
export type LoadState = 'loading' | 'ready' | 'empty' | 'error';

/** The shape the skeleton takes while the data comes: rows of a list, cards of a grid, or lines of text. */
export type LoadSkeleton = 'rows' | 'cards' | 'lines';

/** What `load()` needs: how to fetch the data, how to draw it, and whether it holds nothing to show. */
export type LoadTask<Value> = {
  fetch: () => Promise<Value>;
  draw: (value: Value) => void;
  isEmpty?: (value: Value) => boolean;
};
