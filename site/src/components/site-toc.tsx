import { css } from '@jadis/core';
import { JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { currentPlace, outlineOf } from '../lib/outline';
import styles from './site-toc.css?inline';

import type { PagePlace } from '../types/anchors.types';

// The reading line stands this far under where a link brings a title: the title brought there is the one read.
const READING_SLACK = 8;
// How near the page's foot counts as its end, where the last titles cannot reach the line.
const END_SLACK = 2;
const CURRENT = 'location';

/** A place of the page with its link in the outline. */
type LinkedPlace = { kind: PagePlace['kind']; link: HTMLAnchorElement };

/**
 * The outline of the page shown: its titles, each with its subtitles, linked; the one being read is lit as the page
 * scrolls. The shell gives it the page's places (`placesBus` of the anchors).
 */
export class SiteToc extends JlElement {
  static readonly selector = 'site-toc';

  /** The titles and subtitles of the page shown, in its order. */
  readonly places = this.useChange<PagePlace[]>([], () => this.renderPlaces());

  private readonly _state = {
    current: null as HTMLAnchorElement | null,
    /** The frame the next reading waits for: one per frame, however many scroll events came. */
    frame: 0,
    /** How far under the window's top the title being read has passed. */
    line: 0,
    links: [] as HTMLAnchorElement[],
  };

  private readonly _refs = this.useRefs((ref) => ({ list: ref('.list') }));

  templateHtml(): Node {
    return (
      <nav class="toc" aria-labelledby="toc-heading">
        <p class="heading" id="toc-heading">
          On this page
        </p>
        <ul class="list" />
      </nav>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    for (const type of ['scroll', 'resize']) {
      window.addEventListener(type, () => this.scheduleCurrent(), { passive: true, signal: this.killSignal });
    }
  }

  onDisconnect(): void {
    cancelAnimationFrame(this._state.frame);
    this._state.frame = 0;
  }

  /** The links of the page's places, each title's subtitles in a list under it. */
  private renderPlaces(): void {
    const linked: LinkedPlace[] = this.places
      .get()
      .map((place) => ({ kind: place.kind, link: this.linkTo(place) }));
    this._refs.list.replaceChildren(
      ...outlineOf(linked).map(({ place, subtitles }) => (
        <li>
          {place.link}
          {subtitles.length === 0 ? null : (
            <ul>
              {subtitles.map((subtitle) => (
                <li>{subtitle.link}</li>
              ))}
            </ul>
          )}
        </li>
      ))
    );
    this._state.links = linked.map(({ link }) => link);
    this._state.current = null;
    this._state.line = this.readingLine();
    this.renderCurrent();
  }

  /**
   * Where a link brings a title, under the site's bar (the page's scroll padding and the title's scroll margin), and
   * a little more: following a link lights that link.
   */
  private readingLine(): number {
    const first = this.places.get()[0]?.element;
    if (first === undefined) {
      return 0;
    }
    const padding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const margin = Number.parseFloat(getComputedStyle(first).scrollMarginTop) || 0;
    return padding + margin + READING_SLACK;
  }

  /** The anchors follow it like a title's own link: the address names the place, which comes into view. */
  private linkTo(place: PagePlace): HTMLAnchorElement {
    const link: HTMLAnchorElement = (
      <a href={`#${place.slug}`} class={place.kind}>
        {place.text}
      </a>
    );
    return link;
  }

  private scheduleCurrent(): void {
    if (this._state.frame !== 0) {
      return;
    }
    this._state.frame = requestAnimationFrame(() => {
      this._state.frame = 0;
      this.renderCurrent();
    });
  }

  /** Lights the link of the place being read, where the titles stand in the window now. */
  private renderCurrent(): void {
    const tops = this.places.get().map((place) => place.element.getBoundingClientRect().top);
    const page = document.documentElement;
    const atEnd = window.scrollY > 0 && window.innerHeight + window.scrollY >= page.scrollHeight - END_SLACK;
    const link = this._state.links[currentPlace(tops, this._state.line, atEnd)] ?? null;
    if (link === this._state.current) {
      return;
    }
    this._state.current?.removeAttribute('aria-current');
    link?.setAttribute('aria-current', CURRENT);
    this._state.current = link;
  }
}

SiteToc.register();
