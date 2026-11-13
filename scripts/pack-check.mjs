// Checks the package as an app gets it: packs it, installs the tarball in a scratch app, then type-checks and
// bundles that app. The unit tests and the site import src/ through an alias, so nothing else reads what npm ships:
// a path missing from `exports`, a declaration that does not resolve or a module that drags every component along
// would reach npm unseen. Run by CI: `npm run check:pack`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { build } from 'vite';

const ROOT = join(import.meta.dirname, '..');
const MODULES = join(ROOT, 'node_modules');
// What the package needs beside it in an app: its peer, and its dependency.
const BESIDE = ['@jadis', 'lucide'];
// A component the scratch app does not import: its tag in the bundle would mean the tree was not shaken.
const UNUSED_TAG = 'jl-table';
const USED_TAG = 'jl-button';

const APP = `import { define, JlButton, JlDialog, registerIcons } from '@syware/jlib';
import { JlBadge } from '@syware/jlib/atoms/jl-badge';
import '@syware/jlib/tokens.css';

define(JlBadge);
registerIcons({});

const dialog = (<JlDialog heading="Edit">A form.</JlDialog>) as JlDialog;
document.body.append(<JlButton variant="primary" onPress={() => dialog.show()}>Edit</JlButton>, dialog);
`;

const TSCONFIG = {
  compilerOptions: {
    jsx: 'react-jsx',
    jsxImportSource: '@jadis/core',
    lib: ['ES2024', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    moduleResolution: 'bundler',
    noEmit: true,
    // The package's declarations are what is checked here.
    skipLibCheck: false,
    strict: true,
    target: 'ES2024',
    types: [],
  },
  include: ['main.tsx', 'styles.d.ts'],
};
// What an app's bundler declares for it (`vite/client`): a stylesheet can be imported.
const STYLES = "declare module '*.css';\n";

const app = mkdtempSync(join(tmpdir(), 'jlib-pack-'));

/** Builds and packs the library, and unpacks the tarball where an install would put it. */
function install() {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-lib.mjs')], { stdio: 'inherit' });
  // Built just above: the pack runs no script of its own (`prepack` would build again, `prepare` refresh the skills).
  const pack = 'npm pack --ignore-scripts --pack-destination';
  execFileSync(`${pack} "${app}"`, { cwd: ROOT, shell: true, stdio: 'inherit' });
  const tarball = readdirSync(app).find((file) => file.endsWith('.tgz'));
  const target = join(app, 'node_modules', '@syware', 'jlib');
  mkdirSync(target, { recursive: true });
  execFileSync('tar', ['-xzf', join(app, tarball), '-C', target, '--strip-components=1']);
  for (const name of BESIDE) {
    symlinkSync(join(MODULES, name), join(app, 'node_modules', name), 'dir');
  }
}

/** The scratch app's bundle, as one text. */
async function bundle() {
  const { output } = await build({
    build: { minify: false, rollupOptions: { input: join(app, 'main.tsx') }, write: false },
    configFile: false,
    logLevel: 'error',
    oxc: { jsx: { importSource: '@jadis/core', runtime: 'automatic' } },
    root: app,
  });
  return output.map((chunk) => chunk.code ?? '').join('\n');
}

try {
  install();
  writeFileSync(join(app, 'main.tsx'), APP);
  writeFileSync(join(app, 'styles.d.ts'), STYLES);
  writeFileSync(join(app, 'tsconfig.json'), JSON.stringify(TSCONFIG));
  execFileSync(join(MODULES, '.bin', 'tsc'), ['-p', app], { stdio: 'inherit' });
  const code = await bundle();
  if (!code.includes(USED_TAG) || code.includes(UNUSED_TAG)) {
    throw new Error(
      `The app's bundle should hold ${USED_TAG} and not ${UNUSED_TAG}: the package is not tree-shaken.`
    );
  }
  console.log('The packed package type-checks and bundles in an app, with only what the app imports.');
} finally {
  rmSync(app, { force: true, recursive: true });
}
