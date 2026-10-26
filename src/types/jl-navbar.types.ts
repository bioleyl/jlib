/** A link of a navigation bar; the `active` one is the page people are on. */
export type NavbarLink = {
  label: string;
  href: string;
  active?: boolean;
};
