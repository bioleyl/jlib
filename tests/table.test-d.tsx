// Type tests: `npm run typecheck` checks them, nothing runs them. A table typed by its rows checks and completes what
// names their fields, and hands its renderers and detail the page's own type of row.
import { describe, expectTypeOf, it } from 'vitest';

import type { JlTable } from '../src/organisms/jl-table';
import type { TableColumn, TableSort } from '../src/types/jl-table.types';
import type { Order } from './types/table.types';

type OrderField = 'id' | 'customer' | 'total' | 'note';

declare const orders: Order[];
declare const typed: JlTable<Order>;
declare const withActions: JlTable<Order, 'actions'>;
declare const untyped: JlTable;
declare const Table: typeof JlTable;

const text = (value: string): Node => document.createTextNode(value);

describe('a table typed by its rows', () => {
  it('takes rows of an interface', () => {
    typed.rows.set(orders);
    expectTypeOf(typed.rows.get()).toEqualTypeOf<Order[]>();
  });

  it('names fields of the rows in its columns', () => {
    expectTypeOf<TableColumn<Order>['key']>().toEqualTypeOf<OrderField>();
    typed.columns.set([{ description: 'note', key: 'customer', label: 'Customer' }]);
    // @ts-expect-error: not a field of an order
    typed.columns.set([{ key: 'custmer', label: 'Customer' }]);
    // @ts-expect-error: the line under a value is a field too
    typed.columns.set([{ description: 'nte', key: 'customer', label: 'Customer' }]);
  });

  it('hands its renderers and its detail an order', () => {
    typed.renderers.set({ total: (order) => text(order.total.toFixed(2)) });
    typed.detail = (order) => text(order.customer);
    // @ts-expect-error: renderers are by column
    typed.renderers.set({ totl: () => text('') });
    // @ts-expect-error: not a field of an order
    typed.detail = (order) => text(order.custmer);
  });

  it('says which column its rows are sorted by', () => {
    typed.events.register('sort', (sort) => expectTypeOf(sort).toEqualTypeOf<TableSort<Order>>());
    expectTypeOf<TableSort<Order>['key']>().toEqualTypeOf<OrderField>();
  });

  it('names a field of the rows as their key and as the sorted column', () => {
    typed.rowKey.set('customer');
    typed.sortKey.set('total');
    typed.sortKey.set('');
    // @ts-expect-error: not a field of an order
    typed.rowKey.set('sku');
    // @ts-expect-error: not a column of the table
    typed.sortKey.set('totl');
  });

  it('adds a column that is not a field only when it is named', () => {
    withActions.columns.set([{ key: 'actions', label: '' }]);
    withActions.renderers.set({ actions: (order) => text(String(order.id)) });
  });

  it('reads the type of its rows from them in JSX', () => {
    expectTypeOf(<Table rows={orders} detail={(order) => text(order.customer)} />).toBeAny();
    // @ts-expect-error: not a field of an order
    expectTypeOf(<Table rows={orders} detail={(order) => text(order.custmer)} />).toBeAny();
    // @ts-expect-error: a misspelt field is an error, not a column of its own
    expectTypeOf(<Table rows={orders} columns={[{ key: 'custmer', label: 'Customer' }]} />).toBeAny();
  });
});

describe('a table that does not say its type of row', () => {
  it('takes any field', () => {
    untyped.columns.set([{ key: 'anything', label: 'Anything' }]);
    untyped.rows.set([{ anything: 1 }]);
    untyped.renderers.set({ anything: (row) => text(String(row.anything)) });
  });
});
