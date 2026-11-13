// Refreshes the coding agents' skills of this repository (`.agents/`, from `skills-lock.json`) after an install here.
// It is the package's `prepare`, which npm runs for an install in this folder and never for an app that installs
// @syware/jlib from the registry: as a `postinstall` it ran in every app's `npm install`. `prepare` also runs before
// a pack and a publish, so CI, where nobody reads the skills, skips it.
import { spawnSync } from 'node:child_process';

if (process.env.CI) {
  process.exit(0);
}

// -p: the project's skills; -y: no prompt for the scope. Through a shell, so Windows finds npx.cmd.
const { status } = spawnSync('npx skills update -p -y', { shell: true, stdio: 'inherit' });
process.exit(status ?? 1);
