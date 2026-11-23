import { describe, expect, it } from 'vitest';

import { currentPlace, outlineOf } from '../site/src/lib/outline';

import type { PagePlace } from '../site/src/types/anchors.types';

const place = (kind: PagePlace['kind'], text: string): { kind: PagePlace['kind']; text: string } => ({
  kind,
  text,
});

describe('outlineOf', () => {
  it('lists nothing for a page without titles', () => {
    expect(outlineOf([])).toEqual([]);
  });

  it('puts each subtitle under the title before it', () => {
    const examples = place('title', 'Examples');
    const pages = place('subtitle', 'Pages');
    const api = place('title', 'API');
    const events = place('subtitle', 'Events');
    const slots = place('subtitle', 'Slots');
    expect(outlineOf([examples, pages, api, events, slots])).toEqual([
      { place: examples, subtitles: [pages] },
      { place: api, subtitles: [events, slots] },
    ]);
  });

  it('lets a subtitle before any title stand alone', () => {
    const intro = place('subtitle', 'Intro');
    const api = place('title', 'API');
    expect(outlineOf([intro, api])).toEqual([
      { place: intro, subtitles: [] },
      { place: api, subtitles: [] },
    ]);
  });
});

describe('currentPlace', () => {
  const Line = 160;

  it('reads none while the first title is under the line', () => {
    expect(currentPlace([400, 900], Line, false)).toBe(-1);
    expect(currentPlace([], Line, false)).toBe(-1);
  });

  it('reads the last title that has reached the line, one exactly on it included', () => {
    expect(currentPlace([-300, 40, 700], Line, false)).toBe(1);
    expect(currentPlace([-300, 160, 700], Line, false)).toBe(1);
    expect(currentPlace([-300, 161, 700], Line, false)).toBe(0);
  });

  it('reads the last of all at the end of the page, where the last titles cannot reach the line', () => {
    expect(currentPlace([-300, 40, 700], Line, true)).toBe(2);
    expect(currentPlace([], Line, true)).toBe(-1);
  });
});
