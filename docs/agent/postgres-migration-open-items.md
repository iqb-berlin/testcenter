## Postgres Migration - Open Items

Working notes for the `postgres-migration` branch. Delete this file once the migration is done.

### Where we are

Branch history rewritten to 7 commits (backup: `backup/postgres-migration-pre-cleanup`), not pushed.

Verified by running it: postgres 18.4 comes up, the backend connects via `pdo_pgsql`,
`full.postgres.sql` creates all 22 tables and the integrity check passes. `initialize.php` then
crashes in `writeFullSchema()` on `SHOW CREATE TABLE`.

`full.postgres.sql` carries its own translation notes at the end (`MIGRATIONSHINWEISE`) - read them
before touching the schema, they cover the enum, boolean, collation and `REPLACE INTO` decisions.

### Decisions taken

- **`full.sql` becomes the hand-maintained source of truth.** `full.postgres.sql` is renamed to
  `full.sql` and tracked in git, serving both jobs: installing a fresh production database
  (`initialize.php:81`) and resetting the test database (`TestEnvironment::buildTestDB()`).
  `writeFullSchema()`, `updateDataBaseScheme()` and `backend/test/update-sql-scheme.php` are deleted -
  the generate-and-cache pipeline exists only because replaying `base.sql` + 39 patches per test run was
  slow, which stops being true once the complete schema is a checked-in file.
  *Cost:* a schema change must be written twice - as a patch *and* folded into `full.sql` by hand.
  Needs a drift guard: a test that installs `full.sql` and asserts `installPatches()` has nothing left
  to do and the integrity check passes.

- **The mysql patches are not ported.** A postgres database is born at the latest patch level, so every
  existing patch is unreachable by definition. `patches.d/` starts empty for postgres and the mysql
  patches are deleted - leaving them would mean `initialize.php:91` feeds mysql SQL to postgres as soon
  as the stamped version changes. Today nothing fires only by accident.

- **Upgrading is a two-step process, enforced in code.** There is no in-place mysql -> postgres upgrade,
  and an admin on an older release would need mysql patches the postgres release no longer ships. So
  `scripts/migration/next.sh` (renamed to the release tag at release time, mirroring
  `patches.d/next.sql`) must refuse when the installed database is below the last mysql release, then do
  the dump -> convert -> restore.
  - The hook exists: `update.sh` calls `run_complementary_migration_scripts()` (`:276`) after
    `create_data_backup` and before the images are swapped, while mysql is still running. Nothing is torn
    down at that point, so a refusal is safe. See `scripts/migration/18.0.0.sh` for the existing shape.
  - Two constraints found there, **no changes made to `update.sh`**:
    - Migration scripts get no `SOURCE_VERSION` - they are invoked bare (`update.sh:384`) and the
      variable is not exported. So check the invariant directly: read `meta.dbSchemaVersion` out of the
      still-running mysql container.
    - A non-zero exit does not stop the update. `update.sh:388-393` asks "Do you want to proceed? [Y/n]"
      and **defaults to yes**, so one keypress continues into the image swap. Either accept that and make
      the message unmissable, or add a hard stop in the target release's `update.sh` - the latter means
      touching update logic, which needs a decision.
  - The rename to the release tag is a manual release step; if it is forgotten, `update.sh` never fetches
    the script and the guard silently does not run.

- **`meta.dbSchemaVersion` gets exactly one meaning:** the version of the newest schema change contained
  in this database. `full.sql` stamps the highest patch version it contains (for the postgres release,
  with an empty `patches.d/`, the release version itself); `installPatches()` stamps each patch as it
  applies it; nothing else writes the field. The `18.2.0` at `full.postgres.sql:669` is a leftover from
  when the file was snapshotted and gets re-stamped.

### Plan

1. ~~**Clear out the mysql leftovers.**~~ Done. `base.sql` and the 39 patches moved to
   `scripts/database/mysql-legacy/` - kept while the migration script is written, since mapping mysql data
   into the postgres schema needs the original column types. **This folder must be deleted before the
   release.** The five version-specific initialization suites (`tests/12.0.2`, `12.3.3`, `14.0.0`,
   `14.4.0`, `14.10.0`) are deleted outright - they replay the real patches to regression-test mysql
   upgrade paths, which cease to exist. `patches.d/` is now empty (`.gitkeep`) and is where postgres
   patches will land.

