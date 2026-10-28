# Plan: S3 storage and CDN delivery

Based on PR #1497 (S3 partner) and the CDN request (CDN partner, BunnyCDN).
Top part: overview. Details, findings and rationale: see [Details](#details).

## Scenarios

| Scenario                 | Storage    | Delivery                   | Who wants it          |
|--------------------------|------------|----------------------------|-----------------------|
| 1. as today              | filesystem | file-server                | everyone (default)    |
| 2. S3                    | s3         | presigned S3 URLs          | S3 partner (PR #1497) |
| 3. CDN                   | s3         | CDN (origin = bucket)      | CDN partner           |
| 3b. CDN without S3       | filesystem | CDN (origin = file-server) | nobody yet, optional  |

The file-server always checks the group token first; in 2 and 3 it then redirects to a signed URL.

## Architecture

- **Storage** (`filesystem` | `s3`): where files live. Driver does put/get/list/delete only.
- **Delivery** (`local` | `s3-presign` | `cdn`): how the browser gets a file. A signer turns path + expiry into a URL.
- Built-in implementations only; new providers come in as PRs.

## Decisions

- Separate storage and delivery; no `S3Driver` subclasses for CDNs.
- Cache busting via versioned URLs (file hash in the URL), not CDN purges.
- Keep the redirect; the frontend does not send the `AuthToken` header on file requests.
- Fresh installs only, no migration of existing files.
- BunnyCDN is the first CDN.
- New branch from master; PR #1497 is a source, not the base. Commits using its code credit
  Andrey Angelov as co-author.
- 1.2b–d (filesystem-only refactor) go to master on their own.
- Storage interface in filesystem terms; a directory exists only while it contains files –
  see [Storage design](#storage-design).

## Steps

| Step | What                                                              | Status |
|------|-------------------------------------------------------------------|--------|
| 1.1–1.2c | PR assessment, test bootstrap, driver interface, read path    | done   |
| 1.2d | Write path through the driver (filesystem only), merge to master  |        |
| 1.2e | S3 driver                                                         |        |
| 1.2f | Driver contract tests                                             |        |
| 1.2g | `File` as pure data, no re-reading on upload validation           |        |
| 1.3  | Delivery layer (`local` / `s3-presign`), stable signed URLs       |        |
| 1.4  | Frontend: no `AuthToken` on file requests (straight to master)    |        |
| 1.5  | Resource packages with presigned URLs                             |        |
| 1.6  | Deployment, docs, e2e in S3 mode                                  |        |
| 1.7  | Merge, partner tests on STACKIT, replace #1497                    |        |
| 2    | CDN (BunnyCDN)                                                    |        |
| 3    | CDN in front of the file-server (optional)                        |        |
| –    | Separate topic: per-session file access tokens                    |        |

## Follow-ups on master (after 1.2d is merged)

- `docs/style-guide.md`: add a "General" section with the naming rule and point to it from
  `backend/AGENTS.md`. Verb first, verb by meaning: `get…` reads something at a known place,
  `find…` searches by a criterion, `create…` builds a new object, `load…`/`fetch…` do I/O where
  that is not obvious, `is…`/`has…`/`can…` return a boolean. Whether something can be missing is
  shown by a nullable return type, not by the verb. Named constructors (`fromString`) and
  conversions (`toString`) are excepted; no Unix jargon like `stat`/`mtime`.
- Initialization test targets (`scripts/make/dev-test.mk`): `make test-backend-initialization`
  without `test=` does not fail – the container prints "No test name given!", starts Apache and
  waits forever. It should fail fast with a usage hint. `test-backend-initialization-general`
  (what CI runs) calls `make stop` first and stops the dev stack (existing TODO); the test stack
  should run alongside it instead.
- Local images go stale without notice: `task-runner-backend` is not rebuilt when `package.json`
  changes (API tests failed with a missing module, `gulp-yaml-merge`), and the backend image bakes
  in composer's class map, so after switching to a branch with different classes the tests fail
  with "Class not found" until `make build service=backend`.
- Check the docs for consistency, e.g. the style guide's commit tags (`[be, fe]`, `[file-server]`)
  contradict `AGENTS.md` (`[be][fe]`, `[fs]`).

## Later / out of scope

- S3 as the only storage with a bundled local S3 (= storage `s3`, delivery `local`).
- Migration of existing installations to S3.
- More CDN providers (CloudFront etc.) when someone needs them.

---

# Details

## 1.2 Storage layer

- All file access goes through the driver in every mode – no `isObjectStore()` branches,
  no "not on disk, try the bucket" fallbacks.
- 1.2b–d are a pure refactor with the filesystem driver only, verified by the existing tests,
  and go to master. 1.2e–f happen on the S3 branch.

### Storage design

Interface: `StorageDriver` with `FilesystemDriver`; paths only as `StoragePath` (one file) and
`StorageDirectory`, which validate segments (no `..`, `.`, empty segments, `/` inside a segment).

- **Filesystem terms, S3 semantics for directories.** A storage directory exists exactly as long
  as there are files in it: no empty directories, no `mkdir`/`rmdir`. The filesystem driver
  creates directories on write and removes them when they become empty. S3 terms (key, prefix)
  only appear inside the S3 driver.
- **`delete` and `deleteDirectory` stay separate.** A raw S3 prefix `…/foo` also matches
  `foo.itcr.zip` and `foobar.html`; a merged "rm -r" delete would turn a too-short path into a
  directory wipe and cost S3 an extra list request per delete. Separate types make the bulk
  delete explicit (only package uninstall and workspace delete use it).
- **`listFiles` is not recursive** (S3: `delimiter=/`). Size and date come with the listing (free
  on S3), so rescan and fingerprint need no request per file.
- **No `copy`/`rename`.** All moves go from local staging into storage, which is `put`. `put`
  copies (the local file stays) because the S3 upload does too.
- **Driver access:** one static `Storage::getDriver()` hands out the production driver (now
  `FilesystemDriver(DATA_DIR)`, from 1.2e chosen by config). Everything that works with storage
  uses it, `File` included – no driver passed around. Tests need no setter: the unit tests set
  `DATA_DIR` to the vfs, so the driver lands there.
- **Storage vs. local:** storage only through the driver; local temp files (upload staging in
  `sys_get_temp_dir()`, unpacked ZIPs, `.schemas`) with plain PHP functions, as they are local in
  every mode.
- **ZIP needs a real file** (`ZipArchive` cannot read streams). The `ZIP` helper copies the content
  to a temp file; `ResourceFile` unpacks to a temp dir and `put`s each file.
- **Not in the interface:** URL signing (delivery, 1.3) and locking (DB, `workspaces.locked_at`).
- **Tests:** top-layer unit tests stay on the filesystem driver (vfsStream). A shared contract
  suite runs against both drivers (1.2f). S3 end to end via API/e2e tests (1.6). Running the
  whole unit suite against S3 was rejected: every `VfsForTest` fixture would need rewriting for
  little extra coverage.

Scope – what goes through storage:

| Data                                    | Storage | Notes                                       |
|-----------------------------------------|---------|---------------------------------------------|
| Workspace files `ws_N/{Type}/name`      | yes     |                                             |
| Unpacked packages `ws_N/Resource/<pkg>/`| yes     | delivered by the file-server                |
| Sys-check reports `ws_N/SysCheck/reports/` | yes  | written by test-takers                      |
| Attachments `ws_N/UnitAttachments/`     | yes     | delivered by the backend                    |
| `public/uploaded_assets/`               | yes     | public delivery is a 1.3 question           |
| `.schemas/` (XSD cache)                 | no      | cache on the container's disk               |

Resource packages: every startup rescan deletes and re-unpacks every package. With S3 that means
delete and re-upload of all package objects, with a short 404 window for tests running during a
container start. Acceptable; "skip unchanged packages" can be added later without an interface
change.

### 1.2d Write path through the driver (filesystem only)

Branch `storage-driver`, merged to master at the end. Lock (`workspaces.locked_at`) and upload
staging are done.

Direct disk access left in `backend/src` and `initialize.php`:

| Area | Where | What |
|---|---|---|
| File delete | `Workspace::deleteFiles` → `deleteFileFromFs`, `isPathLegal` | `unlink` |
| Workspace delete | `Workspace::delete`, `WorkspaceInitializer::cleanWorkspace`, `initialize.php:132` (overwrite) | recursive delete |
| Workspace folder | `Workspace::getOrCreateWorkspacePath`, `getOrCreateSubFolderPath`, `$workspacePath`, `getWorkspacePath()` | constructor still creates `ws_N/` |
| Sys-check reports | `SysChecksFolder::saveSysCheckReport`, `getSysCheckReportsPath`, `deleteSysCheckReports` | write, delete |
| Assets | `AssetController` (upload `moveTo`, delete), `AssetStorage::getDir()` | `DATA_DIR/public/uploaded_assets`; the file-server serves it via `alias` (1.3) |
| Sample data | `WorkspaceInitializer::importSampleFiles` (`copy`), `createSampleScanImage` | |
| Test setup | `TestEnvironment` (`createPath`, reset of `DATA_DIR`, `touch` for static dates) | `touch` cannot work on S3 – note for 1.2e |
| Data dir | `initialize.php:115` creates `DATA_DIR` | belongs to the filesystem driver's setup |

Stays local on purpose (not storage): `XMLSchema` (`.schemas` cache), `ZIP` and `ResourceFile`
temp files, `Folder::*` on temp dirs, `DAO::runFile`, `DataCollection`, `InitDAO` patch files,
`ExternalFile` (URLs).

Remaining commits:
1. Deletes: files (`deleteFiles`), workspaces (`delete`, `cleanWorkspace`, `initialize.php`
   overwrite) via `delete`/`deleteDirectory`.
2. Sys-check reports: save and delete through the driver.
3. Assets (`uploaded_assets`) through the driver.
4. Sample data and `TestEnvironment`.
5. Remove leftovers (`$workspacePath`, `getWorkspacePath`, `getOrCreate…Path`, `isPathLegal`),
   check that nothing outside `FilesystemDriver` touches `DATA_DIR`. Bring the branch's new code
   in line with master's Mago rules (e.g. `$this->assert…` in the storage tests). Merge to master.

Open questions:
- Path of assets in storage (keep `public/uploaded_assets/`?) and what the file-server needs.
- Where creating `DATA_DIR` belongs once nothing else knows the disk.

Done when nothing outside `FilesystemDriver` touches the disk. Merge to master: keep the
individual commits (merge commit) or squash – decide then; recommendation was to keep them.

CHANGELOG: this branch does not go into the next release, so its entries go into their own
section `# storage-driver (nach dem nächsten Release)` above `# next`. That way a rebase after the
release conflicts instead of silently moving them into the released version; rename the section
to `# next` then. `next.sql` needs the same check against what the release did with master's.

### 1.2g `File` as pure data (after 1.2d, before 1.7)

Postponed from 1.2c: not needed for S3, and the 1.2c/d refactor stays behaviour-neutral.
Decide here.

Today a `File` created from a DB row (`getFileById`, DAO lists) has no content and reads it on
the first `getContent()`/XML access (`File.class.php:97`). Idea: `File` never reads anything;
`Workspace::loadFileById()` loads explicitly; `getContent()` without content throws.

Survey (2026-10-20) – lazy loads happen at:
- `BookletController.class.php:43`, `TestController.class.php:83` and `:116-117`,
  `WorkspaceController.class.php:277-283`, `:303-331`, `:362`, `ReviewCSVFormatter.php:38`
  (all right after `getFileById`)
- `Workspace::updateDependentFiles` → `getRequestedAttachments` (booklets and units from the DB)
- upload validation: `loadFilesIntoCache` also loads existing files of the uploaded type, and
  `WorkspaceCache::validate` cross-validates them too
- 74 places in 8 unit test files create `File`s directly.

Hidden costs found:
1. A lazy load re-validates the whole file incl. XSD (`load()` calls `validate()`), e.g. the
   booklet at every test start (`TestController.class.php:83`).
2. Uploading one file re-reads and re-validates every stored file of its type, only to discard
   the result (only new files are stored). On S3: one download per existing file per upload.
   Fix by checking duplicate IDs and relations against the DB instead.
3. The rescan lists each type directory with sizes and dates (`listFiles`), then every `File`
   asks for its size and date again (`readFileMeta` → `getFileInfo`). On S3 one extra request
   per file. Fix by creating the `File` with the `FileInfo` from the listing.

Costs 2 and 3 get noticeably worse on S3, so this step should come before the partner tests (1.7).

### 1.2e S3 driver

Take over `S3Driver` and the SeaweedFS dev setup from the PR, adapted to the interface.
Test mode (`data-TEST`, `data-TEST-api`) needs its own root in S3 too (bucket or key prefix); the
filesystem driver gets it via `DATA_DIR`, which `TestEnvironment` already switches.

### 1.2f Driver tests

Shared contract test suite (`test/unit/test-helper/StorageDriverContractTestCase.php`) run
against both drivers, plus S3-specific cases.

## 1.3 Delivery layer

- Delivery setting (`local` | `s3-presign`) with a signer, independent of storage.
  Replaces the double switch `STORAGE_DRIVER` + `OBJECT_STORE_ENABLED`.
- Stable signed URLs (expiry rounded to a time window) so browser caches hit. In the PR the
  redirect target changes on every request (new `X-Amz-Date`), so nothing is cached. GeoGebra
  shows the cost: every file of its package is a separate backend call (DB check, S3 `HEAD`,
  signing), and the package (27 MB zipped) is downloaded again on every load.
- CSP origin comes from the delivery config.
- Keep the file-server's status codes (`403`/`404`/`500`) in redirect mode; in the PR a missing
  file gives `500` (`content.lua` maps every non-`302` from the backend to `500`).
- Set a deliberate `Cache-Control` on the delivered files (S3 responses carry none).
- `public/uploaded_assets`: today served by the file-server via `alias` without token check;
  needs a delivery path in S3 mode.
- **Decide here:** signing in backend or file-server.

## 1.4 Frontend: no `AuthToken` on file requests

- File-server and backend file route only use the group token in the URL;
  the header is only there because `AuthInterceptor` adds it to every request.
- Drop it for file requests in all modes. In the PR the header goes to S3 and triggers a CORS
  preflight, which a strict bucket CORS rule rejects. Dropping it also keeps the token away from S3.
- Document the CORS settings a bucket needs: testcenter origin, `GET`/`HEAD`; file-server must be
  on the same origin as the frontend, otherwise the redirect is "tainted" and `null` must be allowed.

## 1.5 Resource packages with presigned URLs

- Packages work as long as they build absolute URLs from `directDownloadUrl` (GeoGebra does: its
  loader takes its base URL from its `<script>` tag, still the file-server URL after the redirect).
- Relative CSS `url()`, ES module imports, web workers and relative `fetch()` break after the redirect.
- Document the rule for package and player authors; **decide here** whether a fix
  (e.g. serving packages via the file-server) is needed for any known package.

## 1.6 Deployment, docs, tests

- Compose, Helm, env templates (from the PR, adapted), CHANGELOG.
- e2e tests in S3 mode; **decide here:** whether CI runs them. PR #1497 has never run through CI.
- Dev/test SeaweedFS with a strict CORS rule (explicit `AllowedHeaders`): without it SeaweedFS
  allows every requested header, unlike AWS, so CORS mistakes stay hidden.
- All make targets that touch the stack get the S3 profile (`data-push` is missing it).
- Test the CSP somewhere (dev runs `ng serve` without nginx).

## 1.7 Merge

- S3 partner tests on their infrastructure (STACKIT).
- Our PR replaces #1497; inform the partner before closing it.

## 2 CDN (BunnyCDN)

- Versioned URLs (file hash in the URL) so the CDN never serves stale files after a re-upload.
- Bunny signer. Per-file tokens work for packages that build absolute URLs (each file goes through
  the file-server); directory tokens only needed for packages that resolve URLs relatively.
- Fake CDN container (nginx/OpenResty cache validating Bunny tokens) for dev and e2e.
- Unit tests against Bunny's reference signing examples.
- CDN ↔ bucket access is CDN configuration; document it.
- **Decide here:** Bunny directly or STACKIT's CDN product (ask the CDN partner now).
- Before merge: CDN partner tests on their setup.

## 3 CDN in front of the file-server (optional)

- File-server endpoint that serves files only to the CDN (e.g. shared secret header).
- That endpoint sends its own cache headers (`public`, long `max-age`, safe with versioned URLs);
  test-taker routes keep `Cache-Control: private`.

## Separate topic: file access tokens

Independent of S3/CDN, can happen before, during or after phase 1.

- File requests are authorized by the **group token** in the URL. It is shared by all logins of
  a group, grants read access to all `Resource/` files of the workspace, and never expires in the
  DB (the backend route `/file/{group_token}/…` only checks that it exists; Redis expires after
  `validTo` or 24h).
- The file-server's Redis check (no PHP/DB per file) is sound. Group instead of per-session
  granularity gains no performance – `storeAuthentication()` already writes on every login.
- Better: a separate per-session file token (not the API token) in Redis – revocable per person,
  traceable, bound to the session lifetime.
- Bug: `CacheService::removeAuthentication()` deletes `group-token:` + the *person* token,
  a key that never exists.
- Ask paflov (introduced it in `5aa338bc6`, 2023 load-test prototype) whether there was more to it.
- Touches the same frontend URL code as 1.4.
