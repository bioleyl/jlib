// Lets the site load each component with the page that shows it. A page, a doc or a pattern writes jl-* tags in HTML
// (its examples, its previews), which a bundler cannot see: each of the site's modules gets a `define()` of the
// classes of the tags it writes, so the bundler puts a component in the chunk of the page that uses it (the shell's
// in the main bundle, jl-table with the Table doc), instead of every component in every page.
import { readFileSync } from 'node:fs';

import type { Plugin } from 'vite';

const SITE_MODULE = /\/site\/src\/.+\.tsx?$/;
// A tag where the code writes one: in HTML or JSX (`<jl-table`), or in a string (`createElement('jl-button')`,
// a doc's `tag: 'jl-badge'`). A custom property (`--jl-accent`) or a class (`.jl-x`) is no tag.
const TAG = /(?<=[<'"`])jl-[a-z]+(?:-[a-z]+)*/g;
const LIBRARY = '@syware/jlib';
const ALIAS = '__siteDefined';

/** The class of each component, by tag, from the site's generated index of components. */
function classesByTag(indexFile: string): Map<string, string> {
  const index: unknown = JSON.parse(readFileSync(indexFile, 'utf8'));
  const entries = Array.isArray(index) ? index : [];
  return new Map(
    entries.flatMap((entry: unknown) =>
      typeof entry === 'object' && entry !== null && 'tag' in entry && 'className' in entry
        ? [[String(entry.tag), String(entry.className)] as const]
        : []
    )
  );
}

export function defineWrittenTags(indexFile: string): Plugin {
  const known = { classes: new Map<string, string>() };
  return {
    buildStart() {
      this.addWatchFile(indexFile);
      known.classes = classesByTag(indexFile);
    },
    // On the module as written, before its JSX turns into calls.
    enforce: 'pre',
    name: 'site-define-written-tags',
    transform(code, id) {
      if (id.includes('?') || !SITE_MODULE.test(id)) {
        return null;
      }
      const classes = [...new Set(code.match(TAG) ?? [])].flatMap((tag) => known.classes.get(tag) ?? []);
      if (classes.length === 0) {
        return null;
      }
      const aliases = classes.map((name) => `${name} as ${ALIAS}${name}`).join(', ');
      // At the end, so that no line of the module moves: imports are hoisted, and the define runs before anything
      // the module draws, which happens once a page connects.
      return {
        code: `${code}\nimport { define as ${ALIAS}, ${aliases} } from '${LIBRARY}';\n${ALIAS}(${classes.map((name) => `${ALIAS}${name}`).join(', ')});\n`,
        map: null,
      };
    },
  };
}
