import { pageHref } from '../services/navigation';
import { codeSample } from './blocks';
import { guideline } from './design-blocks';
import { isRoute, parseRichText } from './rich-text';

import type { PatternBlock } from '../types/patterns.types';
import type { TextRun } from './rich-text';

type RunRenderers = { [K in TextRun['kind']]: (run: Extract<TextRun, { kind: K }>) => Node | string };

const RUNS: RunRenderers = {
  code: (run) => <code>{run.text}</code>,
  link: (run) =>
    isRoute(run.href) ? (
      <a href={pageHref(run.href)}>{run.text}</a>
    ) : (
      <a href={run.href} target="_blank" rel="noopener">
        {run.text}
      </a>
    ),
  plain: (run) => run.text,
  strong: (run) => <strong>{run.text}</strong>,
};

const renderRun = <K extends TextRun['kind']>(run: Extract<TextRun, { kind: K }>): Node | string =>
  (RUNS[run.kind] as (run: Extract<TextRun, { kind: K }>) => Node | string)(run);

/** A text with its inline markup (`code`, **strong**, [links](/route)) made into nodes. */
export const richText = (text: string): (Node | string)[] => parseRichText(text).map(renderRun);

/** A live preview: the HTML drawn as it is, with what it shows under it. */
function preview(html: string, caption: string | undefined): Node {
  const area = <div class="preview-area" />;
  area.innerHTML = html;
  return (
    <figure class="preview">
      {area}
      {caption === undefined ? null : <figcaption>{richText(caption)}</figcaption>}
    </figure>
  );
}

function table(head: readonly string[], rows: readonly (readonly string[])[]): Node {
  return (
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            {head.map((cell) => (
              <th>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([first = '', ...rest]) => (
            <tr>
              <td>
                <strong>{richText(first)}</strong>
              </td>
              {rest.map((cell) => (
                <td>{richText(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type BlockRenderers = { [K in PatternBlock['kind']]: (block: Extract<PatternBlock, { kind: K }>) => Node };

const BLOCKS: BlockRenderers = {
  code: (block) => codeSample(block.language, block.code),
  list: (block) => (
    <ul>
      {block.items.map((item) => (
        <li>{richText(item)}</li>
      ))}
    </ul>
  ),
  note: (block) => <div class="note">{richText(block.text)}</div>,
  preview: (block) => preview(block.html, block.caption),
  rules: (block) => (
    <div class="rules">
      {guideline('do', block.do.preview, richText(block.do.text ?? ''))}
      {guideline('dont', block.dont.preview, richText(block.dont.text ?? ''))}
    </div>
  ),
  table: (block) => table(block.head, block.rows),
  text: (block) => <p>{richText(block.text)}</p>,
};

/** One block of a pattern page, drawn by the renderer of its kind. */
export const patternBlock = <K extends PatternBlock['kind']>(block: Extract<PatternBlock, { kind: K }>): Node =>
  (BLOCKS[block.kind] as (block: Extract<PatternBlock, { kind: K }>) => Node)(block);
