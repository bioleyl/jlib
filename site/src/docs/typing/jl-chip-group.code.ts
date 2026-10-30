import type { JlChipGroup } from '@syware/jlib';

type Status = 'open' | 'done' | 'failed';

declare function filterBy(statuses: Status[]): void; // (not shown)

const status = document.querySelector<JlChipGroup<Status>>('jl-chip-group.status');
status?.options.set([
  { label: 'Open', value: 'open' },
  { label: 'Done', value: 'done' },
  { label: 'Failed', value: 'failed' },
]);
status?.value.set(['open', 'failed']);
// @ts-expect-error: 'closed' is not a status
status?.value.set(['closed']);
status?.events.register('change', (values) => filterBy(values)); // values: Status[]
