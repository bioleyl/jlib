import { css } from '@jadis/core';
import { JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { codeSample } from '../lib/blocks';
import { JLIB_SKILL_URL, PLUGINS_URL, UX_SKILL_URL } from '../lib/project';
import { pageHref } from '../services/navigation';
import { PROSE_STYLES } from '../styles/site-styles';
import guideStyles from './guide-page.css?inline';
import styles from './vibe-coding-page.css?inline';

const PROMPTS: readonly string[] = [
  'Start a SyWare app on jlib: the frame with its side nav, an Orders page and a Customers page, both empty for now.',
  'Make Orders a list of the orders from /api/orders, with a search and filters by status in the address.',
  'Add a New order dialog to the Orders page, the way the patterns create things.',
  'Go through the checklist for the Customers page and fix what it misses.',
];

/** Building apps on jlib with a coding agent, and the two skills that teach it jlib and SyWare's UX. */
export class VibeCodingPage extends JlElement {
  static readonly selector = 'site-vibe-coding-page';

  templateHtml(): Node {
    return (
      <article class="page">
        <header class="intro">
          <p class="label">Guide</p>
          <h1>Vibe coding</h1>
          <p class="lead">
            Build an app on jlib by asking a coding agent for it. Two skills teach the agent:{' '}
            <code>jlib-official</code>, the components and the way an app is written on them, and{' '}
            <code>syware-ux</code>, how SyWare's apps behave. They work with Claude Code, Codex, Cursor, Gemini
            CLI, GitHub Copilot, OpenCode, and any agent that reads{' '}
            <a href="https://agentskills.io" target="_blank" rel="noopener">
              Agent Skills
            </a>
            .
          </p>
        </header>

        <section>
          <h2>Two skills</h2>
          <div class="grid plugins">
            <div class="card">
              <h3>jlib-official</h3>
              <p>For any app on jlib.</p>
              <ul>
                <li>
                  <strong>Every component</strong>, what it is for, and its whole API: properties, events, slots,
                  methods, parts and examples, written from this site's pages, so the agent reads them offline.
                </li>
                <li>
                  <strong>An app, file by file</strong>: the frame and its router, a list that searches and
                  creates, a detail page, a settings form; checked by TypeScript, run in jsdom and in a browser.
                </li>
                <li>
                  <strong>Views the jlib way</strong>: components by class in JSX, inputs and events, typed by the
                  page's data, data in load states, real forms, the look from the <code>--jl-*</code> tokens,
                  jlib's texts in the app's language.
                </li>
                <li>
                  <strong>The mistakes agents make</strong> with jlib, each with what to write instead, and a{' '}
                  <strong>self-check</strong> the agent runs on its own code before it shows it to you.
                </li>
                <li>
                  <strong>What to report</strong>: a bug in jlib, an improvement or a missing component becomes an
                  issue on jlib's repository, which the agent writes for you to file.
                </li>
              </ul>
            </div>
            <div class="card">
              <h3>syware-ux</h3>
              <p>For SyWare's apps, and those that want to behave like them. It goes with jlib-official.</p>
              <ul>
                <li>
                  <strong>The principles</strong> every SyWare app follows, and the rules a page is built by.
                </li>
                <li>
                  <strong>
                    Each of the <a href={pageHref('/patterns')}>UX patterns</a> in full
                  </strong>
                  , offline: the frame, pages, lists, actions and their words, forms, states, feedback,
                  confirmations, statuses, search, phones and accounts, with the components that do them.
                </li>
                <li>
                  <strong>What generic web habits do</strong> to a SyWare page: a spinner page, a toast for
                  everything, "Are you sure?", a red button in the header.
                </li>
                <li>
                  <strong>The checklist</strong> a finished page is reviewed with.
                </li>
              </ul>
            </div>
          </div>
          <p>
            Each skill is a short <code>SKILL.md</code>, which every session reads, and references the agent opens
            when the task needs them. jlib's skills build on Jadis's, <code>jadis-official</code>, which the three
            ways below install with them.
          </p>
        </section>

        <section>
          <h2>Install them</h2>

          <h3>Claude Code: the plugins</h3>
          <p>
            jlib's repository is a plugin marketplace, and so is Jadis's. Add both once, then install the plugins:{' '}
            <code>jlib-official</code> brings <code>jadis-official</code> along, and <code>syware-ux</code> brings{' '}
            <code>jlib-official</code>.
          </p>
          {codeSample(
            'text',
            `
            /plugin marketplace add bioleyl/jadis
            /plugin marketplace add bioleyl/jlib
            /plugin install syware-ux@jlib`,
            'In Claude Code'
          )}
          <p>
            For an app that does not follow SyWare's UX, install <code>jlib-official@jlib</code> instead. Each
            install opens the plugin's page in <code>/plugin</code>, where you choose for whom: you, in every
            project, or the project, for everyone working on it. From a terminal, the same with{' '}
            <code>claude plugin marketplace add</code> and <code>claude plugin install</code>. Without Jadis's
            marketplace, Claude Code cannot fetch <code>jadis-official</code>, and the plugin does not load until
            it is added (then <code>/reload-plugins</code>).
          </p>
          <p>
            Claude loads <code>jlib-official</code> on its own when the code it works on imports{' '}
            <code>@syware/jlib</code>, and <code>syware-ux</code> when it builds or reviews the views of a SyWare
            app; <code>/jlib-official:jlib-official</code> and <code>/syware-ux:syware-ux</code> load them by hand.
          </p>

          <h3>Any agent: skills.sh</h3>
          {codeSample(
            'bash',
            `
            npx skills add bioleyl/jlib
            npx skills add bioleyl/jadis`
          )}
          <p>
            <a href="https://skills.sh" target="_blank" rel="noopener">
              skills.sh
            </a>{' '}
            finds the agents installed on the machine and asks which skills go to which, for the project or for you
            (<code>-g</code>). It installs one repository at a time: the second line brings Jadis's skill.{' '}
            <code>npx skills update</code> brings them up to date.
          </p>

          <h3>Any agent: the install script</h3>
          {codeSample(
            'bash',
            'curl -fsSL https://raw.githubusercontent.com/bioleyl/jlib/main/install-skill.sh | sh'
          )}
          <p>
            It asks whether to add <code>syware-ux</code> and <code>jadis-official</code>, and where the skills go,
            one or several places: <code>~/.agents/skills</code> (Codex and the agents that read the shared
            folder), <code>~/.claude/skills</code> (Claude Code), the project's <code>.agents/skills</code> or{' '}
            <code>.claude/skills</code>, or another folder (<code>~/.cursor/skills</code>…). Run from a clone of
            the repository (<code>sh install-skill.sh</code>), it can link jlib's skills to the clone, so that{' '}
            <code>git pull</code> updates them. Without questions, for a script or a CI:
          </p>
          {codeSample(
            'bash',
            `
            curl -fsSL https://raw.githubusercontent.com/bioleyl/jlib/main/install-skill.sh \\
              | sh -s -- --skill syware-ux --target project-agents --target project-claude --yes`
          )}
          <p>
            <code>--no-jadis</code> leaves Jadis's skill out, <code>--ref v&lt;version&gt;</code> installs the
            skills of a release, <code>--help</code> lists the options. To remove a skill, delete its folder.
          </p>
        </section>

        <section>
          <h2>For a whole team</h2>
          <p>
            Commit the skills with the app: install them in the project's <code>.agents/skills</code> and{' '}
            <code>.claude/skills</code> (with skills.sh or the script) and commit those folders. Everyone who
            clones the app gets them, whatever their agent.
          </p>
          <p>
            For Claude Code alone, an app's repository can instead give the plugins to everyone who opens it, kept
            up to date: commit this file (with <code>jlib-official@jlib</code> in place of{' '}
            <code>syware-ux@jlib</code> for an app that does not follow SyWare's UX). It works in the folders
            people trust, which Claude Code asks about the first time.
          </p>
          {codeSample(
            'ts',
            `
            {
              "extraKnownMarketplaces": {
                "jadis": {
                  "source": { "source": "github", "repo": "bioleyl/jadis" },
                  "autoUpdate": true
                },
                "jlib": {
                  "source": { "source": "github", "repo": "bioleyl/jlib" },
                  "autoUpdate": true
                }
              },
              "enabledPlugins": {
                "jadis-official@jadis": true,
                "jlib-official@jlib": true,
                "syware-ux@jlib": true
              }
            }`,
            '.claude/settings.json'
          )}
        </section>

        <section>
          <h2>Asking well</h2>
          <p>
            Say what the page is for and where its data comes from; the skills bring how it is built. For a SyWare
            app, with both:
          </p>
          <ul class="prompts">
            {PROMPTS.map((prompt) => (
              <li>{prompt}</li>
            ))}
          </ul>
          <ul>
            <li>
              Name the component or the pattern when you know it (<code>jl-split-view</code>, "the way the patterns
              confirm"): the agent reads its reference before it writes.
            </li>
            <li>Ask for the tests and the typecheck to pass, and look at the page in the browser.</li>
            <li>
              When the agent meets a problem in jlib or something it lacks, let it write the issue, and keep the
              app's way around it small until jlib has the fix.
            </li>
          </ul>
        </section>

        <section>
          <h2>Keeping them current</h2>
          <p>
            The skills are released with jlib, under its version. In Claude Code, the plugins update with their
            marketplace: in <code>/plugin</code>, under <strong>Marketplaces</strong>, choose jlib, then{' '}
            <strong>Update marketplace</strong>, or <strong>Enable auto-update</strong> to have it done at start.
            From a terminal:
          </p>
          {codeSample(
            'bash',
            `
            claude plugin marketplace update jlib
            claude plugin update jlib-official@jlib
            claude plugin update syware-ux@jlib`
          )}
          <p>
            A session keeps the plugins it started with: <code>/reload-plugins</code> takes the new ones. With
            skills.sh, <code>npx skills update</code>; with the script, run it again. Each skill says which version
            of jlib it describes, and has the agent check the API in the version your app installed.
          </p>
        </section>

        <section>
          <h2>The files</h2>
          <p>
            The skills are Markdown, in the{' '}
            <a href={PLUGINS_URL} target="_blank" rel="noopener">
              plugins' folder
            </a>
            :{' '}
            <a href={JLIB_SKILL_URL} target="_blank" rel="noopener">
              jlib-official
            </a>{' '}
            and{' '}
            <a href={UX_SKILL_URL} target="_blank" rel="noopener">
              syware-ux
            </a>
            , each with its references.
          </p>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${guideStyles}${styles}`;
  }

  onConnect(): void {
    document.title = 'Vibe coding · jlib';
  }
}

VibeCodingPage.register();
