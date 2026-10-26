import { JlCodeBlock, JlIcon } from 'jlib';
import { dedent } from 'jlib/lib/text';

import type { CodeLanguage } from 'jlib';

/** A code sample of a guide page, written indented in the page's source. */
export const codeSample = (language: CodeLanguage, code: string, heading = ''): Node => (
  <JlCodeBlock language={language} code={dedent(code)} heading={heading} />
);

/** One way of using components, and what it takes for their tags to work. */
const REGISTRATION_CASES: readonly { you: string; example: string; todo: string; code: boolean }[] = [
  {
    code: false,
    example: 'new JlButton(), <JlButton />',
    todo: 'Nothing: the component registers its tag itself.',
    you: 'use the class in your code or JSX',
  },
  {
    code: true,
    example: '<jl-button> in index.html, in an innerHTML string, or <jl-card>…</jl-card> in JSX',
    todo: 'define(JlButton, JlCard)',
    you: 'only write the tag',
  },
  {
    code: true,
    example: 'a prototype, a demo page',
    todo: "import 'jlib/all'",
    you: 'want every component, without tree-shaking',
  },
];

/** The table that says, for each way of using components, whether `define` is needed. */
export const registrationTable = (): Node => (
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>If you…</th>
          <th>For example</th>
          <th>Do this</th>
        </tr>
      </thead>
      <tbody>
        {REGISTRATION_CASES.map((row) => (
          <tr>
            <td>
              <strong>{row.you}</strong>
            </td>
            <td>
              <code>{row.example}</code>
            </td>
            <td>{row.code ? <code>{row.todo}</code> : row.todo}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

type Verdict = 'kept' | 'dropped';

const VERDICT_ICONS: Record<Verdict, string> = { dropped: 'circle-x', kept: 'circle-check' };

/** A code sample with what the bundler does with it, for the side-by-side cases of the guide. */
export const bundlerCase = (title: string, code: string, verdict: Verdict, outcome: string): Node => (
  <div class={`case ${verdict}`}>
    <p class="case-title">{title}</p>
    {codeSample('ts', code)}
    <p class="case-outcome">
      <JlIcon name={VERDICT_ICONS[verdict]} size={16} />
      <span>{outcome}</span>
    </p>
  </div>
);
