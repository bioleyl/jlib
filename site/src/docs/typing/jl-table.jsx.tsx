import { Jadis } from '@jadis/core';
import { JlTable } from '@syware/jlib';

import type { TableColumn } from '@syware/jlib';

type Order = { id: number; number: string; customer: string; total: number; note?: string };

declare function loadOrders(): Promise<Order[]>; // (not shown)
declare function noteOf(order: Order): Node; // (not shown)

const COLUMNS: TableColumn<Order>[] = [
  { description: 'note', key: 'customer', label: 'Customer', sortable: true },
  { format: 'number', key: 'total', label: 'Total', sortable: true },
];

export class OrdersView extends Jadis {
  static readonly selector = 'orders-view';

  private readonly _refs = this.useRefs((ref) => ({ orders: ref<JlTable<Order>>('.orders') }));

  templateHtml(): Node {
    // The props are checked against an order: sortKey="totl" does not compile.
    return <JlTable<Order> class="orders" columns={COLUMNS} sortKey="total" expandable="single" />;
  }

  async onConnect(): Promise<void> {
    const table = this._refs.orders;
    table.detail = (order) => noteOf(order);
    table.rows.set(await loadOrders());
  }
}

OrdersView.register();
