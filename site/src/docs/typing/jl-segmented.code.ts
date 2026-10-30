import type { JlSegmented } from '@syware/jlib';

type View = 'list' | 'grid';

declare function showView(view: View): void; // (not shown)

const view = document.querySelector<JlSegmented<View>>('jl-segmented.view');
view?.options.set([
  { label: 'List', value: 'list' },
  { label: 'Grid', value: 'grid' },
]);
// @ts-expect-error: 'table' is not a view
view?.value.set('table');
view?.events.register('change', (value) => showView(value)); // value: View, not string
