import { JlLoadState } from '@syware/jlib';

import { freeSlug, slugOf, subtitleSlug } from '../lib/anchors';
import styles from '../styles/anchors.css?inline';

import type { JlPageOutlet } from '@syware/jlib';

// The titles a link can point at; the page's own title (h1) is the page.
const TITLE = 'h2';
const PLACES = 'h2, h3';
// What shows other people's markup: an example's headings are the example's, not the page's.
const NOT_THE_PAGE = '.example-root, .preview-area, site-playground';
const ANCHOR = 'anchor';
const ANCHOR_MARK = '#';
const ANCHOR_LABEL = 'Link to this section';
const HASH = '#';

/** One sheet for every shadow root that holds a title: the pages, the examples, the API tables. */
const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

/** The places of the page that shows, by name. A page's titles live in several shadow roots: no id lookup finds them. */
const places = new Map<string, HTMLElement>();

/** The elements under a node as the page shows them, shadow roots first, without what shows other markup. */
function shownElements(parent: ParentNode): Element[] {
  return [...parent.children]
    .filter((child) => !child.matches(NOT_THE_PAGE))
    .flatMap((child) => [
      child,
      ...(child.shadowRoot === null ? [] : shownElements(child.shadowRoot)),
      ...shownElements(child),
    ]);
}

/** The root a title is drawn in gets the anchors' styles, once. */
function styleRootOf(title: HTMLElement): void {
  const root = title.getRootNode();
  if (root instanceof ShadowRoot && !root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  }
}

/** Names a title and puts its link beside it. */
function anchor(title: HTMLElement, slug: string): void {
  title.id = slug;
  styleRootOf(title);
  title.append(
    <a class={ANCHOR} href={`${HASH}${slug}`} aria-label={ANCHOR_LABEL}>
      {ANCHOR_MARK}
    </a>
  );
  places.set(slug, title);
}

/** Gives every title and subtitle of the page its name and its link, in the order the page shows them. */
function anchorPage(page: HTMLElement): void {
  places.clear();
  // A page draws in its shadow root; one without draws its own children.
  const titles = shownElements(page.shadowRoot ?? page).filter(
    (element): element is HTMLElement => element instanceof HTMLElement && element.matches(PLACES)
  );
  // The title the subtitles that follow stand under.
  const under = { title: '' };
  for (const title of titles) {
    // Drawn again for a page shown again: the link of the last time is not part of the title.
    title.querySelector(`.${ANCHOR}`)?.remove();
    const text = title.textContent ?? '';
    const isTitle = title.matches(TITLE);
    const slug = isTitle ? slugOf(text) : subtitleSlug(under.title, text);
    if (slug !== '' && text.trim() !== '') {
      const free = freeSlug(slug, new Set(places.keys()));
      anchor(title, free);
      under.title = isTitle ? free : under.title;
    }
  }
}

/** Brings the place the address names into view; an address that names none, or one the page lacks, moves nothing. */
function showNamedPlace(): boolean {
  const place = places.get(decodeURIComponent(window.location.hash.slice(HASH.length)));
  place?.scrollIntoView({ block: 'start' });
  return place !== undefined;
}

/** A press on a title's link names the place in the address, to copy and send, and brings it into view. */
function followAnchor(event: MouseEvent): void {
  const link = event
    .composedPath()
    .find(
      (target): target is HTMLAnchorElement =>
        target instanceof HTMLAnchorElement && target.classList.contains(ANCHOR)
    );
  if (link === undefined) {
    return;
  }
  window.history.replaceState(window.history.state, '', link.getAttribute('href'));
  showNamedPlace();
}

/**
 * A page that shows gets its anchors once it has its data (its titles come with it), then the place its address
 * names comes into view; without one, the page starts at its top.
 */
async function showPlace(page: HTMLElement, signal: AbortSignal): Promise<void> {
  if (window.location.hash === '') {
    window.scrollTo({ top: 0 });
  }
  await JlLoadState.whenSettled(page, signal);
  if (signal.aborted || !page.isConnected) {
    return;
  }
  anchorPage(page);
  showNamedPlace();
}

/**
 * Every title and subtitle of the pages the outlet shows can be linked to: `/components/table#api-events`.
 * For as long as `signal` lives.
 */
export function followAnchors(outlet: JlPageOutlet, signal: AbortSignal): void {
  outlet.events.register('show', (page) => void showPlace(page, signal));
  document.addEventListener('click', followAnchor, { signal });
  window.addEventListener('hashchange', showNamedPlace, { signal });
}
