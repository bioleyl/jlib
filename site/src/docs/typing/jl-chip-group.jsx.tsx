import { Jadis } from '@jadis/core';
import { JlChipGroup } from '@syware/jlib';

import type { ChipGroupOption } from '@syware/jlib';

type Status = 'open' | 'done' | 'failed';

declare function filterBy(statuses: Status[]): void; // (not shown)

const STATUSES: ChipGroupOption<Status>[] = [
  { label: 'Open', value: 'open' },
  { label: 'Done', value: 'done' },
  { label: 'Failed', value: 'failed' },
];

export class JobFilters extends Jadis {
  static readonly selector = 'job-filters';

  private readonly _refs = this.useRefs((ref) => ({ status: ref<JlChipGroup<Status>>('.status') }));

  templateHtml(): Node {
    // value={['closed']} does not compile. Without <Status>, the type is read from the options.
    return <JlChipGroup<Status> class="status" label="Status" multiple options={STATUSES} value={['open']} />;
  }

  onConnect(): void {
    this._refs.status.events.register('change', (values) => filterBy(values));
  }
}

JobFilters.register();
