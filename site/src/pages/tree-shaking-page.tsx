import { css } from '@jadis/core';
import { JlElement } from 'jlib';
import { BASE_STYLES } from 'jlib/styles/shared';

import report from '../generated/sizes.json';
import { codeSample, registrationTable } from '../lib/blocks';
import { pageHref } from '../services/navigation';
import { PROSE_STYLES } from '../styles/site-styles';
import styles from './guide-page.css?raw';

import type { SizeReport } from '../types/sizes.types';

const SIZES = report as SizeReport;
const KILOBYTE = 1024;

const kb = (bytes: number): string => `${(bytes / KILOBYTE).toFixed(1)} kB`;

const bySize = [...SIZES.components].sort((a, b) => a.added.gzip - b.added.gzip);

/** How jlib keeps an app's bundle to the components it uses, with the measured cost of each one. */
export class TreeShakingPage extends JlElement {
  static readonly selector = 'site-tree-shaking-page';

  templateHtml(): Node {
    return (
      <article class="page">
        <header class="intro">
          <p class="label">Guide</p>
          <h1>Tree-shaking</h1>
          <p class="lead">
            An app that uses three components ships three components. jlib is one ES module per component, declared
            free of side effects, and a component defines its tag when its class is in the bundle.
          </p>
        </header>

        <section>
          <h2>Import what you use</h2>
          <p>
            Import components by name from <code>jlib</code>. The bundler (Vite, Rollup, webpack, esbuild) follows
            the imports and drops every module nothing uses, including the components a used one does not need.
          </p>
          {codeSample(
            'ts',
            `
            import { JlButton } from 'jlib';

            const save = new JlButton(); // jl-button, jl-icon and jl-spinner end up in the bundle; nothing else
            save.label.set('Save');
            document.body.append(save);`
          )}
        </section>

        <section>
          <h2>Pages that only write tags</h2>
          <p>
            A bundler keeps a component only when your code uses its class. When the page writes{' '}
            <code>{'<jl-dialog>'}</code> in its HTML and no script names <code>JlDialog</code>, the component is
            dropped and the tag stays an empty element. Name the classes in <code>define</code>: that is both the
            registration and the use that keeps them. <a href={pageHref('/getting-started')}>Getting started</a>{' '}
            shows both cases side by side.
          </p>
          {registrationTable()}
          <div class="note">
            A bare <code>import 'jlib/atoms/jl-button'</code> is dropped too: the package declares its modules free
            of side effects so that unused ones go. <code>jlib/all</code> is the one module declared with side
            effects.
          </div>
        </section>

        <section>
          <h2>What each component costs</h2>
          <p>
            Measured by bundling, minifying and compressing an app that imports a single component, then removing
            what any jlib app pays once: Jadis, the design tokens and the base class (
            <strong>{kb(SIZES.baseline.gzip)}</strong> gzipped). Everything at once is{' '}
            <strong>{kb(SIZES.all.gzip)}</strong>. Components that use others (a dialog uses buttons) include them;
            shared ones are paid once.
          </p>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Level</th>
                  <th>Adds (gzip)</th>
                  <th>Adds (minified)</th>
                </tr>
              </thead>
              <tbody>
                {bySize.map((size) => (
                  <tr>
                    <td>
                      <a href={pageHref(`/components/${size.tag.replace(/^jl-/, '')}`)}>
                        <code>{`<${size.tag}>`}</code>
                      </a>
                    </td>
                    <td>{size.level}</td>
                    <td>{kb(size.added.gzip)}</td>
                    <td>{kb(size.added.raw)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Run <code>npm run size</code> to measure again.
          </p>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${styles}`;
  }

  onConnect(): void {
    document.title = 'Tree-shaking · jlib';
  }
}

TreeShakingPage.register();
