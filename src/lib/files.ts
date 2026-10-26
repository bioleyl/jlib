import type { FileCheck, FileLike, FileRefusal, FileRules } from '../types/files.types';

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
const SIZE_STEP = 1024;
// Small values keep one decimal ("1.5 MB"); from ten on, whole numbers are precise enough ("12 MB").
const DECIMALS_BELOW = 10;
const WILDCARD = '/*';
const EXTENSION_MARK = '.';

/** A size in bytes as people read it: `512 B`, `1.5 KB`, `12 MB`, in powers of 1024. */
export function formatFileSize(bytes: number, locale?: string): string {
  const safe = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  const exponent = unitExponent(safe);
  const value = safe / SIZE_STEP ** exponent;
  const decimals = exponent === 0 || value >= DECIMALS_BELOW ? 0 : 1;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: decimals, useGrouping: false });
  return `${number.format(value)} ${SIZE_UNITS[exponent]}`;
}

/** The unit a size is written in; a value that would round up to 1024 of a unit moves to the next one. */
function unitExponent(bytes: number): number {
  const last = SIZE_UNITS.length - 1;
  const exponent = bytes < 1 ? 0 : Math.min(last, Math.floor(Math.log(bytes) / Math.log(SIZE_STEP)));
  const rounded = Math.round(bytes / SIZE_STEP ** exponent);
  return rounded >= SIZE_STEP && exponent < last ? exponent + 1 : exponent;
}

const acceptTokens = (accept: string): string[] =>
  accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token !== '');

/** Whether one entry of an `accept` list takes the file: an extension, a MIME type, or a family such as `image/*`. */
function acceptsToken(token: string, name: string, type: string): boolean {
  if (token.startsWith(EXTENSION_MARK)) {
    return name.endsWith(token);
  }
  if (token.endsWith(WILDCARD)) {
    return type.startsWith(token.slice(0, -1));
  }
  return type === token;
}

/** Whether a file is of a type the `accept` list allows, as `<input type="file" accept>` reads it. Empty allows all. */
export function matchesAccept(file: Pick<FileLike, 'name' | 'type'>, accept: string): boolean {
  const tokens = acceptTokens(accept);
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.length === 0 || tokens.some((token) => acceptsToken(token, name, type));
}

/** Why a file is refused on its own, before counting: its type, then its size; null when it is fine. */
function refusalOf(file: FileLike, rules: FileRules): FileRefusal | null {
  if (!matchesAccept(file, rules.accept)) {
    return 'type';
  }
  if (rules.maxSize > 0 && file.size > rules.maxSize) {
    return 'size';
  }
  return null;
}

/**
 * Sorts files into those a field takes and those it refuses, with the reason. A single-file field takes the first
 * good file and refuses the other good ones as one too many.
 */
export function checkFiles<Item extends FileLike>(files: readonly Item[], rules: FileRules): FileCheck<Item> {
  const result: FileCheck<Item> = { accepted: [], refused: [] };
  for (const file of files) {
    const reason = refusalOf(file, rules);
    if (reason !== null) {
      result.refused.push({ file, reason });
      continue;
    }
    if (!rules.multiple && result.accepted.length > 0) {
      result.refused.push({ file, reason: 'count' });
      continue;
    }
    result.accepted.push(file);
  }
  return result;
}

/** One entry of an `accept` list as people read it: `.png` and `image/png` give `PNG`, `image/*` gives `images`. */
function describeToken(token: string): string {
  if (token.startsWith(EXTENSION_MARK)) {
    return token.slice(1).toUpperCase();
  }
  if (token.endsWith(WILDCARD)) {
    return `${token.slice(0, -WILDCARD.length)}s`;
  }
  return (token.split('/').at(-1) ?? token).toUpperCase();
}

/** An `accept` list as people read it, without repeats: `.png,.jpg,image/png` gives `PNG, JPG`. */
export const describeAccept = (accept: string): string =>
  [...new Set(acceptTokens(accept).map(describeToken))].join(', ');

/** Whether two files are the same one picked twice: same name, size and modification time. */
export const isSameFile = (
  a: FileLike & { lastModified?: number },
  b: FileLike & { lastModified?: number }
): boolean => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
