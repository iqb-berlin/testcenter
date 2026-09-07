# PostgreSQL migration: status, open work, and release documentation

This is a working document for the `postgres-migration` branch. Delete it after the release.
Before you delete it, move all required information to the permanent documentation.

Completed and verified work is no longer listed here. The branch history,
`scripts/database/full.sql`, and `docs/CHANGELOG.md` record it. This document contains only what is
still open and the issues that the migration uncovered but does not have to fix.

## Purpose and source of truth

This document answers three questions:

1. What still has to be implemented or decided before release?
2. Which compatibility changes must be documented for users and operators?
3. Which issues did the migration uncover that the team can address later?

`scripts/database/full.sql` is the hand-maintained source of truth for the PostgreSQL schema.
The `MIGRATIONSHINWEISE` section records the schema conversion decisions.
These decisions cover enums, booleans, collations, identity sequences, and `REPLACE INTO`.
Read these notes before you change the schema.

## Status at a glance

| Area | Status | Release relevance |
| --- | --- | --- |
| `MYSQL_*` to `DB_*` rename in an existing `.env.prod` | Done, needs a release-time rename | Release blocker |
| Verification of backup and restore | Open | Release blocker |
| User and operator documentation | Open | Release blocker |
| Initialization correctness follow-ups | Deferred | Not a blocker |
| Pre-existing defects found during the migration | Deferred | Not a blocker |

Schema, backend operation, all four test tiers, Compose volume isolation, Helm and deployment
configuration, the operational `psql`/`pg_dump` tooling, the runtime identity-sequence repair,
and the removal of the MySQL runtime dependencies are done and verified.

## Work remaining before release

### 1. Rename the database variables in an existing `.env.prod`

- [ ] **At release time:** rename `scripts/migration/next.sh` to `scripts/migration/<release>.sh`
  and set its `TARGET_VERSION` accordingly.
  `scripts/updater.sh` looks for `scripts/migration/<release tag>.sh` for every release between the
  installed and the target release, so a file named `next.sh` is never found automatically.
  This is the same convention that the previous env-file migrations used; `18.2.0.sh` still carries
  the `TARGET_VERSION='next'` of its development phase.
  Without the rename an update leaves the old names, and the backend has no database configuration.

The pre-update database dump does not need a MySQL fallback.
`scripts/update.sh` runs the backup phase with the updater of the *installed* release, so an old
installation dumps itself with `mysqldump` and its own `MYSQL_*` names.
`backup_phase()` creates that dump before it runs the migration scripts of the target release, so
the rename cannot break the dump.

### 2. Verify the operational database tooling

- [ ] Test backup and restore.
  Cover `testcenter-dump-db` and `testcenter-restore-db`, the pre-update dump in
  `scripts/updater.sh`, the error behavior, and restoration into an empty deployment.
  Confirm that both produce interchangeable artifacts.

The backup artifact format and the operational commands change with this release.
This is a breaking change for operators. Document it before the release.

### 3. Remove the legacy schema reference

- [ ] Delete `scripts/database/mysql-legacy/` when the PostgreSQL schema review no longer needs the
  original MySQL column definitions.

## Documentation required for users and operators

Document all confirmed compatibility changes before the release.

### Permanent operator documentation

- [ ] Update the installation documentation.
  Cover PostgreSQL prerequisites, configuration, credentials, port, storage, health checks, and initial database creation.
- [ ] Add a Compose transition guide.
  Cover the new volume name, the unchanged legacy volume, the empty PostgreSQL database, rollback, and troubleshooting.
- [ ] Update backup and disaster-recovery documentation with PostgreSQL commands and restore tests.
- [ ] Update Helm documentation and example values, including the secret-key migration.
- [ ] Document how custom deployments must provide `pdo_pgsql`. Remove assumptions about `pdo_mysql`.
- [ ] Document in `docs/agent/database.md` that `full.sql` is hand-maintained rather than generated.
- [ ] Document the `german2_ci` constraint in `docs/agent/database.md`.
  PostgreSQL rejects `LIKE`, `~`, and regular-expression operations on columns with this non-deterministic collation.
  No current DAO uses these operations. Future queries must obey this constraint.

