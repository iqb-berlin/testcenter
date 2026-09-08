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
| `MYSQL_*` to `DB_*` rename in an existing `.env.prod` | Done | - |
| Verification of backup and restore | Done | - |
| User and operator documentation | Open, except backup and disaster recovery | Release blocker |
| Initialization correctness follow-ups | Deferred | Not a blocker |
| Pre-existing defects found during the migration | Deferred | Not a blocker |

Schema, backend operation, all four test tiers, Compose volume isolation, Helm and deployment
configuration, the operational `psql`/`pg_dump` tooling, the runtime identity-sequence repair,
and the removal of the MySQL runtime dependencies are done and verified.

Backup and restore are done and verified in a Compose installation: `make testcenter-backup` and
`make testcenter-restore` write and read one timestamped set per backup, the pre-update backup of
`scripts/updater.sh` is such a set and restorable, and a database restored into a deployment with an
empty data volume no longer keeps the backend from starting.
The verification used locally built images in a throwaway installation directory, not a published
release. Only the Compose deployment is covered - see the Helm item further down.

## Work remaining before release

Only documentation is left; see the next section.

The env-variable migration script `scripts/migration/next.sh` is written and needs no further work
here. Renaming it to `scripts/migration/<release>.sh` at release time is ordinary release procedure
and is documented in `docs/release_process.md`.

## Documentation required for users and operators

Document all confirmed compatibility changes before the release.

### Permanent operator documentation

- [x] Update the installation documentation.
  `docs/pages/installation-prod.md` gained a `Database` section under `Configuration`: the three `DB_*` settings,
  the fixed host and port, the password that only applies while the database is created, and `psql` access.
  Deliberately not covered: prerequisites, storage, health checks, and the first-start sequence. Nothing there
  changed for an operator - the database was a container nobody installs by hand under MySQL as well - and the
  documentation never described any of it. Document it if someone asks, not as part of this migration.
- [ ] Add a Compose transition guide.
  Cover the new volume name, the unchanged legacy volume, the empty PostgreSQL database, rollback, and troubleshooting.
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
- **A failed initialization restarts forever without a usable signal.**
  Every other error path ends in `exit(1)`, which `backend/entrypoint.sh` propagates. Under
  `RESTART_POLICY=always` the container then repeats the same failure indefinitely; the healthcheck
  reports `starting` until it gives up, and the actual message is only in the log. The one cause
  this migration produced is gone (a restored database with an empty data volume), but any other
  initialization error still behaves this way.
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

- **The Helm deployment has no backup or restore of its own.**
  `make testcenter-backup` and `make testcenter-restore` are Compose commands: they address the
  Compose volume and `docker compose exec`. The chart in `scripts/helm/testcenter` ships nothing
  equivalent. The bundled Longhorn chart can snapshot and back up volumes, but each volume on its
  own, so a pair taken that way is not guaranteed to match across the database and the data volume.
  This gap predates the migration - the MySQL releases had no Helm backup tooling either - so it is
  not a regression, but the Helm documentation should at least say which mechanism operators are
  expected to use.
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

- [ ] Make sure that all four test tiers pass.
- [ ] Test a Compose transition from the last MySQL release without a database migration.
      Make sure that the transition creates `postgres_vol` and leaves `db_vol` unchanged.
- [ ] Test an update of an existing `.env.prod` with the new migration script.
      The pre-update database dump cannot break in the process: `scripts/update.sh` runs the backup
      phase with the updater of the *installed* release, so an old installation dumps itself with
      `mysqldump` and its own `MYSQL_*` names, and `backup_phase()` creates that dump before the
      migration scripts of the target release run.
- [x] Test the new PostgreSQL backup, restore, and rollback paths.
      Done for Compose with locally built images: a backup set and its restore, restoration into an
      empty deployment, the pre-update set of `scripts/updater.sh` and its restore, and the refusal
      paths (database in use, missing or damaged artifact, non-empty data volume without `FORCE`).
      Repeat against the published release images before the release.
- [ ] Make sure that new Compose and Helm installations work.
- [ ] Make sure that no production path or dependency requires MySQL.
- [ ] Publish the required changelog, transition, installation, backup, Helm, API, and CSV documentation.
- [ ] Delete this working document.
