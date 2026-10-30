import type { JlTable, TableColumn } from '@syware/jlib';

type Order = { id: number; number: string; customer: string; total: number; note?: string };

declare function noteOf(order: Order): Node; // (not shown)

const COLUMNS: TableColumn<Order>[] = [
  { description: 'note', key: 'customer', label: 'Customer', sortable: true },
  { format: 'number', key: 'total', label: 'Total', sortable: true },
];

export function showOrders(root: HTMLElement, orders: Order[]): void {
  const table = root.querySelector<JlTable<Order>>('jl-table.orders');
  if (table === null) {
    return;
  }
  table.columns.set(COLUMNS);
  table.rows.set(orders); // an interface's rows too
  table.sortKey.set('total');
  // @ts-expect-error: an order has no `totl`
  table.sortKey.set('totl');
  table.renderers.set({ total: (order) => document.createTextNode(order.total.toFixed(2)) });
  table.detail = (order) => noteOf(order); // order: Order, not Record<string, unknown>
}
