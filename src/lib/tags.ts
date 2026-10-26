// What separates tags in typed or pasted text: commas, and the line breaks and tabs of a pasted list.
const TAG_SEPARATORS = /[,\n\r\t]/;

/** The tags in a text: `"a, b,,c"` gives `["a", "b", "c"]`. */
export const splitTags = (text: string): string[] =>
  text
    .split(TAG_SEPARATORS)
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '');

/** Whether a text holds a separator, so that it adds several tags rather than being typed as one. */
export const hasTagSeparator = (text: string): boolean => TAG_SEPARATORS.test(text);

const sameTag = (a: string, b: string): boolean => a.toLocaleLowerCase() === b.toLocaleLowerCase();

/** Whether the list already holds the tag, whatever its case. */
export const hasTag = (tags: readonly string[], tag: string): boolean =>
  tags.some((existing) => sameTag(existing, tag));

/**
 * Adds tags to a list: blanks are dropped, a tag already there (whatever its case) is a duplicate, and nothing is
 * added past `max` tags (0: no limit). Gives the new list and the duplicates met, so the field can point at them.
 */
export function addTags(
  tags: readonly string[],
  candidates: readonly string[],
  max: number
): { tags: string[]; duplicates: string[] } {
  const result = { duplicates: [] as string[], tags: [...tags] };
  for (const candidate of candidates.map((tag) => tag.trim()).filter((tag) => tag !== '')) {
    if (hasTag(result.tags, candidate)) {
      result.duplicates.push(candidate);
      continue;
    }
    if (max > 0 && result.tags.length >= max) {
      break;
    }
    result.tags.push(candidate);
  }
  return result;
}
