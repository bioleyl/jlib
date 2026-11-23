// The page's outline: its titles with their subtitles, and the one being read as the page scrolls.

import type { OutlineEntry } from '../types/outline.types';

/** The places of a page as its outline lists them: each title with the subtitles under it; one before any title stands alone. */
export function outlineOf<Place extends { kind: 'title' | 'subtitle' }>(
  places: readonly Place[]
): OutlineEntry<Place>[] {
  const entries: OutlineEntry<Place>[] = [];
  for (const place of places) {
    const last = entries.at(-1);
    if (place.kind === 'subtitle' && last !== undefined) {
      last.subtitles.push(place);
      continue;
    }
    entries.push({ place, subtitles: [] });
  }
  return entries;
}

/**
 * The place being read, by the tops of the places in the window: the last whose top has reached the reading line;
 * once the page is scrolled to its end, where the last places cannot reach the line, the last of all; -1 above the
 * first.
 */
export function currentPlace(tops: readonly number[], line: number, atEnd: boolean): number {
  if (atEnd) {
    return tops.length - 1;
  }
  return tops.findLastIndex((top) => top <= line);
}
