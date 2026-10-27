import { css } from '@jadis/core';
import { JlElement } from '@syware/jlib';
import { BASE_STYLES } from '@syware/jlib/styles/shared';

import { codeSample } from '../../lib/blocks';
import { designIntro, guideline } from '../../lib/design-blocks';
import {
  LOGO_MIN_HEIGHT,
  LOGO_MIN_HEIGHT_DENSE,
  LOGO_PNG_MIN_HEIGHT,
  LOGO_SVG_FROM_HEIGHT,
  MARK_CUT_RATIO,
  MIN_CUT_PX,
  sywareMark,
} from '../../lib/syware-logo';
import { assetHref, pageHref } from '../../services/navigation';
import { DESIGN_STYLES, PROSE_STYLES } from '../../styles/site-styles';
import styles from './logo-page.css?raw';

const LOGO_FILE = assetHref('syware-logo');
const DARK_FILE = assetHref('syware-logo-dark');
const MARK_FILE = assetHref('syware-mark');
const MARK_DARK_FILE = assetHref('syware-mark-dark');
const SVG = '.svg';
const PNG = '.png';
const LADDER = [16, 20, 24, 32];
// scripts/logo-png.mjs captures how a standard screen draws the small marks, from the SVG and from the PNG.
const CAPTURE_FILE = assetHref('logo-small-sizes.png');
const CAPTURE_WIDTH = 157;
// How much the magnified ladder enlarges each pixel.
const MAGNIFY = 4;
const PERCENT = 100;

const VERSIONS: readonly { name: string; file: string; use: string; dark: boolean }[] = [
  { dark: false, file: LOGO_FILE, name: 'Logo', use: 'The mark and the name, on white and light backgrounds.' },
  { dark: true, file: DARK_FILE, name: 'Logo on dark', use: 'The same with white ink, on dark backgrounds.' },
  {
    dark: false,
    file: MARK_FILE,
    name: 'Mark',
    use: 'Alone where the name is already written, or room is short.',
  },
  { dark: true, file: MARK_DARK_FILE, name: 'Mark on dark', use: 'The mark with white ink, on dark backgrounds.' },
];

const COLOURS: readonly { hex: string; name: string; use: string }[] = [
  { hex: '#0e88d3', name: 'SyWare blue', use: 'The upper part of the mark and "Ware". The --jl-brand token.' },
  { hex: '#231f20', name: 'Mark ink', use: 'The lower part of the mark.' },
  { hex: '#2e2a2b', name: 'Name ink', use: '"Sy". Both inks turn white on dark.' },
];

type Source = 'svg' | 'png';

const SOURCE_LABELS: Record<Source, string> = { png: 'PNG, shrunk by the browser', svg: 'SVG, drawn at size' };

const cutAt = (height: number): string => (height * MARK_CUT_RATIO).toFixed(1);
const fileName = (file: string, extension: string): string => `${file.split('/').at(-1) ?? file}${extension}`;

/** The mark at one height, from the vector or from the large PNG, at its real size. */
function realSize(source: Source, height: number): Node {
  const mark =
    source === 'svg' ? sywareMark(height) : <img src={`${MARK_FILE}${PNG}`} alt="SyWare" height={height} />;
  return (
    <div class="ladder-step">
      <span class="ladder-mark">{mark}</span>
      <span class="ladder-size">{`${height}px`}</span>
    </div>
  );
}

/** The SyWare logo: its versions, colours, clear space, small sizes, and how to treat it. */
const WORD_STYLE = 'font-weight:800;font-size:18px;letter-spacing:-0.02em';
const APP_ICON = (glyph: string): string => `<jl-app-icon icon="${glyph}"></jl-app-icon>`;
const SYWARE_MARK = (): string => `<img src="${MARK_FILE}${SVG}" alt="" style="height:26px">`;
const APPS: readonly { glyph: string; name: string }[] = [
  { glyph: 'workflow', name: 'ai' },
  { glyph: 'package', name: 'stock' },
];

/** Two apps' headers, each its icon (or the mark) and its wordmark, for the do and don't of the apps' icons. */
const appHeaders = (icon: (glyph: string) => string): string =>
  `<div style="display:grid;gap:10px">${APPS.map(
    (app) =>
      `<span style="display:inline-flex;align-items:center;gap:10px">${icon(app.glyph)}<span style="${WORD_STYLE}">sw<span style="color:var(--jl-brand)">${app.name}</span></span></span>`
  ).join('')}</div>`;

export class LogoPage extends JlElement {
  static readonly selector = 'site-logo-page';

