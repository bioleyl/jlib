import { Jadis } from '@jadis/core';
import { JlSegmented } from '@syware/jlib';

import type { SegmentedOption } from '@syware/jlib';

type View = 'list' | 'grid';

declare function showView(view: View): void; // (not shown)

const VIEWS: SegmentedOption<View>[] = [
  { label: 'List', value: 'list' },
  { label: 'Grid', value: 'grid' },
];

export class OrdersToolbar extends Jadis {
  static readonly selector = 'orders-toolbar';

  private readonly _refs = this.useRefs((ref) => ({ view: ref<JlSegmented<View>>('.view') }));

  templateHtml(): Node {
    // value="table" does not compile. Without <View>, the type is read from the options.
    return <JlSegmented<View> class="view" label="View" options={VIEWS} value="list" />;
  }

  onConnect(): void {
    this._refs.view.events.register('change', (value) => showView(value));
  }
}

OrdersToolbar.register();
