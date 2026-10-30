// Measures what each component adds to an app's bundle: one minified bundle per component, importing only that
// class from the built library (dist/), the way an app would. Writes site/src/generated/sizes.json for the
// Tree-shaking page. Run after `npm run build:lib`.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { rolldown } from 'rolldown';

const ROOT = join(import.meta.dirname, '..');
const DIST_INDEX = join(ROOT, 'dist', 'index.js');
const OUTPUT = join(ROOT, 'site', 'src', 'generated', 'sizes.json');
const ENTRY_ID = '\0size-entry';
// A class can take type parameters: `export class JlTable<Row extends object = TableRow> extends JlElement {`.
const COMPONENT_PATTERN = /export class (\w+)(?:<[^{]*>)? extends \w+ \{\s+static readonly selector = '([\w-]+)'/g;

if (!existsSync(DIST_INDEX)) {
  console.error('dist/index.js is missing: run npm run build:lib first.');
  process.exit(1);
}

/** The components, from the generated barrel's list of modules. */
function components() {
  const index = readFileSync(join(ROOT, 'src', 'index.ts'), 'utf8');
  const modules = [...index.matchAll(/export \* from '\.\/((?:atoms|molecules|organisms|templates)\/[\w-]+)'/g)];
  return modules.flatMap(([, path]) => {
    const level = path.split('/')[0];
    const file = ['.tsx', '.ts'].map((extension) => join(ROOT, 'src', `${path}${extension}`)).find(existsSync);
    const source = file === undefined ? '' : readFileSync(file, 'utf8');
    return [...source.matchAll(COMPONENT_PATTERN)].map((match) => ({ className: match[1], level, tag: match[2] }));
  });
}

/** Bundles a few lines of an app, minified, and gives the sizes of the result. */
async function measure(code) {
  const bundle = await rolldown({
    input: ENTRY_ID,
    logLevel: 'silent',
    plugins: [
      {
        load: (id) => (id === ENTRY_ID ? code : null),
        name: 'size-entry',
        resolveId: (id) => {
          if (id === ENTRY_ID) {
            return id;
          }
          return id === '@syware/jlib' ? DIST_INDEX : null;
        },
      },
    ],
  });
  const { output } = await bundle.generate({ format: 'es', minify: true });
  await bundle.close();
  const text = output.map((chunk) => (chunk.type === 'chunk' ? chunk.code : '')).join('');
  return { gzip: gzipSync(text).length, raw: Buffer.byteLength(text) };
}

const usage = (names) =>
  `import { ${names.join(', ')} } from '@syware/jlib';\nconsole.log(${names.join(', ')});\n`;

const list = components();
const baseline = await measure(usage(['JlElement']));
const all = await measure(
  `import '@syware/jlib/all';\n`.replace('@syware/jlib/all', join(ROOT, 'dist', 'all.js'))
);
const sizes = [];
for (const component of list) {
  const total = await measure(usage([component.className]));
  sizes.push({ ...component, added: { gzip: total.gzip - baseline.gzip, raw: total.raw - baseline.raw }, total });
}

mkdirSync(join(ROOT, 'site', 'src', 'generated'), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify({ all, baseline, components: sizes }, null, 2)}\n`);

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
console.log(`Baseline (Jadis, tokens, base class): ${kb(baseline.gzip)} gzip`);
console.log(`Everything (@syware/jlib/all): ${kb(all.gzip)} gzip`);
for (const size of sizes) {
  console.log(`${size.tag.padEnd(24)} +${kb(size.added.gzip)} gzip`);
}
console.log(`Wrote ${OUTPUT}`);
