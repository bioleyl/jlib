// Writes the package's version into the manifest of each Claude plugin the marketplace lists, and stages them.
// `npm version` runs it (the `version` script) after the bump and before its commit, which takes the manifests along:
// Claude Code gives a plugin's users a new copy only when its version changes.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const MARKETPLACE = join(ROOT, '.claude-plugin', 'marketplace.json');
const INDENT = 2;

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const { version } = readJson(join(ROOT, 'package.json'));
const manifests = readJson(MARKETPLACE).plugins.map((plugin) =>
  join(ROOT, plugin.source, '.claude-plugin', 'plugin.json')
);
for (const manifest of manifests) {
  writeFileSync(manifest, `${JSON.stringify({ ...readJson(manifest), version }, null, INDENT)}\n`);
}
execFileSync('git', ['add', ...manifests], { cwd: ROOT });
console.log(`The Claude plugins are at ${version}.`);
