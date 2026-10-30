/** A page's own type of row, as an interface: one a `Record<string, unknown>` row would refuse. */
export interface Order {
  id: number;
  customer: string;
  total: number;
  note?: string;
}
