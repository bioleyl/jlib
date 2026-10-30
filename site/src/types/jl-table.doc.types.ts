/** A member of a workspace, a row of the members table. */
export type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  projects: number;
  joined: string;
};

/** An order, a row of the orders table, with what its detail shows. */
export type Order = {
  id: number;
  number: string;
  customer: string;
  status: string;
  total: number;
  placed: string;
  address: string;
  items: string;
  note?: string;
};
