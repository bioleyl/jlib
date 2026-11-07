// Writes the package's version into the manifest of each Claude plugin the marketplace lists, and into the skills'
// files that name it (`@syware/jlib@<version>`: the release a skill describes, a CDN address), and stages them.
// `npm version` runs it (the `version` script) after the bump and before its commit, which takes the files along:
// Claude Code gives a plugin's users a new copy only when its version changes.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const MARKETPLACE = join(ROOT, '.claude-plugin', 'marketplace.json');
const INDENT = 2;
const VERSION_MENTION = /@syware\/jlib@\d+\.\d+\.\d+[\w.-]*/g;

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const { version } = readJson(join(ROOT, 'package.json'));
const plugins = readJson(MARKETPLACE).plugins.map((plugin) => join(ROOT, plugin.source));

const manifests = plugins.map((folder) => join(folder, '.claude-plugin', 'plugin.json'));
for (const manifest of manifests) {
  writeFileSync(manifest, `${JSON.stringify({ ...readJson(manifest), version }, null, INDENT)}\n`);
}

const skillFiles = plugins.flatMap((folder) =>
  readdirSync(join(folder, 'skills'), { recursive: true })
    .map(String)
    .filter((path) => path.endsWith('.md'))
    .map((path) => join(folder, 'skills', path))
);
const named = skillFiles.filter((file) => {
  const text = readFileSync(file, 'utf8');
  const updated = text.replace(VERSION_MENTION, `@syware/jlib@${version}`);
  if (updated === text) {
    return false;
  }
  writeFileSync(file, updated);
  return true;
});

execFileSync('git', ['add', ...manifests, ...named], { cwd: ROOT });
console.log(`The Claude plugins and their skills are at ${version}.`);
