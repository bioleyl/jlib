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

  templateHtml(): Node {
    // value="table" does not compile. Without <View>, the type is read from the options.
    return <JlSegmented<View> label="View" options={VIEWS} value="list" onChange={(value) => showView(value)} />;
  }
}

OrdersToolbar.register();
