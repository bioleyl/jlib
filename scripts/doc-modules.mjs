// Loads the documentation pages themselves (site/src/docs), in Node, for what needs all they say: the skills'
// references. Node strips their types; these hooks resolve what Vite would: imports without an extension, the
// `?raw` snippet files, `@syware/jlib/<path>` (the library's sources, the pure helpers a page uses). The values a page
// imports from `@syware/jlib` itself serve only in its examples' `setup`, which runs in a browser: here they are inert
// stand-ins, so that loading a page never loads the components.
import { readdirSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const LIBRARY = '@syware/jlib';
const LIBRARY_PATH = `${LIBRARY}/`;
const STAND_IN = 'jlib-stand-in:';
const RAW = '?raw';
const DOC_FILE = /^jl-.+\.doc\.ts$/;
const TS_FILE = /\.ts$/;
const HAS_EXTENSION = /\.\w+$/;
// `import { JlBadge, toast } from '@syware/jlib';`: the names a page takes from the library, types left out.
const LIBRARY_IMPORT = /^import \{([^}]*)\} from '@syware\/jlib';$/gm;
const TYPE_ONLY = /^type\s/;

/** The values a module imports from the library by name. */
function libraryNames(parentUrl) {
  const source = readFileSync(fileURLToPath(parentUrl), 'utf8');
  return [...source.matchAll(LIBRARY_IMPORT)]
    .flatMap((match) => (match[1] ?? '').split(','))
    .map((name) => name.trim())
    .filter((name) => name !== '' && !TYPE_ONLY.test(name));
}

// Whatever is done with it gives itself back: a class to extend, a function to call, an object to read.
const STAND_IN_SOURCE =
  'const standIn = new Proxy(function standIn() {}, { apply: () => standIn, construct: () => standIn, get: () => standIn });';

registerHooks({
  load(url, context, nextLoad) {
    if (url.startsWith(STAND_IN)) {
      const names = url.slice(STAND_IN.length).split(',').filter(Boolean);
      const exports = names.map((name) => `export const ${name} = standIn;`);
      return { format: 'module', shortCircuit: true, source: [STAND_IN_SOURCE, ...exports].join('\n') };
    }
    if (url.endsWith(RAW)) {
      const text = readFileSync(fileURLToPath(url.slice(0, -RAW.length)), 'utf8');
      return { format: 'module', shortCircuit: true, source: `export default ${JSON.stringify(text)};` };
    }
    return nextLoad(url, context);
  },
  resolve(specifier, context, nextResolve) {
    if (specifier === LIBRARY) {
      return { shortCircuit: true, url: `${STAND_IN}${libraryNames(context.parentURL).join(',')}` };
    }
    if (specifier.startsWith(LIBRARY_PATH)) {
      return nextResolve(pathToFileURL(join(SRC, `${specifier.slice(LIBRARY_PATH.length)}.ts`)).href, context);
    }
    if (specifier.endsWith(RAW)) {
      return {
        shortCircuit: true,
        url: `${new URL(specifier.slice(0, -RAW.length), context.parentURL).href}${RAW}`,
      };
    }
    if (specifier.startsWith('.') && !HAS_EXTENSION.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const importFile = (path) => import(pathToFileURL(path).href);

/** Every component's documentation page (`doc` of its `.doc.ts`), in the order of the files. */
export async function componentDocs(directory) {
  const files = readdirSync(directory)
    .filter((file) => DOC_FILE.test(file))
    .sort();
  const modules = await Promise.all(files.map((file) => importFile(join(directory, file))));
  return modules.map((module) => module.doc);
}

/** The pattern pages (`pattern` of each file), by slug. */
export async function patternDocs(directory) {
  const files = readdirSync(directory).filter((file) => TS_FILE.test(file));
  const modules = await Promise.all(files.map((file) => importFile(join(directory, file))));
  return new Map(modules.map((module, index) => [files[index]?.replace(TS_FILE, ''), module.pattern]));
}

/** A module of the site's sources, such as its snippet helpers. */
export const siteModule = (path) => importFile(join(ROOT, 'site', 'src', path));