## Issues found during the migration that are not release blockers

The migration exposed these issues. None of them blocks the release.
The first group existed before the migration and is unrelated to PostgreSQL.
The second group belongs to the migration but can wait.

### Pre-existing issues, unrelated to PostgreSQL

- **`test_commands.id` has a race.**
  `AdminDAO::storeCommand()` derives the ID from `max(id) + 1`. Two commanders can compute the same ID.
- **`relations_unresolved` is always zero.**
  `WorkspaceDAO::storeRelations()` initializes `$unresolvedRelations` as an array in
  `WorkspaceDAO.class.php:584` and increments it with `++` in line 592.
- **`meta.dbSchemaVersion` has two meanings.**
  `initialize.php:108` always stamps the application version after initialization, while
  `installPatches()` stamps the version of each applied patch.
  The comparison in `initialize.php:85` can also skip all files in `patches.d`, so an existing
  database cannot find a patch that developers add later in the same development cycle.
  A cleanup has to remove the unconditional stamp, remove the version gate, decide the baseline
  value that `full.sql:669` writes (currently the stale `18.2.0`), and make
  `setDBSchemaVersion()` report or reject the `0.0.0-no-table` case so that callers can distinguish
  “stamped” from “skipped.”
- **Initialization locking is not recoverable.**
  `initialize.php` creates `backend/config/init.lock` and refuses to operate while the file exists.
  If the process stops before cleanup, the file remains. The next process catches the exception and
  exits with status 0. As a result Apache does not start under Compose, and the Helm initialization
  Job incorrectly reports success.
  A fix has to choose a stale-lock/PID strategy or a PostgreSQL advisory lock, return a nonzero exit
  status on refusal or error, and add tests for an interrupted initialization and a retry.
- **Admin bootstrapping depends on the sample-data flag.**
  `--dont_create_sample_data` prevents creation of the sample workspace *and* of the first system
  administrator, so a new production installation with `NO_SAMPLE_DATA=yes` can have no
  administrator and nobody can log in.
  The first administrator has to be created independently of the flag, and a fresh installation
  without sample data needs test coverage. `InitDAO::createAdmin()` also contains an unresolved
  `TODO` about whether installation must still create an administrator token.
- **`InitDAO::installPatches()` reads `$patches[0]` before it checks the list.**
  Line 398 accesses the first element to detect a `next` patch.
  `scripts/database/patches.d` is empty on this branch, so every initialization run takes that path
  with an empty array.
- **`AdminDAO::deleteResultDataByPersonAndBooklet()` needs a cleanup.**
  The method runs without a transaction, does not deduplicate the affected group names, and produces
  `in ()` for an empty `$setsToDelete`.
  The PostgreSQL conversion changed only the `DELETE` syntax and kept this shape.
  A refactoring should select the affected test IDs once, delete by ID in one transaction, apply
  `array_unique` to the group names, and return early when there are no IDs.
- **The `OVERRIDE_CONFIG` of the e2e Compose file is dead.**
  `e2e/docker-compose.system-test-headless.yml:33` sets `[fileService] external=` and
  `[broadcastingService] external=`, but the properties are `$fileServer_url` and `$broadcaster_url`.
  `SystemConfig::apply()` skips unknown keys through its `property_exists()` check, so both
  overrides are discarded without a warning.
  `$fileService_external` was renamed in commit `e55ebcc90` (2025-05-23) and the override was never
  updated, so it has been ineffective since then. All eight Cypress suites pass regardless, which
  means the values are not needed - either delete them or correct the key names.
  Worth considering separately: `apply()` silently ignoring unknown keys is what let this rot
  unnoticed, and `OVERRIDE_CONFIG` is not reachable in production anyway, because
  `docker-compose.yml` does not pass it to the backend service.