  templateHtml(): Node {
    return (
      <article class="page">
        {designIntro(
          'Logo',
          "The SyWare logo is the hexagon mark and the name. It is used as the designer drew it: the SVG files are the designer's own paths, only cropped, and the PNG files are rendered from them."
        )}

        <section>
          <h2>Versions</h2>
          <div class="versions">
            {VERSIONS.map((version) => (
              <div class="version">
                <div class={version.dark ? 'version-preview dark' : 'version-preview'}>
                  <img src={`${version.file}${SVG}`} alt={`SyWare ${version.name.toLowerCase()}`} />
                </div>
                <div class="version-info">
                  <strong>{version.name}</strong>
                  <span class="swatch-use">{version.use}</span>
                  <span class="downloads">
                    <a href={`${version.file}${SVG}`} download={fileName(version.file, SVG)}>
                      SVG
                    </a>
                    <a href={`${version.file}${PNG}`} download={fileName(version.file, PNG)}>
                      PNG
                    </a>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Colours</h2>
          <div class="logo-colours">
            {COLOURS.map((colour) => (
              <div class="logo-colour">
                <span class="logo-chip" style={`background: ${colour.hex}`} />
                <span class="logo-colour-text">
                  <strong>{colour.name}</strong>
                  <code>{colour.hex}</code>
                  <span class="swatch-use">{colour.use}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Clear space</h2>
          <p>
            Keep a quarter of the mark's height free on every side: no text, edge or other picture inside it. The
            dashed line shows that space.
          </p>
          <div class="clear-demo">
            <div class="clear-space">
              <span class="clear-unit">¼</span>
              <img src={`${LOGO_FILE}${SVG}`} alt="SyWare" />
            </div>
          </div>
        </section>

        <section>
          <h2>Small sizes</h2>
          <p>
            The mark's detail is its two white cuts; the narrower one is{' '}
            <strong>{`${(MARK_CUT_RATIO * PERCENT).toFixed(1)}%`}</strong> of its height. A browser can draw the
            logo small in two ways, and on a standard screen they do not look the same:
          </p>
          <ul>
            <li>
              <strong>The SVG, drawn at size</strong>, has exact edges. On a standard screen its 30° edges become
              steps: the cut needs <strong>{`${MIN_CUT_PX} screen pixels`}</strong> to read cleanly, so{' '}
              <strong>{`${LOGO_MIN_HEIGHT}px`}</strong> at least ({`${LOGO_MIN_HEIGHT_DENSE}px`} on high-density
              screens).
            </li>
            <li>
              <strong>The PNG, rendered large and shrunk by the browser</strong>, goes through its smoothing
              filter, which softens the steps, as an avatar does. It stays smooth down to{' '}
              <strong>{`${LOGO_PNG_MIN_HEIGHT}px`}</strong>.
            </li>
          </ul>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Height</th>
                  <th>Use</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{`Under ${LOGO_PNG_MIN_HEIGHT}px`}</td>
                  <td>Neither: write the name in text.</td>
                </tr>
                <tr>
                  <td>{`${LOGO_PNG_MIN_HEIGHT} to ${LOGO_SVG_FROM_HEIGHT}px`}</td>
                  <td>
                    <strong>The PNG</strong>: navigation bars, footers, avatars. This site does.
                  </td>
                </tr>
                <tr>
                  <td>{`${LOGO_SVG_FROM_HEIGHT}px and more`}</td>
                  <td>
                    <strong>The SVG</strong>: as smooth, and sharper. Print always uses the SVG.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3>At real size, on your screen</h3>
          <div class="compare">
            {(['svg', 'png'] as const).map((source) => (
              <div class="compare-row">
                <span class="compare-label">{SOURCE_LABELS[source]}</span>
                <div class="ladder">{LADDER.map((height) => realSize(source, height))}</div>
              </div>
            ))}
          </div>
          <h3>{`Magnified ${MAGNIFY}×, as a standard screen draws them`}</h3>
          <figure class="zoom">
            <img
              src={CAPTURE_FILE}
              alt="The mark at 16, 20, 24 and 32 pixels: the SVG on top, with stepped edges; the PNG below, smoother."
              style={`width: ${CAPTURE_WIDTH * MAGNIFY}px`}
            />
            <figcaption class="swatch-use">
              Top row: the SVG drawn at size. Bottom row: the PNG shrunk by the browser. From the left: 16, 20, 24
              and 32px, captured at one device pixel per CSS pixel. The PNG's edges blend about a quarter more
              pixels: that is the smoothness you see.
            </figcaption>
          </figure>
          <p class="swatch-use">
            {`The cut is ${LADDER.map((height) => `${cutAt(height)}px at ${height}px`).join(', ')}.`}
          </p>
        </section>

        <section>
          <h2>Using the logo</h2>
          <div class="rules">
            {guideline(
              'do',
              `<img src="${LOGO_FILE}${SVG}" alt="SyWare" style="height:40px">`,
              'Show it as it is, on a calm background, with its clear space.'
            )}
            {guideline(
              'dont',
              `<img src="${LOGO_FILE}${SVG}" alt="SyWare" style="height:40px;transform:scale(1.5, 0.75)">`,
              'Stretch or squeeze it: keep its proportions, always.'
            )}
            {guideline(
              'do',
              `<div style="padding:16px 22px;border-radius:10px;background:#0f1113"><img src="${DARK_FILE}${SVG}" alt="SyWare" style="height:40px;display:block"></div>`,
              'Use the version with white ink on dark backgrounds.'
            )}
            {guideline(
              'dont',
              `<div style="padding:16px 22px;border-radius:10px;background:linear-gradient(120deg,#0e88d3,#5b48c8)"><img src="${LOGO_FILE}${SVG}" alt="SyWare" style="height:40px;display:block"></div>`,
              'Put it on a coloured or busy background where its parts get lost.'
            )}
            {guideline(
              'dont',
              `<img src="${LOGO_FILE}${SVG}" alt="SyWare" style="height:40px;filter:hue-rotate(150deg)">`,
              'Recolour it, even to match a theme: the blue is part of the logo.'
            )}
            {guideline(
              'dont',
              `<img src="${LOGO_FILE}${SVG}" alt="SyWare" style="height:40px;transform:rotate(-10deg);filter:drop-shadow(3px 4px 3px rgb(0 0 0 / 0.35))">`,
              'Rotate it, or add shadows, outlines or other effects.'
            )}
          </div>
        </section>

        <section>
          <h2>The logo and the apps</h2>
          <p>
            The SyWare logo is the company's. An app shows its own icon and its wordmark, so that two apps open
            side by side never look alike. The logo stays where the company speaks: large and faint on the sign-in
            panel (see <a href={pageHref('/components/auth-layout')}>Auth layout</a>), and in the documentation.
          </p>
          <div class="rules">
            {guideline(
              'do',
              appHeaders(APP_ICON),
              "Each app its own icon, in one family: its glyph in white on the brand's blue."
            )}
            {guideline(
              'dont',
              appHeaders(SYWARE_MARK),
              "The company's mark on every app: at a glance, the apps look the same."
            )}
          </div>
          <h3>The app icon</h3>
          <ul>
            <li>
              A rounded square, its corners a quarter of its side, in <code>--jl-brand</code>; the app's glyph in
              white, about 60% of its side, a stroke icon of the icon set.{' '}
              <a href={pageHref('/components/app-icon')}>jl-app-icon</a> draws it.
            </li>
            <li>
              The glyph says what the app works on: a workflow for swai, a package for swstock. No two apps share
              one.
            </li>
            <li>
              Beside it, the wordmark: "sw" in ink, the app's name in the brand's blue, in Manrope at weight 800.
            </li>
            <li>
              The favicon is the same tile, as an SVG file: <code>setFavicon('package')</code> draws it from the
              glyph and the theme's brand colour and gives it to the page. A phone's home screen icon fills its
              square with the blue and keeps the glyph in the middle 60%, where every phone's mask leaves it whole.
            </li>
          </ul>
          {codeSample(
            'html',
            `
            <span class="brand">
              <jl-app-icon icon="package"></jl-app-icon>
              <span class="word">sw<span class="name">stock</span></span>
            </span>

            <!-- Alone, it names the app -->
            <jl-app-icon icon="package" size="24" label="swstock"></jl-app-icon>`
          )}
        </section>

        <section>
          <h2>In a page</h2>
          <p>Use the files as images, with their name as the alternative text.</p>
          {codeSample(
            'html',
            `
            <!-- Up to 64px tall: the PNG, shrunk by the browser -->
            <img src="syware-logo.png" alt="SyWare" height="32">

            <!-- Larger: the SVG -->
            <img src="syware-logo.svg" alt="SyWare" height="96">`
          )}
          <p>
            The PNGs are rendered from the SVGs by <code>node scripts/logo-png.mjs</code>: run it again if an SVG
            changes.
          </p>
        </section>
      </article>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${PROSE_STYLES}${DESIGN_STYLES}${styles}`;
  }

  onConnect(): void {
    document.title = 'Logo · jlib';
  }
}

LogoPage.register();
