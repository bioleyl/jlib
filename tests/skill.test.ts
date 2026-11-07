// The skills of plugins/, as each way of installing them finds them: the Claude Code marketplace
// (.claude-plugin/marketplace.json, which skills.sh reads too) and install-skill.sh. Claude Code copies a plugin's
// folder alone when it installs it: what a skill links to must be inside.
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, normalize, relative } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import marketplace from '../.claude-plugin/marketplace.json';
import packageJson from '../package.json';

const ROOT = join(import.meta.dirname, '..');
const MAIN_SKILL = 'jlib-official';
const UX_SKILL = 'syware-ux';
const JADIS_SKILL = 'jadis-official';
const JADIS_MARKETPLACE = 'jadis';
const LINK_TARGET = /\]\(([^)\s]+)\)/g;
const ADDRESS = /^[a-z]+:/;
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;
const HEADING = /^#{1,6} (.+)$/gm;
const FENCE = /^```[\s\S]*?^```/gm;
const VERSION_MENTION = /@syware\/jlib@(\d+\.\d+\.\d+[\w.-]*)/g;
// The Agent Skills specification (agentskills.io): a lowercase name of hyphenated words, at most 64 characters.
const SKILL_NAME_RULE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;
const MAX_SKILL_LINES = 500;

type Manifest = { name: string; version: string; dependencies?: unknown[] };

/** The frontmatter's fields, each on one line. */
function frontmatterOf(markdown: string): Record<string, string> {
  const block = FRONTMATTER.exec(markdown)?.[1] ?? '';
  return Object.fromEntries(
    block.split('\n').map((line) => {
      const separator = line.indexOf(': ');
      return [line.slice(0, separator), line.slice(separator + 2)];
    })
  );
}

/** GitHub's anchor for a heading: lowercase, punctuation dropped, spaces as hyphens. */
const anchorOf = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');

const withoutCode = (markdown: string): string => markdown.replace(FENCE, '');

const anchorsOf = (markdown: string): Set<string> =>
  new Set([...withoutCode(markdown).matchAll(HEADING)].map((match) => anchorOf(match[1] ?? '')));

const localLinks = (markdown: string): string[] =>
  [...withoutCode(markdown).matchAll(LINK_TARGET)]
    .map((match) => match[1] ?? '')
    .filter((target) => !ADDRESS.test(target));

const markdownFiles = (folder: string): string[] =>
  readdirSync(folder, { recursive: true })
    .map(String)
    .filter((path) => path.endsWith('.md'))
    .map((path) => join(folder, path));

/** The links of a file that lead to no file, or to no heading of their file. */
function brokenLinks(file: string): string[] {
  return localLinks(readFileSync(file, 'utf8')).filter((link) => {
    const [path, anchor] = link.split('#');
    const target = path ? join(dirname(file), path) : file;
    if (!existsSync(target)) {
      return true;
    }
    return anchor !== undefined && !anchorsOf(readFileSync(target, 'utf8')).has(anchor);
  });
}

/** Every Markdown file reached from SKILL.md, following its links from file to file. */
function reachedFrom(skillFile: string): Set<string> {
  const reached = new Set<string>([normalize(skillFile)]);
  const queue = [skillFile];
  for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
    for (const link of localLinks(readFileSync(file, 'utf8'))) {
      const target = normalize(join(dirname(file), link.split('#')[0] || relative(dirname(file), file)));
      if (target.endsWith('.md') && existsSync(target) && !reached.has(target)) {
        reached.add(target);
        queue.push(target);
      }
    }
  }
  return reached;
}

const manifestOf = (source: string): Manifest =>
  JSON.parse(readFileSync(join(ROOT, source, '.claude-plugin', 'plugin.json'), 'utf8')) as Manifest;

describe('the marketplace', () => {
  it(`lists ${MAIN_SKILL}, and ${UX_SKILL} beside it`, () => {
    expect(marketplace.plugins.map((entry) => entry.name)).toEqual([MAIN_SKILL, UX_SKILL]);
  });

  it(`lets ${MAIN_SKILL} bring ${JADIS_SKILL} from the ${JADIS_MARKETPLACE} marketplace`, () => {
    expect(marketplace.allowCrossMarketplaceDependenciesOn).toEqual([JADIS_MARKETPLACE]);
    expect(manifestOf(`plugins/${MAIN_SKILL}`).dependencies).toEqual([
      { marketplace: JADIS_MARKETPLACE, name: JADIS_SKILL },
    ]);
  });

  it(`lets ${UX_SKILL} bring ${MAIN_SKILL}, whose components it applies the patterns with`, () => {
    expect(manifestOf(`plugins/${UX_SKILL}`).dependencies).toEqual([MAIN_SKILL]);
  });
});

