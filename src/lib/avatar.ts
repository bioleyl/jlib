// FNV-1a, 32 bits: spreads similar names over the palette, and gives the same colour to a name on every page.
const HASH_SEED = 2166136261;
const HASH_PRIME = 16777619;

const MAX_INITIALS = 2;
const WORDS = /\s+/;
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** The first letter or digit of a word, whole even outside the basic plane; its first character otherwise. */
const firstLetter = (word: string): string => {
  const characters = Array.from(word);
  return characters.find((character) => LETTER_OR_DIGIT.test(character)) ?? characters[0] ?? '';
};

/** A name's initials, at most two: "Ada Lovelace" gives AL, "Grace" gives G, "Jean-Luc Picard" gives JP. */
export function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(WORDS)
    .filter((word) => word !== '');
  if (words.length === 0) {
    return '';
  }
  const ends = words.length === 1 ? words : [words[0] ?? '', words.at(-1) ?? ''];
  return ends.slice(0, MAX_INITIALS).map(firstLetter).join('').toLocaleUpperCase();
}

/** A number for a text, always the same for the same text. */
export function stableHash(text: string): number {
  return Array.from(text).reduce(
    (hash, character) => Math.imul(hash ^ (character.codePointAt(0) ?? 0), HASH_PRIME) >>> 0,
    HASH_SEED
  );
}

/** One of the options, chosen by the key: the same key always gets the same option. */
export function pickStable<Option>(key: string, options: readonly [Option, ...Option[]]): Option {
  return options[stableHash(key) % options.length] ?? options[0];
}

/** The items a group shows, and those it only counts ("+3"); a `max` of 0 or less shows them all. */
export function splitVisible<Item>(items: readonly Item[], max: number): { shown: Item[]; hidden: Item[] } {
  if (max <= 0 || items.length <= max) {
    return { hidden: [], shown: [...items] };
  }
  return { hidden: items.slice(max), shown: items.slice(0, max) };
}
