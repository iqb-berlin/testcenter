## Postgres Migration - Open Items

Working notes for the `postgres-migration` branch. Delete this file once the migration is done.

`scripts/database/full.sql` is the hand-maintained source of truth for the schema and carries its own
translation notes at the end (`MIGRATIONSHINWEISE`) - read them before touching it, they cover the enum,
boolean, collation and `REPLACE INTO` decisions.

### Code

- **`AdminDAO::deleteResultDataByPersonAndBooklet()` still uses mysql multi-table `DELETE`**
  (`AdminDAO:148`, `delete tests from tests inner join ...`). Postgres spells it `DELETE ... USING`.
  This is the last known-broken production query; no unit test reaches it.

- **`WorkspaceDAOTest::test_getGlobalIds` fails on row order.** `getGlobalIds()` has no `ORDER BY`, so
  the order is engine-dependent and the expectation froze what mysql happened to return. Either add an
  `ORDER BY` (the API response becomes deterministic) or sort in the test. The only failing unit test:
  256 of 257 pass.

- **`SessionDAOTest.php:522` inserts a timestamp without an offset.** Same gap that was closed in
  `testdata.sql`; harmless today because the test does not assert on that value, but it is read in the
  session time zone rather than the Berlin wall time it looks like.

- **`$unresolvedRelations` in `WorkspaceDAO::storeRelations()` (`:561`) is initialised as an array but
  incremented with `++`,** which PHP silently ignores - so `relations_unresolved` is always 0.
  Pre-existing, unrelated to postgres.

### Contracts still to decide

- **The boolean API contract.** PDO now returns real `true`/`false` where mysql returned `"0"`/`"1"`, so
  anything JSON-encoded straight to the client changes shape. Either cast back in SQL to preserve the
  contract, or accept it and update `docs/api` and the frontend.

- **The display timezone is hardcoded.** The app-DB boundary is timezone-free (`toSQLFormat()` writes UTC
  with an explicit offset, `fromSQLFormat()` honours what postgres returns, `toDisplayFormat()` renders
  for people). But `SystemConfig::$system_timezone` is a hardcoded `'Europe/Berlin'` with no env
  override. Nothing stored depends on it any more - it only affects display formatting and parsing
  wall-clock times out of booklet XML - but a deployment outside Germany has no way to set it.

### initialize.php

- **`meta.dbSchemaVersion` should mean one thing:** the version of the newest schema change contained in
  this database. Today `initialize.php:108` stamps `$systemVersion` unconditionally on every run,
  overwriting what `installPatches()` set per patch, and the `$isCurrentVersion` gate at `:85-87` skips
  `patches.d` entirely once the DB version is >= the app version - so a patch added later in the same dev
  cycle is invisible on an already-stamped DB.
  *Resolution:* delete `:108` and the gate at `:85-87`; comparing the schema version against the *app*
  version is the wrong question, and `installPatches()` already answers the right one.
  Related: `full.sql:669` still stamps `18.2.0`, a leftover from when the file was snapshotted, and
  `setDBSchemaVersion()` silently returns when the value is `0.0.0-no-table` (`InitDAO:370`), so a caller
  cannot tell "stamped" from "skipped".

- **`init.lock` can wedge the container permanently.** `initialize.php:31-40` writes a lock file and
  refuses to start while it exists. If the process is killed without unwinding, the file survives; the
  next start throws `InvalidArgumentException`, which is caught at `:244` and **exits 0** - under compose
  Apache never starts, under the helm Job the init reports success having done nothing. A staleness/PID
  check, or a postgres advisory lock instead of a file, would be robust.

- **Sample data and admin bootstrapping share one flag.** `--dont_create_sample_data` gates both the
  sample workspace (`:190`) and the sys-admin (`:215`). Creating the first admin is bootstrapping, not
  sample data, so `NO_SAMPLE_DATA=yes` on a fresh production install leaves nobody able to log in.
  `InitDAO::createAdmin()` additionally mints an admin *token* at install time, carrying its own
  `// TODO why?` (`InitDAO:197`).

### Schema maintenance

- [ ] **Drift guard for `full.sql`.** A schema change must now be written twice - as a patch *and* folded
  into `full.sql` by hand. Needs a test that installs `full.sql` and asserts `installPatches()` has
  nothing left to do and the integrity check passes.

- [ ] **`scripts/database/mysql-legacy/` must be deleted before the release.** It is kept only while the
  migration script is written, since mapping mysql data into the postgres schema needs the original
  column types.

### Upgrade path

There is no in-place mysql -> postgres upgrade, and an admin on an older release would need mysql patches
the postgres release no longer ships. So `scripts/migration/next.sh` (renamed to the release tag at
release time, mirroring `patches.d/next.sql`) must refuse when the installed database is below the last
mysql release, then do the dump -> convert -> restore.

- The hook exists: `update.sh` calls `run_complementary_migration_scripts()` (`:276`) after
  `create_data_backup` and before the images are swapped, while mysql is still running. Nothing is torn
  down at that point, so a refusal is safe. See `scripts/migration/18.0.0.sh` for the existing shape.
- Two constraints found there, **no changes made to `update.sh`**:
  - Migration scripts get no `SOURCE_VERSION` - they are invoked bare (`update.sh:384`) and the variable
    is not exported. So check the invariant directly: read `meta.dbSchemaVersion` out of the
    still-running mysql container.
  - A non-zero exit does not stop the update. `update.sh:388-393` asks "Do you want to proceed? [Y/n]"
    and **defaults to yes**, so one keypress continues into the image swap. Either accept that and make
    the message unmissable, or add a hard stop in the target release's `update.sh` - the latter means
    touching update logic, which needs a decision.
- The rename to the release tag is a manual release step; if it is forgotten, `update.sh` never fetches
  the script and the guard silently does not run.

### Remaining mysql references

- **Environment variables.** `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`,
  `MYSQL_PASSWORD` are still the canonical names - read in `SystemConfig.class.php`, the `x-env-mysql`
  anchor in `docker-compose.yml`, `.env.dev-template`, `.env.prod-template`, helm values, and generated
  by `scripts/install.sh`. Renaming to `DB_*` is breaking for deployments; one commit, with a CHANGELOG
  entry. `MYSQL_ROOT_PASSWORD` and `MYSQL_BINLOG_EXPIRE_LOGS_SECONDS` are already unused and go with it.
- **Helm** still deploys mysql: `scripts/helm/testcenter/templates/db/{deployment,service,secret}.yaml`
  and `values.yaml`.
- **`scripts/update.sh`** takes its pre-update backup with `mysqldump` (`:164`, `:176`) - needs `pg_dump`.
- **`db_vol`** now holds postgres data. On an existing deployment it still contains the old mysql data
  directory; the migration script has to deal with that.
- **`backend/test/initialization/tests/general/`** (4 suites) has not been run against postgres.
  `db-versions.sh` was deleted with the mysql patches.
- **`docs/agent/database.md`** points at `full.sql` as the reference for table shape - the pointer stays
  correct, but it should say the file is hand-maintained rather than generated.