2. **Get `initialize.php` to "Ready."** Rename `full.postgres.sql` -> `full.sql` and track it; delete
   `writeFullSchema()` and point `buildTestDB()` at the file. Then the three call sites in initialize's
   path: `InitDAO:296` (backtick-quoted `` `id` ``), `WorkspaceDAO:160` and `:555` (`replace into`),
   `InitDAO:290` (`is_superadmin = 1` against a boolean column).
   *Check:* `make up` reaches `Ready.`, sample workspace and `super` admin exist.

3. **Restore a feedback loop** before the bulk rewrites - see "Test database" below, plus converting
   `backend/test/unit/testdata.sql` (52 statements: backticks throughout, and positional inserts putting
   `1`/`0` into what are now boolean columns).

4. **The remaining DAO rewrites.** 3x `replace into`, 4x `on duplicate key update`, the remaining
   backticks (`DAO:115` in `setMeta`, `SuperAdminDAO:182`, `:225`), and 6 boolean comparisons
   (`AdminDAO:666`, `InitDAO:290`, `TestDAO:634`, `:672`, `WorkspaceDAO:602`, `:659`).
   **Not mechanical** - two traps:
   - Three call sites read mysql's affected-rows semantics as control flow. `DAO:65` stores
     `rowCount()`, and mysql returns 2 for a REPLACE that replaced an existing row versus 1 for a fresh
     insert; postgres returns 1 either way. Affects `WorkspaceDAO:567` (`$updatedRelations` would become
     always-empty), `SessionDAO:176` and `:451`.
   - `REPLACE INTO files` is DELETE+INSERT and therefore cascade-deletes dependent `file_relations` and
     `unit_defs_attachments` rows (`full.postgres.sql:523, 553`). `ON CONFLICT DO UPDATE` does not.
     Check whether `storeAllFiles()` relies on that to clear stale relations before converting.

5. **Decide the boolean API contract.** PDO now returns real `true`/`false` where mysql returned
   `"0"`/`"1"`, so anything JSON-encoded straight to the client changes shape. Either cast back in SQL to
   preserve the contract, or accept it and update `docs/api` and the frontend.

6. **The rest:** `scripts/migration/next.sh`, helm, `update.sh`'s backup, the `MYSQL_*` rename, porting
   the `tests/general/` initialization suites.

### initialize.php cleanup

Found while working out why initialize fails on postgres. Pre-existing, not postgres-specific, worth
fixing while we are in here.

- **`writeFullSchema()` does not belong in initialize.** `initialize.php:112` dumps the live schema to
  `scripts/database/full.sql` on every backend container start; the only consumer is
  `TestEnvironment::buildTestDB()` (`:145`). In production it writes a file nobody reads, into a
  directory the container should not need write access to. Resolved by the first decision above.

- **`init.lock` can wedge the container permanently.** `initialize.php:31-40` writes a lock file and
  refuses to start while it exists. If the process is killed without unwinding, the file survives; the
  next start throws `InvalidArgumentException`, which is caught at `:244` and **exits 0** - under compose
  Apache never starts, under the helm Job the init reports success having done nothing. A staleness/PID
  check, or a postgres advisory lock instead of a file, would be robust. `error.lock` only exists to
  print a warning on the next run, while the exception is already logged through `ErrorHandler`.

- **Sample data and admin bootstrapping share one flag.** `--dont_create_sample_data` gates both the
  sample workspace (`:195`) and the sys-admin (`:220`). Creating the first admin is bootstrapping, not
  sample data, and conflating them means `NO_SAMPLE_DATA=yes` on a fresh production install leaves nobody
  able to log in. `InitDAO::createAdmin()` additionally mints an admin *token* at install time, carrying
  its own `// TODO why?` (`InitDAO:197`).

