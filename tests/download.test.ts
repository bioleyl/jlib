import { describe, expect, it } from 'vitest';

import { answerError, dispositionFileName, readWithProgress, urlFileName } from '../src/lib/download';
import { fillText } from '../src/lib/text';

describe('dispositionFileName', () => {
  it('reads the UTF-8 name first, then the plain one, and nothing without either', () => {
    expect(dispositionFileName(`attachment; filename="a.pdf"; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf`)).toBe(
      'résumé.pdf'
    );
    expect(dispositionFileName('attachment; filename="fonds.mets.xml"')).toBe('fonds.mets.xml');
    expect(dispositionFileName('attachment; filename=package.nt')).toBe('package.nt');
    expect(dispositionFileName('attachment')).toBeUndefined();
    expect(dispositionFileName(null)).toBeUndefined();
  });
});

describe('urlFileName', () => {
  it("takes the address's last segment, decoded, or the fallback", () => {
    expect(urlFileName('/api/v1/files/letter%201902.pdf?version=v2', 'download')).toBe('letter 1902.pdf');
    expect(urlFileName('https://example.org/', 'download')).toBe('download');
  });
});

describe('answerError', () => {
  it("reads the engines' error, a plain message, or says the status", () => {
    expect(answerError({ error: { code: 'NOT_FOUND', message: 'No such entity' } }, 404)).toBe('No such entity');
    expect(answerError({ error: 'bad format' }, 400)).toBe('bad format');
    expect(answerError({ message: 'Too large' }, 413)).toBe('Too large');
    expect(answerError(null, 502)).toBe('HTTP 502');
  });
});

describe('readWithProgress', () => {
  it('reads every byte, saying how many came at most once per interval, and at the end', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const part of ['abc', 'de', 'f']) {
          controller.enqueue(encoder.encode(part));
        }
        controller.close();
      },
    });
    const reported: number[] = [];
    // Each chunk reads the clock, and once more when it reports: the third comes too soon after the second.
    const clock = [0, 0, 100, 100];
    const blob = await readWithProgress(
      new Response(body, { headers: { 'content-type': 'text/plain' } }),
      (received) => reported.push(received),
      50,
      () => clock.shift() ?? 100
    );
    expect(await blob.text()).toBe('abcdef');
    expect(blob.type).toBe('text/plain');
    expect(reported).toEqual([3, 5, 6]);
  });
});

describe('fillText', () => {
  it('fills the placeholders it has values for, and leaves the others', () => {
    expect(fillText('Saved as {name}, {size}', { name: 'a.pdf', size: '2 KB' })).toBe('Saved as a.pdf, 2 KB');
    expect(fillText('{received} of {total}', { received: '1 MB' })).toBe('1 MB of {total}');
  });
});