- **The display timezone is not configurable.**
  `SystemConfig::$system_timezone` is fixed to `Europe/Berlin`. The migration does not change this
  behavior in either direction, so there is nothing here to document for the release.
  The setting is the last piece of deployment-specific configuration that is compiled into the
  product, and it does two different jobs:
  - Semantic: `TimeStamp::fromXMLFormat()` interprets the `validFrom`/`validTo` wall times of
    Testtakers XML (`XMLFileTesttakers.class.php:269-270`), so the zone decides when a login window
    opens and closes.
  - Cosmetic: the display formats, the CSV and SysCheck report dates, and the expiration messages,
    plus the `date_default_timezone_set()` default in `index.php:57`.

  Stored instants never depend on it: `toSQLFormat()` always writes UTC with an explicit offset, and
  `now()`, `isExpired()`, and `expirationFromNow()` compare Unix timestamps.
  `GET /system/time` already publishes the value, and the SysCheck warns whenever the browser zone
  differs (`welcome.component.ts:160`) - a warning that currently fires for every non-Berlin user.

  Constraints for whoever implements it:
  - Make the variable optional with `Europe/Berlin` as the fallback. `stringEnv()` throws on a
    missing variable and `verifyClassProperties()` requires every property to be set, so an
    optional read needs a small default-aware helper. Optional means no migration script and no
    operator action, in this release or any later one.
  - Validate the value once at configuration time. `TimeStamp` builds a `DateTimeZone` on nearly
    every call, so an invalid zone would otherwise surface as a 500 inside an unrelated request.
  - Treat it as install-time-only and say so. Changing it on a running installation leaves stored
    instants correct but silently reinterprets every `validFrom`/`validTo` in existing Testtakers
    XML, which shifts login windows.
  - Feed every deployment path: both env templates, `docker-compose.yml`, the initialization-test
    Compose configuration, and the Helm values and Deployment.

### Migration follow-ups that can wait

- **`SessionDAOTest.php:544` uses a timestamp without an offset.**
  PostgreSQL interprets `'2030-01-02 10:00:00'` in the session timezone rather than as the apparent
  Berlin wall time. The test does not assert this value, so it passes either way.
  Add an explicit offset.
- **The Helm value substitution is broader than intended.**
  `scripts/helm/helm-install-tc.sh:280-284` replaces any four-space-indented `database:`, `user:`,
  or `password:` key in the values file.
  `values.yaml` currently contains exactly one of each (lines 107, 157, 160), so the result is
  correct today, but a second such key would break it. Anchor each substitution to its path.
- **The two endpoints that expose a raw database timestamp have no test coverage.**
  Neither Dredd nor any backend test calls `GET /test/{test_id}/reviews` or
  `GET /test/{test_id}/unit/{unit_name}/reviews`, so nothing verifies their documented examples
  against real output. Their `reviewtime` is the only externally visible value whose format the
  migration changed, which makes it the one place where a regression would go unnoticed.
- **No schema-drift guard exists.**
  Nothing verifies that `installPatches()` has no patches left to apply directly after an
  installation of `full.sql` and that the schema integrity check passes.

## Final release checklist

- [ ] Complete all release-blocking implementation items in this document.
- [ ] Make sure that all four test tiers pass.
- [ ] Test a Compose transition from the last MySQL release without a database migration.
      Make sure that the transition creates `postgres_vol` and leaves `db_vol` unchanged.
- [ ] Test an update of an existing `.env.prod` with the new migration script.
- [ ] Test the new PostgreSQL backup, restore, and rollback paths.
- [ ] Make sure that new Compose and Helm installations work.
- [ ] Make sure that no production path or dependency requires MySQL.
- [ ] Delete `scripts/database/mysql-legacy/`.
- [ ] Publish the required changelog, transition, installation, backup, Helm, API, and CSV documentation.
- [ ] Delete this working document.
