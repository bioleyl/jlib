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

/** Building apps on jlib with Claude Code, and the two plugins that teach it jlib and SyWare's UX. */
export class VibeCodingPage extends JlElement {
  static readonly selector = 'site-vibe-coding-page';

  templateHtml(): Node {
    return (
      <article class="page">
        <header class="intro">
          <p class="label">Guide</p>
          <h1>Vibe coding</h1>
          <p class="lead">
            Build an app on jlib by asking Claude Code for it. Two plugins teach Claude: <code>jlib</code>, the
            components and the way an app is written on them, and <code>syware-ux</code>, how SyWare's apps behave.
          </p>
        </header>

        <section>
          <h2>Two plugins</h2>
          <div class="grid plugins">
            <div class="card">
              <h3>jlib</h3>
              <p>For any app on jlib.</p>
              <ul>
                <li>
                  <strong>Every component</strong>, what it is for, and where its API is: the declarations of the
                  version the app installed, and its documentation and examples at that version.
                </li>
                <li>
                  <strong>An app's setup</strong> and the Jadis essentials: views drawn once and changed in place,
                  inputs, events, refs, the router.
                </li>
                <li>
                  <strong>The look</strong>: icons registered by name, colours from the <code>--jl-*</code> tokens
                  only, light and dark, jlib's texts in the app's language.
                </li>
                <li>
                  <strong>Tests</strong> of views in jsdom, and what jsdom cannot show.
                </li>
                <li>
                  <strong>What to report</strong>: a bug in jlib, an improvement or a missing component becomes an
                  issue on jlib's repository, which Claude writes for you to file.
                </li>
              </ul>
            </div>
            <div class="card">
              <h3>syware-ux</h3>
              <p>For SyWare's apps, and those that want to behave like them. It goes with jlib.</p>
              <ul>
                <li>
                  <strong>The principles</strong> every SyWare app follows.
                </li>
                <li>
                  <strong>
                    The <a href={pageHref('/patterns')}>UX patterns</a>
                  </strong>{' '}
                  applied with jlib's components: the frame, pages, lists, forms, states, feedback, confirmations
                  and search.
                </li>
                <li>
                  <strong>Each pattern page in full</strong>, read at the version of jlib the app installed, before
                  Claude builds what it covers.
                </li>
                <li>
                  <strong>The checklist</strong> a finished page is reviewed with.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2>Install the plugins</h2>
          <p>
            jlib's repository is also a plugin marketplace. In Claude Code, add it once, then install the plugins:
          </p>
          {codeSample(
            'text',
            `
            /plugin marketplace add bioleyl/jlib
            /plugin install jlib@jlib
            /plugin install syware-ux@jlib`,
            'In Claude Code'
          )}
          <p>
            Leave out the last line for an app that does not follow SyWare's UX. Each install opens the plugin's
            page in <code>/plugin</code>, where you choose for whom: you, in every project, or the project, for
            everyone working on it. From a terminal, the same with{' '}
            <code>claude plugin marketplace add bioleyl/jlib</code> and{' '}
            <code>claude plugin install jlib@jlib</code>.
          </p>
          <p>
            Each plugin holds one skill of its name. Claude loads <code>jlib</code> on its own when the code it
            works on imports <code>@syware/jlib</code>, and <code>syware-ux</code> when it builds or reviews the
            views of a SyWare app; <code>/jlib:jlib</code> and <code>/syware-ux:syware-ux</code> load them by hand.
          </p>
        </section>

        <section>
          <h2>For a whole team</h2>
          <p>
            An app's repository can give the plugins to everyone who opens it in Claude Code, kept up to date:
            commit this file (without <code>syware-ux@jlib</code> for an app that does not follow SyWare's UX). It
            works in the folders people trust, which Claude Code asks about the first time.
          </p>
          {codeSample(
            'ts',
            `
            {
              "extraKnownMarketplaces": {
                "jlib": {
                  "source": { "source": "github", "repo": "bioleyl/jlib" },
                  "autoUpdate": true
                }
              },
              "enabledPlugins": { "jlib@jlib": true, "syware-ux@jlib": true }
            }`,
            '.claude/settings.json'
          )}
        </section>

        <section>
          <h2>Asking well</h2>
          <p>
            Say what the page is for and where its data comes from; the plugins bring how it is built. For a SyWare
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
              confirm"): Claude reads its documentation before it writes.
            </li>
            <li>Ask for the tests and the typecheck to pass, and look at the page in the browser.</li>
            <li>
              When Claude meets a problem in jlib or something it lacks, let it write the issue, and keep the app's
              way around it small until jlib has the fix.
            </li>
          </ul>
        </section>

        <section>
          <h2>Keeping them current</h2>
          <p>
            The plugins are released with jlib, under its version, and Claude Code gives you a new copy when that
            version changes. In <code>/plugin</code>, under <strong>Marketplaces</strong>, choose jlib, then{' '}
            <strong>Update marketplace</strong>, which updates its plugins too, or{' '}
            <strong>Enable auto-update</strong> to have it done at start. From a terminal:
          </p>
          {codeSample(
            'bash',
            `
            claude plugin marketplace update jlib
            claude plugin update jlib@jlib
            claude plugin update syware-ux@jlib`
          )}
          <p>
            A session keeps the plugins it started with: <code>/reload-plugins</code> takes the new ones. Whatever
            their version, Claude reads each component's API and each pattern in the version of jlib your app
            installed.
          </p>
        </section>

        <section>
          <h2>Other assistants</h2>
          <p>
            The skills are Markdown files: give them to another assistant as its instructions,{' '}
            <a href={JLIB_SKILL_URL} target="_blank" rel="noopener">
              jlib's
            </a>{' '}
            with its list of components and{' '}
            <a href={UX_SKILL_URL} target="_blank" rel="noopener">
              syware-ux's
            </a>{' '}
            with its list of patterns, in the{' '}
            <a href={PLUGINS_URL} target="_blank" rel="noopener">
              plugins' folder
            </a>
            .
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
