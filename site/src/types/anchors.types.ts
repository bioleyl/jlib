/** A title (h2) or a subtitle (h3) of the page shown, named so that a link can point at it. */
export type PagePlace = {
  element: HTMLElement;
  kind: 'title' | 'subtitle';
  slug: string;
  text: string;
};
