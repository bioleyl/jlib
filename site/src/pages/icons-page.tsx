import { css } from '@jadis/core';
import { iconNames, JlElement, JlIcon, JlInput } from 'jlib';
import { BASE_STYLES } from 'jlib/styles/shared';

import { codeSample } from '../lib/blocks';
import { PROSE_STYLES } from '../styles/site-styles';
import styles from './icons-page.css?raw';

const ICON_SIZE = 22;
// How long a tile says "Copied".
const COPIED_MS = 1200;

const tagOf = (name: string): string => `<jl-icon name="${name}"></jl-icon>`;

/** Every icon jl-icon knows, searchable; pressing one copies its tag. */
export class IconsPage extends JlElement {
  static readonly selector = 'site-icons-page';

  private readonly _refs = this.useRefs((ref) => ({
    count: ref('.count'),
    empty: ref('.empty'),
    filter: ref<JlInput>('jl-input'),
    grid: ref('.icon-grid'),
  }));

  templateHtml(): Node {
    const names = iconNames();
    return (
      <article class="page">
        <header class="intro">
          <p class="label">Design system</p>
          <h1>Icons</h1>
          <p class="lead">
            jl-icon draws lucide icons by name. These are the common ones; press one to copy its tag. Any other
            lucide icon can be added in one line.
          </p>
        </header>

        <section>
          <div class="toolbar">
            <JlInput icon="search" placeholder="Search icons" clearable label="Search icons" />
            <span class="count">{`${names.length} icons`}</span>
          </div>
          <div class="icon-grid">
            {names.map((name) => (
              <button type="button" class="tile" data-name={name} title={tagOf(name)}>
                <JlIcon name={name} size={ICON_SIZE} />
                <span class="tile-name">{name}</span>
              </button>
            ))}
          </div>
          <p class="empty" hidden>
            No icon by that name. Lucide has more than a thousand: add the one you need below.
          </p>
        </section>

        <section>
          <h2>Using icons</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Where</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>14</code>
                  </td>
                  <td>Small buttons, badges, dense rows.</td>
                </tr>
                <tr>
                  <td>
                    <code>16</code>
                  </td>
                  <td>Buttons, fields, menus: the default.</td>
                </tr>
                <tr>
                  <td>
                    <code>18</code>
                  </td>
                  <td>Large buttons, navigation.</td>
                </tr>
                <tr>
                  <td>
                    <code>20–24</code>
                  </td>
                  <td>On their own: empty states, feature lists.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul>
            <li>Icons are lucide's outlines at a 1.9 stroke, and take the colour of the text around them.</li>
            <li>
              An icon goes with a word. Alone, it needs a name: <code>hint</code> on a button, <code>label</code>{' '}
              on an icon.
            </li>
            <li>One icon per idea across an app: the same pencil means "edit" everywhere.</li>
          </ul>
        </section>

        <section>
          <h2>Registering icons</h2>
          <p>
            Components draw their own icons with no setup: a select its chevron, a dialog its close button. The
            names <em>you</em> write (<code>{'<jl-icon name="…">'}</code>, <code>icon="…"</code> on a button or a
            badge) must be registered once, so that a bundle holds only the icons in use. Register the ones you
            need from <a href="https://lucide.dev/icons">lucide</a>, under any name:
          </p>
          {codeSample(
            'ts',
            `
            import { Bike, Coffee } from 'lucide';
            import { registerIcons } from 'jlib';

            registerIcons({ bike: Bike, coffee: Coffee });`
          )}
          {codeSample('html', `<jl-button icon="coffee" label="Take a break"></jl-button>`)}
          <p>
            Or register every icon of this page in one line (about 5 kB compressed). <code>import 'jlib/all'</code>{' '}
            does it too.
          </p>
          {codeSample(
            'ts',
            `
            import { COMMON_ICONS, registerIcons } from 'jlib';

            registerIcons(COMMON_ICONS);`
          )}
          <p class="note">
            A name nobody registered draws a neutral mark and warns once in the console, with the line to add.
          </p>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${styles}`;
  }

  onConnect(): void {
    document.title = 'Icons · jlib';
    this._refs.filter.events.register('input', (text) => this.filter(text));
    this.on(this._refs.grid, 'click', (event) => {
      const tile = (event.target as Element).closest<HTMLElement>('.tile');
      if (tile !== null) {
        void this.copy(tile);
      }
    });
  }

  private filter(text: string): void {
    const query = text.trim().toLowerCase();
    const tiles = [...this._refs.grid.querySelectorAll<HTMLElement>('.tile')];
    for (const tile of tiles) {
      tile.hidden = !(tile.dataset.name ?? '').includes(query);
    }
    const shown = tiles.filter((tile) => !tile.hidden).length;
    this._refs.count.textContent = `${shown} icons`;
    this._refs.empty.hidden = shown > 0;
  }

  private async copy(tile: HTMLElement): Promise<void> {
    await navigator.clipboard.writeText(tagOf(tile.dataset.name ?? ''));
    const label = tile.querySelector('.tile-name');
    if (label === null) {
      return;
    }
    tile.toggleAttribute('data-copied', true);
    label.textContent = 'Copied';
    setTimeout(() => {
      tile.toggleAttribute('data-copied', false);
      label.textContent = tile.dataset.name ?? '';
    }, COPIED_MS);
  }
}

IconsPage.register();
