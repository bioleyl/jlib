import { css } from '@jadis/core';
import { JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { PROSE_STYLES } from '../styles/site-styles';
import styles from './site-api.css?raw';

import type { ComponentDoc } from '../types/docs.types';

type Column<Row> = { title: string; cell: (row: Row) => Node | string };

const code = (text: string): Node => <code>{text}</code>;

/** The property and its attribute; one name when they are spelled the same. */
function propNames(name: string, attribute: string | undefined): Node {
  if (attribute === name) {
    return code(name);
  }
  const second = attribute === undefined ? <span class="hint">property only</span> : code(attribute);
  return (
    <div class="names">
      {code(name)}
      {second}
    </div>
  );
}

function table<Row>(title: string, rows: readonly Row[], columns: Column<Row>[]): Node | null {
  if (rows.length === 0) {
    return null;
  }
  return (
    <section>
      <h3>{title}</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th>{column.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr>
                {columns.map((column) => (
                  <td>{column.cell(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** The reference of a component: properties and attributes, events, slots, methods and styling hooks. */
export class SiteApi extends JlElement {
  static readonly selector = 'site-api';

  /** The component's documentation, set as a property. */
  readonly doc = this.useChange<ComponentDoc | null>(null, () => this.build());

  private readonly _refs = this.useRefs((ref) => ({ tables: ref('.tables') }));

  templateHtml(): Node {
    return <div class="tables" />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${styles}`;
  }

  private build(): void {
    const doc = this.doc.get();
    if (doc === null) {
      return;
    }
    const tables = [
      table('Properties', doc.props, [
        { cell: (prop) => propNames(prop.name, prop.attribute), title: 'Property / attribute' },
        { cell: (prop) => code(prop.type), title: 'Type' },
        { cell: (prop) => code(prop.default), title: 'Default' },
        { cell: (prop) => prop.description, title: 'Description' },
      ]),
      table('Events', doc.events ?? [], [
        { cell: (event) => code(event.name), title: 'Event' },
        { cell: (event) => code(event.detail), title: 'Detail' },
        { cell: (event) => event.description, title: 'Description' },
      ]),
      table('Slots', doc.slots ?? [], [
        {
          cell: (slot) => (slot.name === '' ? <span class="hint">default</span> : code(slot.name)),
          title: 'Slot',
        },
        { cell: (slot) => slot.description, title: 'Description' },
      ]),
      table('Methods', doc.methods ?? [], [
        { cell: (method) => code(method.signature), title: 'Method' },
        { cell: (method) => method.description, title: 'Description' },
      ]),
      table('Styling', doc.styling ?? [], [
        { cell: (style) => code(style.name), title: 'Custom property / part' },
        { cell: (style) => style.description, title: 'Description' },
      ]),
    ];
    this._refs.tables.replaceChildren(...tables.filter((node): node is Node => node !== null));
  }
}

SiteApi.register();