- **`meta.dbSchemaVersion` currently records the app version.** `initialize.php:108` stamps
  `$systemVersion` unconditionally, overwriting what `installPatches()` set per patch (`InitDAO:355`), on
  every run.
  - A fresh postgres install ends at `18.3.0-beta` although `full.postgres.sql` inserts `18.2.0` and no
    patch applied.
  - The gate at `:85` skips `patches.d` entirely once DB version >= app version, so a patch added later
    in the same dev cycle is invisible on every already-stamped DB - the `next.sql` special case
    (`InitDAO:332-343`) is a workaround for exactly this.
  - With `--skip_db_integrity_check` an incomplete schema passes `:105`, gets stamped, and `:109` prints
    "DB passed integrity check." anyway - the success message sits outside the check it reports on.
  - `setDBSchemaVersion()` silently returns when the value is `0.0.0-no-table` (`InitDAO:370`), so a
    caller cannot tell "stamped" from "skipped".
  - `installPatches()` names its "patch is older than the DB, skip it" flag `$shouldBeInstalled`
    (`InitDAO:342`) - the opposite of how it reads - and re-queries `getDBSchemaVersion()` once per patch
    file inside the loop.

  *Resolution:* delete `:108`, and delete the `$isCurrentVersion` gate at `:85-87` too - comparing the
  schema version against the *app* version is the wrong question. `installPatches()` already answers the
  right one; always call it and let it decide.

- **`getDbStatus()` probes tables by catching exceptions.** `getTableStatus()` (`InitDAO:266`) runs
  `SELECT * FROM $table LIMIT 10` per table and treats any exception as "table missing".
  - Latent postgres hazard: a failed statement aborts the enclosing transaction and everything after it
    fails until rollback. `initialize.php` opens no transaction so it works today, but `TestEnvironment`
    does use `beginTransaction()`/`rollBack()`. Postgres-native: `SELECT to_regclass(...) IS NOT NULL`,
    or one `information_schema.tables` query for all 22 tables - 1 round-trip instead of 22.
  - It fetches up to 10 full rows from 22 tables, twice per init, to answer a yes/no question.
  - The `'used'` key in the return array (`InitDAO:261`) is read by nobody; both callers
    (`initialize.php:70`, `:104`) use only `'message'` and `'tables'`.

### Test database

`scripts/database/000-create-test-db.sh` was mounted into the mysql container's
`docker-entrypoint-initdb.d`; that mount is gone and nothing replaced it. `DB::connectToTestDB()` still
expects `TEST_<dbname>`, so the backend test suite cannot run. Needs a postgres version - note that
postgres folds unquoted identifiers to lowercase, so the `CREATE DATABASE` must quote the name or the
connection string will not find it. Still referenced (chmod only) in `scripts/ci/e2e.yml`,
`scripts/ci/backend.yml`, `scripts/make/dev.mk`.

The initialization tests bring their own database:
`backend/test/initialization/docker-compose.initialization-test.yml:79` starts `mysql:8.4`. The test
scripts themselves reach the DB through PHP (`functions.sh` `run sql` -> `functions/sql.php`), so the
compose service and the `MYSQL_HOST`/`MYSQL_PORT` wiring are what need changing, not the test bodies.

### Remaining mysql references

- **Environment variables.** `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`,
  `MYSQL_PASSWORD` are still the canonical names - read in `SystemConfig.class.php`, the `x-env-mysql`
  anchor in `docker-compose.yml`, `.env.dev-template`, `.env.prod-template`, helm values, and generated
  by `scripts/install.sh`. Renaming to `DB_*` is breaking for deployments; one commit, with a CHANGELOG
  entry. `MYSQL_ROOT_PASSWORD` and `MYSQL_BINLOG_EXPIRE_LOGS_SECONDS` are already unused and go with it.
- **Helm** still deploys mysql: `scripts/helm/testcenter/templates/db/{deployment,service,secret}.yaml`
  and `values.yaml`.
- **`scripts/update.sh`** takes its pre-update backup with `mysqldump` (~`:164`) - needs `pg_dump`.
- **`db_vol`** now holds postgres data. On an existing deployment it still contains the old mysql data
  directory; the migration script has to deal with that.
- **`docs/agent/database.md`** points at `full.sql` as the reference for table shape - the pointer stays
  correct, but it should say the file is hand-maintained rather than generated.
