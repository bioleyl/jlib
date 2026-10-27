import { css } from '@jadis/core';
import { JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { bundlerCase, codeSample, registrationTable } from '../lib/blocks';
import { pageHref } from '../services/navigation';
import { PROSE_STYLES } from '../styles/site-styles';
import styles from './guide-page.css?raw';

/** Installing jlib and using it from HTML, from JSX and from TypeScript. */
export class GettingStartedPage extends JlElement {
  static readonly selector = 'site-getting-started-page';

  templateHtml(): Node {
    return (
      <article class="page">
        <header class="intro">
          <p class="label">Guide</p>
          <h1>Getting started</h1>
          <p class="lead">
            Install the package, then use the components as HTML tags, as typed classes in JSX, or from plain
            TypeScript. They are the same elements in all three.
          </p>
        </header>

        <section>
          <h2>Install</h2>
          <p>
            jlib ships ES modules and their type declarations. Jadis is a peer dependency: your app and jlib share
            one copy of it.
          </p>
          {codeSample('bash', 'npm install @syware/jlib @jadis/core')}
          <p>
            The components use Manrope and JetBrains Mono when the page has them, and fall back to the system fonts
            otherwise. To get the intended look, add them:
          </p>
          {codeSample(
            'bash',
            `
            npm install @fontsource-variable/manrope @fontsource-variable/jetbrains-mono`
          )}
          {codeSample(
            'ts',
            `
            import '@fontsource-variable/manrope';
            import '@fontsource-variable/jetbrains-mono';`,
            'main.ts'
          )}
        </section>

        <section>
          <h2>Registering components</h2>
          <p>
            A tag like <code>{'<jl-button>'}</code> is an empty, unknown element until the browser is told which
            class it belongs to. Every jlib component does that itself, as soon as its file runs: you never call{' '}
            <code>customElements.define</code>.
          </p>
          <p>
            The catch is tree-shaking. So that the components you do not use stay out of your app, jlib tells
            bundlers that its files can be dropped when nothing uses them. A bundler keeps a component's file only
            when your code <strong>uses its class</strong>, and that decides whether you have anything to do:
          </p>
          <div class="cases">
            {bundlerCase(
              'Your code uses the class',
              `
              import { JlButton } from '@syware/jlib';

              const save = new JlButton();
              document.body.append(save);`,
              'kept',
              'The class is used (here, or as <JlButton /> in JSX), so the bundler keeps the file, and the file registers <jl-button>. Nothing to do.'
            )}
            {bundlerCase(
              'Your page only writes the tag',
              `
              import { JlButton } from '@syware/jlib';

              // <jl-button> is only in index.html:
              // JlButton is never used here.`,
              'dropped',
              'The import is unused, so the bundler removes it. The tag never comes to life: an empty element, and no error.'
            )}
          </div>
          <p>
            <code>define</code> is for the second case: it registers the tags of the classes you give it, and since
            it uses them, the bundler keeps them. It is only a shortcut for calling <code>register()</code> on each
            class.
          </p>
          {codeSample(
            'ts',
            `
            import { define, JlButton, JlDialog } from '@syware/jlib';

            define(JlButton, JlDialog);
            // the same as: JlButton.register(); JlDialog.register();`,
            'main.ts'
          )}
          {registrationTable()}
          <div class="note">
            JSX written with the tag (<code>{'<jl-card>…</jl-card>'}</code>, needed for children) counts as a tag:
            the code names a string, not the class. Add <code>define(JlCard)</code> next to it.
          </div>
        </section>

        <section>
          <h2>As HTML tags</h2>
          <p>
            Once defined, the tags work anywhere: in index.html, in a template string, in another framework's
            markup.
          </p>
          {codeSample(
            'ts',
            `
            import { define, JlButton, JlInput } from '@syware/jlib';

            define(JlButton, JlInput);`,
            'main.ts'
          )}
          {codeSample(
            'html',
            `
            <jl-input name="email" type="email" placeholder="you@example.com"></jl-input>
            <jl-button variant="primary" label="Subscribe"></jl-button>`,
            'index.html'
          )}
        </section>

        <section>
          <h2>In JSX, with Jadis</h2>
          <p>
            With Jadis's JSX runtime, use the classes: their inputs are typed props, and the bundler keeps exactly
            the components you reference. A component that takes children is written with its tag, since a class
            cannot take children in Jadis JSX.
          </p>
          {codeSample(
            'ts',
            `
            {
              "compilerOptions": {
                "jsx": "react-jsx",
                "jsxImportSource": "@jadis/core"
              }
            }`,
            'tsconfig.json'
          )}
          {codeSample(
            'ts',
            `
            import { Jadis } from '@jadis/core';
            import { define, JlButton, JlCard } from '@syware/jlib';

            // jl-card takes children, so it is written with its tag: define keeps it in the bundle.
            define(JlCard);

            export class SignUp extends Jadis {
              static readonly selector = 'app-sign-up';

              private readonly refs = this.useRefs((ref) => ({ save: ref(JlButton) }));

              templateHtml(): Node {
                return (
                  <jl-card heading="Create your account">
                    <JlButton variant="primary" label="Sign up" block />
                  </jl-card>
                );
              }

              onConnect(): void {
                this.refs.save.events.register('press', () => console.log('signed up'));
              }
            }

            SignUp.register();`,
            'sign-up.tsx'
          )}
        </section>

        <section>
          <h2>From TypeScript</h2>
          <p>
            Every input is a Jadis change handler: read it with <code>get()</code>, write it with{' '}
            <code>set()</code>. Outputs are typed events: <code>events.register(name, callback)</code> gets the
            detail directly.
          </p>
          {codeSample(
            'ts',
            `
            import { JlInput } from '@syware/jlib';

            const input = new JlInput();
            input.placeholder.set('Search');
            input.clearable.set(true);
            input.events.register('input', (value) => console.log(value));
            document.body.append(input);

            input.value.set('jadis');
            console.log(input.value.get()); // 'jadis'`
          )}
          <p>
            Attributes and properties are the same inputs: <code>{'<jl-input clearable>'}</code>,{' '}
            <code>{'<JlInput clearable />'}</code> and <code>input.clearable.set(true)</code> all do one thing.
            Lists and objects are written as JSON in HTML (<code>{`items='[{"label":"Home"}]'`}</code>) and as
            plain values from code.
          </p>
        </section>

        <section>
          <h2>Icons</h2>
          <p>
            Components draw their own icons with no setup. The icon names you write yourself (
            <code>{'<jl-icon name="settings">'}</code>, <code>icon="plus"</code> on a button) are registered once,
            so your bundle holds only the icons you use. See <a href={pageHref('/design/icons')}>Icons</a>.
          </p>
          {codeSample(
            'ts',
            `
            import { COMMON_ICONS, registerIcons } from '@syware/jlib';

            registerIcons(COMMON_ICONS); // or registerIcons({ plus: Plus }) with icons from lucide`
          )}
        </section>

        <section>
          <h2>Other languages</h2>
          <p>
            What the components say on their own (a close button, "Show more", a file drop's refusals, the labels
            screen readers hear) is English. An app in another language gives them its texts once, before it draws
            anything: <code>setTexts</code> takes some or all of them, by name, and the rest stay English. The
            texts that name your own content (a page's heading, a tree's empty text) are inputs of each component,
            as before.
          </p>
          {codeSample(
            'ts',
            `
            import { setTexts } from '@syware/jlib';

            setTexts({ close: 'Fermer', showMore: 'Afficher plus', shownOfTotal: '{shown} sur {total}' });`
          )}
          <p>
            <code>DEFAULT_TEXTS</code> lists every name with its English text; <code>{'{placeholders}'}</code> are
            filled when the text is shown.
          </p>
        </section>

        <section>
          <h2>Next</h2>
          <ul>
            <li>
              <a href={pageHref('/tree-shaking')}>Tree-shaking</a>: how the bundle keeps only what you use.
            </li>
            <li>
              <a href={pageHref('/theming')}>Theming</a>: the tokens, dark mode and your own colours.
            </li>
            <li>
              <a href={pageHref('/design')}>Design system</a>: the principles, colour, type, spacing and the rest
              of the look.
            </li>
            <li>
              <a href={pageHref('/forms')}>Forms</a>: fields that submit like native ones.
            </li>
            <li>
              <a href={pageHref('/components')}>All components</a>, each with a playground.
            </li>
          </ul>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${styles}`;
  }

  onConnect(): void {
    document.title = 'Getting started · jlib';
  }
}

GettingStartedPage.register();
