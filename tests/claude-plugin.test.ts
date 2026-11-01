// The Claude Code plugins of plugins/, as their marketplace (.claude-plugin/marketplace.json) lists them. Claude Code
// copies a plugin's folder alone when it installs it: what its skill links to must be inside.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import marketplace from '../.claude-plugin/marketplace.json';
import packageJson from '../package.json';

const ROOT = join(import.meta.dirname, '..');
const LINK_TARGET = /\]\(([^)\s]+)\)/g;
const ADDRESS = /^[a-z]+:\/\//;
// Each plugin holds one skill, of its own name.
const PLUGINS = marketplace.plugins.map((entry) => {
  const folder = join(ROOT, entry.source);
  const skillFolder = join(folder, 'skills', entry.name);
  return {
    entry,
    manifest: join(folder, '.claude-plugin', 'plugin.json'),
    skill: readFileSync(join(skillFolder, 'SKILL.md'), 'utf8'),
    skillFolder,
  };
});

const localLinks = (markdown: string): string[] =>
  [...markdown.matchAll(LINK_TARGET)].map((match) => match[1] ?? '').filter((target) => !ADDRESS.test(target));

describe.each(PLUGINS)('the Claude plugin $entry.name', ({ entry, manifest, skill, skillFolder }) => {
  it('lies in its own folder of plugins/', () => {
    expect(entry.source).toBe(`./plugins/${entry.name}`);
  });

  it("has its name and the package's version, written in its manifest only", () => {
    expect(JSON.parse(readFileSync(manifest, 'utf8'))).toMatchObject({
      name: entry.name,
      version: packageJson.version,
    });
    expect('version' in entry).toBe(false);
  });

  it('holds its skill, named and described for Claude to find it', () => {
    expect(skill).toMatch(new RegExp(`^---\\nname: ${entry.name}\\ndescription: \\S.+\\n---\\n`));
  });

  it('links its skill only to files inside the plugin', () => {
    const local = localLinks(skill);
    expect(local.length).toBeGreaterThan(0);
    expect(local.filter((target) => !existsSync(join(skillFolder, target)))).toEqual([]);
  });
});

describe('the marketplace', () => {
  it('lists the jlib plugin, and syware-ux beside it', () => {
    expect(marketplace.plugins.map((entry) => entry.name)).toEqual(['jlib', 'syware-ux']);
  });
});
