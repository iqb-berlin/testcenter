Releases are cut from `master`. The pipeline runs on GitLab, builds the images and deploys the docs:

- `X.Y.Z` is a release: the images get that tag and the docs are deployed.
- `X.Y.Z-beta`, `X.Y.Z-rc1` or any other suffix is a pre-release: only the images get that tag.

`make release-prepare VERSION=X.Y.Z` sets the version number in all files that carry one. If they exist, it also
(always without the suffix of a pre-release):

- moves `scripts/database/next.sql` to `scripts/database/patches.d/X.Y.Z.sql`
- raises the version `scripts/database/full.sql` stamps into `meta.dbSchemaVersion` to `X.Y.Z`: `full.sql` already
  contains the change, and a lower stamp would make a fresh installation apply it a second time
- raises `DBSchema::REQUIRED_VERSION` to `X.Y.Z`
- renames `scripts/migration/next.sh` to `X.Y.Z.sh`

`make release-check` lists every file whose version number does not match the one in `package.json`.

## 1. Prepare

- `make create-interfaces` and commit the result (usually a refreshed browser list in `definitions/browsers.json`).
- Make sure `docs/CHANGELOG.md` is up to date.
- For a new minor version, remove versions whose docs are no longer offered from `docs/site/public/versions.json`.

## 2. Release

For a pre-release, use the version with its suffix, e.g. `X.Y.Z-beta`, in every step.

1. `make release-prepare VERSION=X.Y.Z`, then commit as `Release X.Y.Z`.
2. Tag and push the tag: `git tag X.Y.Z && git push origin X.Y.Z`.
3. Once the pipeline is green, create the GitHub release with the release's section of the changelog as notes and
   `scripts/install.sh` and `scripts/update.sh` attached. Mark it as pre-release or as latest.
4. Not for pre-releases: push the Helm chart with `make push-helm-chart-production`.
