// What the documentation site's pages say of themselves, read from their sources: each component's name, class, tag,
// level and summary, and each UX pattern's title, label, icon, summary and lead. The site lists them from the indexes
// written from it (site/src/generated), loading a page's full doc only when it opens. The skills' references need
// all a page says: skill-references.mjs writes them from the pages loaded whole (doc-modules.mjs).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DOC_FILE = /^jl-.+\.doc\.ts$/;
const COMPONENT_FIELDS = ['className', 'level', 'name', 'summary', 'tag'];
const PATTERN_FIELDS = ['icon', 'label', 'lead', 'path', 'summary', 'title'];
const LEVELS = [
  { heading: 'Atoms', level: 'atom' },
  { heading: 'Molecules', level: 'molecule' },
  { heading: 'Organisms', level: 'organism' },
  { heading: 'Templates', level: 'template' },
];
const PATTERN_PATH = /^\/patterns\//;
const TS_FILE = /\.ts$/;
const ESCAPE = /\\(.)/g;
// A string as Biome writes it: in single quotes, or in double quotes when it holds an apostrophe.
const STRING = String.raw`(['"])((?:(?!\1)[^\\]|\\.)*)\1`;
const PATTERN_ORDER = /PATTERN_SLUGS[^=]*=\s*\[([^\]]*)\]/;
const QUOTED = /'([^']+)'/g;

const unescaped = (text) => text.replace(ESCAPE, '$1');

// A field of a page's object, at its first indentation (`  summary: 'A button…',`), the string on the next line when
// it is long.
const fieldPattern = (field) => new RegExp(String.raw`^ {2}${field}:\s*${STRING}`, 'm');

/** The fields of one page; a page they cannot be read from stops the generation. */
function fieldsOf(path, fields) {
  const source = readFileSync(path, 'utf8');
  const entries = fields.map((field) => [field, fieldPattern(field).exec(source)?.[2]]);
  const missing = entries.filter(([, value]) => value === undefined).map(([field]) => field);
  if (missing.length > 0) {
    throw new Error(`${path}: no ${missing.join(', ')} written as a plain string at the top of its object.`);
  }
  return Object.fromEntries(entries.map(([field, value]) => [field, unescaped(value)]));
}

const levelIndex = (level) => LEVELS.findIndex((entry) => entry.level === level);

/** Every documented component, by level then by name, as the site lists them. */
export function componentPages(docsDirectory) {
  return readdirSync(docsDirectory)
    .filter((file) => DOC_FILE.test(file))
    .map((file) => fieldsOf(join(docsDirectory, file), COMPONENT_FIELDS))
    .sort((a, b) => levelIndex(a.level) - levelIndex(b.level) || a.name.localeCompare(b.name, 'en'));
}

/** A pattern page's fields and slug; its file must be named after its address. */
function patternOf(directory, file) {
  const pattern = fieldsOf(join(directory, file), PATTERN_FIELDS);
  const slug = pattern.path.replace(PATTERN_PATH, '');
  if (`${slug}.ts` !== file) {
    throw new Error(`${file}: its path is ${pattern.path}, so its file should be ${slug}.ts.`);
  }
  return { ...pattern, slug };
}

/** Every pattern page, in the reading order `PATTERN_SLUGS` gives in the list file; each file listed once. */
export function patternPages(patternsDirectory, listFile) {
  const slugs = [...(PATTERN_ORDER.exec(readFileSync(listFile, 'utf8'))?.[1] ?? '').matchAll(QUOTED)].map(
    (match) => match[1]
  );
  const files = readdirSync(patternsDirectory).filter((file) => TS_FILE.test(file));
  const unlisted = files.filter((file) => !slugs.includes(file.replace(TS_FILE, '')));
  const missing = slugs.filter((slug) => !files.includes(`${slug}.ts`));
  if (unlisted.length > 0 || missing.length > 0) {
    throw new Error(
      `${listFile}: PATTERN_SLUGS should list every pattern page once (${[...unlisted, ...missing]}).`
    );
  }
  return slugs.map((slug) => patternOf(patternsDirectory, `${slug}.ts`));
}
