// What `download()` needs of a server's answer: the file's name, what went wrong, and its bytes as they come.

const FILE_NAME_UTF8 = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/;
const FILE_NAME = /filename\s*=\s*"?([^";]+)"?/;
// Long enough for the browser to start the download before the address is freed.
const REVOKE_DELAY_MS = 1000;
const ADDRESS_BASE = 'http://localhost/';

/** The file name a Content-Disposition header gives (its UTF-8 form first), or none. */
export function dispositionFileName(header: string | null): string | undefined {
  const utf8 = FILE_NAME_UTF8.exec(header ?? '')?.[1];
  if (utf8 !== undefined) {
    return decodeURIComponent(utf8.trim());
  }
  return FILE_NAME.exec(header ?? '')?.[1]?.trim() || undefined;
}

/** A file name for an address: its last path segment, or the fallback when it has none. */
export function urlFileName(url: string, fallback: string): string {
  const segment = new URL(url, ADDRESS_BASE).pathname.split('/').at(-1) ?? '';
  return segment === '' ? fallback : decodeURIComponent(segment);
}

/** What a failed answer's body says: `{ error: { message } }`, `{ error: "…" }`, `{ message }`, or its status. */
export function answerError(body: unknown, status: number): string {
  const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const error = record.error;
  const nested =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>).message : undefined;
  const message = [nested, error, record.message].find((value): value is string => typeof value === 'string');
  return message ?? `HTTP ${status}`;
}

/** Reads an answer to its end, saying how many bytes came at most once per interval, and once more at the end. */
export async function readWithProgress(
  response: Response,
  onProgress: (received: number) => void,
  intervalMs: number,
  now: () => number = () => performance.now()
): Promise<Blob> {
  const type = response.headers.get('content-type') ?? '';
  if (response.body === null) {
    return response.blob();
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const progress = { received: 0, reported: Number.NEGATIVE_INFINITY, said: 0 };
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    chunks.push(chunk.value);
    progress.received += chunk.value.byteLength;
    if (now() - progress.reported >= intervalMs) {
      progress.reported = now();
      progress.said = progress.received;
      onProgress(progress.received);
    }
  }
  if (progress.said !== progress.received) {
    onProgress(progress.received);
  }
  return new Blob(chunks, { type });
}

/** Hands a file to the browser, which saves it under that name. */
export function saveBlob(blob: Blob, name: string): void {
  const link = document.createElement('a');
  link.download = name;
  link.href = URL.createObjectURL(blob);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), REVOKE_DELAY_MS);
}
