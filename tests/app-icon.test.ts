import { describe, expect, it } from 'vitest';

import { appIconSvg } from '../src/lib/app-icon';

const COLORS = { glyph: '#ffffff', tile: '#cc0000' };

describe('an app icon as a file', () => {
  it('draws the glyph in the middle of a rounded tile, in the colours given', () => {
    const svg = appIconSvg(
      [
        ['path', { d: 'M4 4h16' }],
        ['circle', { cx: 12, cy: 12, r: 3 }],
      ],
      COLORS
    );
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">/);
    expect(svg).toContain('<rect fill="#cc0000" height="64" rx="16.64" width="64"/>');
    expect(svg).toContain('stroke="#ffffff"');
    expect(svg).toContain('transform="translate(12.16 12.16) scale(1.65)"');
    expect(svg).toContain('<path d="M4 4h16"/><circle cx="12" cy="12" r="3"/></g></svg>');
  });

  it('keeps what an attribute holds from closing it', () => {
    const svg = appIconSvg([['path', { d: 'M0 0', 'data-note': '"<&' }]], COLORS);
    expect(svg).toContain('data-note="&quot;&lt;&amp;"');
  });
});
