import { css } from '@jadis/core';
import { JlElement } from 'jlib';
import { BASE_STYLES } from 'jlib/styles/shared';

import { WRITING_RULES } from '../../docs/design';
import { designIntro, guideline } from '../../lib/design-blocks';
import { DESIGN_STYLES, PROSE_STYLES } from '../../styles/site-styles';

const escapeHtml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** A sentence shown as it would read in an interface. */
const said = (text: string): string => `<span style="font-size:15px;font-weight:600">${escapeHtml(text)}</span>`;

/** The voice of the interfaces, and the rules that keep their words useful. */
export class WritingPage extends JlElement {
  static readonly selector = 'site-writing-page';

  templateHtml(): Node {
    return (
      <article class="page">
        {designIntro(
          'Writing',
          'The words are part of the interface. Plain, direct and calm: say what is there, what happens, and what to do next, in as few words as that takes.'
        )}

        <section>
          <h2>Voice</h2>
          <ul>
            <li>
              <strong>Plain.</strong> Everyday words over jargon; "sign in", not "authenticate".
            </li>
            <li>
              <strong>Direct.</strong> Speak to the person ("your projects"), say what the interface does
              ("Saved"), and put the important word first.
            </li>
            <li>
              <strong>Calm.</strong> No exclamation marks, no jokes in errors, no blame. An error is the
              interface's problem to explain.
            </li>
          </ul>
        </section>

        {WRITING_RULES.map((rule) => (
          <section>
            <h2>{rule.title}</h2>
            <p>{rule.text}</p>
            <div class="rules">
              {guideline('do', said(rule.good))}
              {guideline('dont', said(rule.bad))}
            </div>
          </section>
        ))}

        <section>
          <h2>Numbers, dates and names</h2>
          <ul>
            <li>
              Format numbers, dates and sizes for the reader's language with <code>Intl</code>: the table, the
              calendar and the file drop already do.
            </li>
            <li>Say "2 minutes ago" for what just happened, and the date for anything older than a day.</li>
            <li>
              Name things the way people do: "Production", not "env-prod-01", unless the id is what they need.
            </li>
          </ul>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${DESIGN_STYLES}`;
  }

  onConnect(): void {
    document.title = 'Writing · jlib';
  }
}

WritingPage.register();
