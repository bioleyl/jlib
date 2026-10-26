/** One level of a breadcrumb: a link when it has an `href`, plain text otherwise. */
export type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: string;
};
