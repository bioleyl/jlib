/**
 * One level of a breadcrumb: a link when it has an `href`; with an `id` instead, a link the app follows itself (the
 * breadcrumb fires `select` with it); plain text otherwise.
 */
export type BreadcrumbItem<Id extends string = string> = {
  label: string;
  href?: string;
  id?: Id;
  icon?: string;
};
