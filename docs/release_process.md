<!-- This file outlines the steps necessary for creating a new release -->

# Release

Releases are cut from `master`. Every release first goes out as at least one release candidate, published exactly
like a release, so that the published images and the install and update scripts are tested before anything becomes
`latest`.

The pipeline runs on GitLab and decides by the tag:

- `X.Y.Z` is a release: the images get that tag and, for the highest release tag, `latest`; the docs are deployed
  under `X.Y/` and, again only for the highest release tag, without prefix.
- Any other tag (`X.Y.Z-rc1`, `X.Y.Z-beta`) is a pre-release: the images get that tag, nothing else moves.

## 1. Prepare

- `make create-interfaces` and commit the result (usually a refreshed browser list in `definitions/browsers.json`).
- Rename `scripts/database/patches.d/next.sql` and `scripts/migration/next.sh` after the release, e.g. `19.1.0.sql`
  and `19.1.0.sh`. Never add a pre-release suffix like `-rc1` to these file names.
- Make sure `docs/CHANGELOG.md` is up to date and its top heading is the release, e.g. `# 19.1.0`.
- For a new minor version, add it at the top of `docs/site/public/versions.json`. Remove versions whose docs are no
  longer offered.
- Check for a new [Mago](https://github.com/carthage-software/mago/releases) release. It is not a Composer dependency
  but pinned in `backend/Dockerfile`; update the tag and the digest there, and the version in the URLs at the top of
  `backend/mago.toml`.

## 2. Publish a release candidate

1. Set the version, e.g. `19.1.0-rc1`, in the root `package.json` and in both places in `package-lock.json`. Commit
   as `Prepare 19.1.0-rc1` and push to `master`.
2. Tag and push the tag:
   ```
   git tag 19.1.0-rc1 && git push origin 19.1.0-rc1
   ```
3. Once the pre-release pipeline is green and the images are on Docker Hub, create a GitHub release for the tag,
   marked as pre-release, with the release's section of the changelog as notes. `install.sh` only installs tags that
   exist as a GitHub release.

## 3. Test the release candidate

Test with the published images, in throwaway installation directories:

- **Fresh install:** `bash install.sh 19.1.0-rc1`. The template sets `COMPOSE_PROJECT_NAME=testcenter`; if the
  machine already runs an installation of that name, decline the start at the end of the installer, change the name
  in `.env.prod`, then run `make testcenter-init` and `make testcenter-up`.
- **Update from the last release:** install the last release with the `install.sh` from its release page, add some
  data (upload a file, start a test), then `make testcenter-update` to the candidate. Leave `.env.prod` as the old
  installer wrote it: leftovers in old configuration files are exactly what breaks updates (in 19.0.0 an unquoted
  value and a missing `COMPOSE_PROJECT_NAME` did).
- **Backup and restore:** `make testcenter-backup`, change some data, `make testcenter-restore BACKUP=backup/<set>`,
  `make testcenter-up`, check that the change is undone. Do this on the fresh and on the updated installation.
- **Application:** log in as admin and as testtaker, upload a file, run a test, export the CSV reports. For the group
  monitor use two browsers or a private window - the login is kept in `localStorage`, so two tabs of one browser
  share it - and check that a testtaker's progress shows up live and that commands like "Pause" reach the testtaker.
- **Consumers:** tell the maintainers of applications that read testcenter data (e.g.
  [eatPrepTBA](https://github.com/iqb-research/eatPrepTBA)) about changes to the API or the exports.

Fix what turns up on `master` and publish the next candidate (`-rc2`, ...).

## 4. Release

1. Set the release version:
   - `package.json` (root) and both places in `package-lock.json`
   - `scripts/helm/testcenter/Chart.yaml`: `appVersion` to the release, and raise the chart `version` - its major
     version for breaking changes to values or secrets
   - `scripts/helm/helm-install-tc.sh`: `TESTCENTER_VERSION` and `TESTCENTER_CHART_VERSION`

   Commit as `Raise version to 19.1` and push to `master`.
2. Tag and push the tag: `git tag 19.1.0 && git push origin 19.1.0`.
3. Once the release pipeline is green, create the GitHub release for the tag, marked as latest, with the release's
   section of the changelog as notes and `scripts/install.sh` and `scripts/update.sh` attached. Not earlier:
   `install.sh` offers the latest GitHub release right away, and its images have to exist by then.
4. Push the Helm chart with `make push-helm-chart-production`. Helm runs in a container and uses the Docker Hub login
   from `~/.docker`.
5. Check the result:
   - `latest` of `iqbberlin/testcenter-backend`, `-frontend`, `-broadcaster` and `-file-server` on Docker Hub is the
     release.
   - The [docs](https://iqb.pages.cms.hu-berlin.de/testcenter/) show the release, also under `X.Y/`.
   - `docker run --rm alpine/helm:3 show chart oci://registry-1.docker.io/iqbberlin/testcenter --version <chart>`
     reports the new `appVersion`.

# Xml validation

1. data/schemas: add new XSD version, add changes
2. prepare changes in the XML
3. specify the new XSD version number in the modified XML and verify that it validates
4. integrate the changes into the testcenter
5. test the new functionality
6. register the new supported version in `definitions/compatibility.json`
7. release the new testcenter version
8. commit XSD changes to the spec-repository and release the new version; also note the required testcenter version in the release notes.
