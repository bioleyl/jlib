/** What the checks need of a file: a `File` fits, and so does a plain object in tests. */
export type FileLike = { name: string; type: string; size: number };

/** Why a file was refused: not of an accepted type, too large, or one too many for a single-file field. */
export type FileRefusal = 'type' | 'size' | 'count';

/** What a field takes: the `accept` list of an `<input type="file">`, a size limit in bytes (0: none), and how many. */
export type FileRules = { accept: string; maxSize: number; multiple: boolean };

export type RefusedFile<Item extends FileLike = FileLike> = { file: Item; reason: FileRefusal };

/** The files a field takes, and those it refuses with the reason. */
export type FileCheck<Item extends FileLike = FileLike> = { accepted: Item[]; refused: RefusedFile<Item>[] };
