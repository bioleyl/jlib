import { describe, expect, it } from 'vitest';

import { checkFiles, describeAccept, formatFileSize, isSameFile, matchesAccept } from '../src/lib/files';

const KB = 1024;
const MB = KB * KB;

const file = (name: string, type: string, size = KB) => ({ name, size, type });

describe('formatFileSize', () => {
  it('writes bytes as bytes', () => {
    expect(formatFileSize(0, 'en')).toBe('0 B');
    expect(formatFileSize(512, 'en')).toBe('512 B');
    expect(formatFileSize(1023, 'en')).toBe('1023 B');
  });

  it('keeps one decimal under ten, whole numbers above', () => {
    expect(formatFileSize(1536, 'en')).toBe('1.5 KB');
    expect(formatFileSize(KB, 'en')).toBe('1 KB');
    expect(formatFileSize(12.4 * MB, 'en')).toBe('12 MB');
    expect(formatFileSize(3.25 * MB * KB, 'en')).toBe('3.3 GB');
  });

  it('moves to the next unit rather than writing 1024 of one', () => {
    expect(formatFileSize(MB - 1, 'en')).toBe('1 MB');
  });

  it('follows the locale for the decimal mark', () => {
    expect(formatFileSize(1536, 'de')).toBe('1,5 KB');
  });

  it('treats a negative or unreadable size as nothing', () => {
    expect(formatFileSize(-5, 'en')).toBe('0 B');
    expect(formatFileSize(Number.NaN, 'en')).toBe('0 B');
  });
});

describe('matchesAccept', () => {
  it('accepts everything without a list', () => {
    expect(matchesAccept(file('a.exe', 'application/x-msdownload'), '')).toBe(true);
  });

  it('reads extensions, MIME types and families, whatever their case', () => {
    expect(matchesAccept(file('photo.PNG', 'image/png'), '.png')).toBe(true);
    expect(matchesAccept(file('photo.jpg', 'image/jpeg'), 'image/*')).toBe(true);
    expect(matchesAccept(file('doc.pdf', 'application/pdf'), 'image/*, application/pdf')).toBe(true);
    expect(matchesAccept(file('doc.pdf', 'application/pdf'), '.png,.jpg')).toBe(false);
  });
});

describe('checkFiles', () => {
  const rules = { accept: 'image/*', maxSize: MB, multiple: true };

  it('refuses files of other types and files over the size limit, with the reason', () => {
    const big = file('big.png', 'image/png', 2 * MB);
    const text = file('notes.txt', 'text/plain');
    const ok = file('ok.png', 'image/png');
    expect(checkFiles([big, text, ok], rules)).toEqual({
      accepted: [ok],
      refused: [
        { file: big, reason: 'size' },
        { file: text, reason: 'type' },
      ],
    });
  });

  it('takes one file only in a single-file field', () => {
    const first = file('a.png', 'image/png');
    const second = file('b.png', 'image/png');
    expect(checkFiles([first, second], { ...rules, multiple: false })).toEqual({
      accepted: [first],
      refused: [{ file: second, reason: 'count' }],
    });
  });

  it('has no size limit at 0', () => {
    expect(checkFiles([file('huge.png', 'image/png', 900 * MB)], { ...rules, maxSize: 0 }).accepted).toHaveLength(
      1
    );
  });
});

describe('describeAccept', () => {
  it('names the accepted types as people read them, once each', () => {
    expect(describeAccept('.png,.jpg,image/png')).toBe('PNG, JPG');
    expect(describeAccept('image/*, application/pdf')).toBe('images, PDF');
    expect(describeAccept('')).toBe('');
  });
});

describe('isSameFile', () => {
  it('knows a file picked twice', () => {
    expect(
      isSameFile(
        { ...file('a.png', 'image/png'), lastModified: 1 },
        { ...file('a.png', 'image/png'), lastModified: 1 }
      )
    ).toBe(true);
    expect(
      isSameFile(
        { ...file('a.png', 'image/png'), lastModified: 1 },
        { ...file('a.png', 'image/png'), lastModified: 2 }
      )
    ).toBe(false);
  });
});
