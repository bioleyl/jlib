// Builds the library into dist/: one ES module per source module (Vite), the type declarations (tsc), and the
// tokens as a plain stylesheet for pages that link it.
import { execFileSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const BIN = join(ROOT, 'node_modules', '.bin');

const run = (command, args) => execFileSync(join(BIN, command), args, { cwd: ROOT, stdio: 'inherit' });

run('vite', ['build', '--config', 'vite.lib.config.ts']);
run('tsc', ['-p', 'tsconfig.lib.json']);
copyFileSync(join(ROOT, 'src', 'styles', 'tokens.css'), join(ROOT, 'dist', 'tokens.css'));