// Each plugin holds one skill, of its own name.
describe.each(marketplace.plugins)('the plugin $name', (entry) => {
  const folder = join(ROOT, entry.source);
  const skillFolder = join(folder, 'skills', entry.name);
  const skillFile = join(skillFolder, 'SKILL.md');
  const skill = readFileSync(skillFile, 'utf8');
  const frontmatter = frontmatterOf(skill);

  it('lies in its own folder of plugins/', () => {
    expect(entry.source).toBe(`./plugins/${entry.name}`);
  });

  it("has its name and the package's version, written in its manifest only", () => {
    expect(manifestOf(entry.source)).toMatchObject({ name: entry.name, version: packageJson.version });
    expect('version' in entry).toBe(false);
  });

  it('holds one skill, in a folder of the same name', () => {
    expect(readdirSync(join(folder, 'skills'))).toEqual([entry.name]);
  });

  it('names its skill as the specification asks, after its folder', () => {
    expect(frontmatter.name).toBe(entry.name);
    expect(frontmatter.name).toMatch(SKILL_NAME_RULE);
    expect(frontmatter.name?.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
    expect(frontmatter.license).toBe(packageJson.license);
  });

  it('describes what its skill does and when to load it, within the length agents read', () => {
    expect(frontmatter.description?.length ?? 0).toBeGreaterThan(0);
    expect(frontmatter.description?.length ?? 0).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
  });

  it('keeps SKILL.md short, the details in its references', () => {
    expect(skill.split('\n').length).toBeLessThanOrEqual(MAX_SKILL_LINES);
  });

  it("names the package's version wherever it names one", () => {
    const mentions = markdownFiles(skillFolder).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(VERSION_MENTION)].map((match) => match[1])
    );
    expect(skill).toContain(`\`@syware/jlib@${packageJson.version}\``);
    expect(new Set(mentions)).toEqual(new Set([packageJson.version]));
  });

  it('links only to files of the plugin, and to headings they have', () => {
    const broken = markdownFiles(skillFolder).flatMap((file) =>
      brokenLinks(file).map((link) => `${relative(skillFolder, file)} → ${link}`)
    );
    expect(broken).toEqual([]);
  });

  it('reaches each of its references from SKILL.md', () => {
    const reached = reachedFrom(skillFile);
    expect(markdownFiles(skillFolder).filter((file) => !reached.has(normalize(file)))).toEqual([]);
  });
});

describe('install-skill.sh', () => {
  const work = mkdtempSync(join(tmpdir(), 'jlib-skill-'));
  const home = join(work, 'home');
  const jadis = join(work, JADIS_SKILL);
  mkdirSync(home);
  mkdirSync(jadis);
  writeFileSync(join(jadis, 'SKILL.md'), `---\nname: ${JADIS_SKILL}\ndescription: Jadis.\n---\n`);

  // The home the script installs into, and Jadis's skill from a folder: the test stays offline.
  const env: NodeJS.ProcessEnv = { ...process.env };
  env.HOME = home;
  env.JADIS_SKILL_SOURCE = jadis;

  const install = (...args: string[]): string =>
    execFileSync('sh', [join(ROOT, 'install-skill.sh'), ...args], {
      env,
      input: '',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).toString();

  afterAll(() => rmSync(work, { force: true, recursive: true }));

  it(`copies ${MAIN_SKILL} of this clone, and ${JADIS_SKILL}, into the folders asked`, () => {
    install('--target', 'agents', '--target', 'claude');

    for (const folder of ['.agents/skills', '.claude/skills']) {
      expect(readdirSync(join(home, folder)).sort()).toEqual([JADIS_SKILL, MAIN_SKILL]);
      expect(existsSync(join(home, folder, MAIN_SKILL, 'references', 'components', 'jl-table.md'))).toBe(true);
    }
  });

  it(`brings ${MAIN_SKILL} along with ${UX_SKILL}, and leaves ${JADIS_SKILL} out when asked`, () => {
    const folder = join(work, 'ux');
    install('--target', folder, '--skill', UX_SKILL, '--no-jadis');

    expect(readdirSync(folder).sort()).toEqual([MAIN_SKILL, UX_SKILL]);
    expect(existsSync(join(folder, UX_SKILL, 'references', 'patterns', 'checklist.md'))).toBe(true);
  });

  it("links jlib's skills to this clone when asked", () => {
    install('--target', 'agents', '--link', '--yes');

    expect(lstatSync(join(home, '.agents/skills', MAIN_SKILL)).isSymbolicLink()).toBe(true);
    expect(lstatSync(join(home, '.agents/skills', JADIS_SKILL)).isDirectory()).toBe(true);
  });

  it('writes nothing when one of the targets is unknown', () => {
    expect(() => install('--target', join(work, 'first'), '--target', 'nowhere')).toThrow(
      /unknown target: nowhere/
    );
    expect(existsSync(join(work, 'first'))).toBe(false);
  });
});
