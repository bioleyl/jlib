import { describe, expect, it } from 'vitest';

import { contrastLevel, contrastRatio, hexOf, parseColour } from '../site/src/lib/contrast';

const WHITE = { blue: 255, green: 255, red: 255 };
const BLACK = { blue: 0, green: 0, red: 0 };

describe('contrastRatio', () => {
  it('goes from 1 for the same colour to 21 for black on white', () => {
    expect(contrastRatio(WHITE, WHITE)).toBe(1);
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5);
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 5);
  });

  it('gives the ratios the tokens are documented with', () => {
    const accent = parseColour('#0c72b0');
    const muted = parseColour('#5b616b');
    expect(accent && contrastRatio(accent, WHITE)).toBeCloseTo(5.2, 1);
    expect(muted && contrastRatio(muted, WHITE)).toBeCloseTo(6.2, 1);
  });
});

describe('contrastLevel', () => {
  it('names the best level reached', () => {
    expect(contrastLevel(8)).toBe('AAA');
    expect(contrastLevel(5.2)).toBe('AA');
    expect(contrastLevel(3.2)).toBe('AA large');
    expect(contrastLevel(2)).toBe('Fails');
  });
});

describe('parseColour', () => {
  it('reads computed colours and hex, and nothing else', () => {
    expect(parseColour('rgb(0, 114, 179)')).toEqual({ blue: 179, green: 114, red: 0 });
    expect(parseColour('rgba(11, 11, 12, 0.5)')).toEqual({ blue: 12, green: 11, red: 11 });
    expect(parseColour('#0072B3')).toEqual({ blue: 179, green: 114, red: 0 });
    expect(parseColour('color-mix(in srgb, red, blue)')).toBeNull();
  });

  it('writes channels back as hex', () => {
    expect(hexOf({ blue: 179, green: 114, red: 0 })).toBe('#0072b3');
  });
});
