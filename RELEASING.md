# Releasing jlib

jlib is published to npm as [`@syware/jlib`](https://www.npmjs.com/package/@syware/jlib) by GitHub Actions. A
release takes three steps: bump the version, push the tag, approve the staged version on npm.

## How it works

Pushing a tag `vX.Y.Z` starts the **Publish to npm** workflow (`.github/workflows/publish.yml`):

1. It checks that the tag is the version in `package.json`, and stops otherwise.
2. It runs `npm run check` (generated files, lint, types, unit tests).
3. It packs the package (`prepack` builds `dist/`).
4. It **stages** the version on npm with `npm stage publish`, through npm's trusted publishing: no token is stored
   anywhere, npm trusts this workflow of this repository. The staged version is hidden until a maintainer approves
   it, and carries a provenance statement linking it to the run that built it.
5. It creates the **GitHub release** for the tag, with install notes, the change list and the package tarball.

The staged version becomes public when a maintainer **approves** it with their two-factor authentication. That is
the one human step, and the point of staging: no automation can publish jlib on its own.

A version already on npm is not staged again: the run then only creates the missing GitHub release, with npm's own
tarball.

## Releasing a version

1. Make sure `main` is ready:

   ```bash
   npm run check
   ```

   ```bash
   npm run test:e2e
   ```

2. Bump the version. `npm version` updates `package.json` and the lockfile, commits, and tags `vX.Y.Z`:

   ```bash
   npm version patch
   ```

   Use `patch` for fixes, `minor` for new components or options, `major` for changes that break existing pages.
   Before 1.0, a breaking change may go in a `minor`, but say so in the release notes.

3. Push the commit and its tag:

   ```bash
   git push --follow-tags
   ```

4. Follow the run in the repository's **Actions** tab (**Publish to npm**). When it is done, its summary page shows
   what npm staged.

5. Approve the staged version (or do it on npmjs.com, on the package's page):

   ```bash
   npm stage list @syware/jlib
   ```

   ```bash
   npm stage approve <stage-id>
   ```

   npm asks for your two-factor code, then the version is public.

6. Check the result: the version on [npmjs.com](https://www.npmjs.com/package/@syware/jlib) with its provenance
   badge, and the release on the repository's **Releases** page.

### Pre-releases

A version with a suffix, such as `0.2.0-beta.1`, is staged under the `next` tag (so `npm install @syware/jlib` keeps
installing the latest stable version) and its GitHub release is marked as a pre-release:

```bash
npm version preminor --preid beta
```

People try it with `npm install @syware/jlib@next`.

## The documentation site

The **Deploy the documentation site** workflow (`.github/workflows/deploy.yml`) runs on every push to `main`, and
can also be started by hand from the **Actions** tab. It runs the checks, builds the site and publishes it to
https://bioleyl.github.io/jlib/.

## When something goes wrong

- **The tag is not the package's version.** The run stops at once. Delete the tag (on GitHub and locally) and tag
  the right commit, or bump again.
- **The checks fail.** Nothing was staged or released. Fix it on `main`, then release the next version (`npm version
  patch` again): the failed tag can be deleted.
- **npm refuses to stage** (`npm stage publish failed` on the run's page). Check the package's trusted publisher on
  npmjs.com (**Settings → Trusted Publisher**): GitHub Actions, user `bioleyl`, repository `jlib`, workflow
  `publish.yml`, no environment, permission "npm stage publish".
- **A staged version should not go out.** Reject it, with your two-factor code:

  ```bash
  npm stage reject <stage-id>
  ```

  Its version number cannot be staged again: release the next one.
- **The GitHub release is missing** although the version is on npm. Re-run the workflow for that tag (**Actions →
  Publish to npm → Re-run jobs**): it skips npm and creates the release.

## One-time setup (already done)

- The npm organization `syware`, with the maintainers' accounts, two-factor authentication on.
- The first version, 0.1.0, published by hand.
- The trusted publisher on the package, as described above.
- GitHub Pages enabled for the repository, with **GitHub Actions** as its source.
