# PostgreSQL migration: status, open work, and release documentation

This is a working document for the `postgres-migration` branch. Delete it after the release.
Before you delete it, move all required information to the permanent documentation.

Completed and verified work is no longer listed here. The branch history and
`scripts/database/full.sql` record it. This document now contains only what is still open,
the contracts that still have to be documented, and the issues that the migration uncovered
but does not have to fix.

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

## Confirmed contracts

These contracts are decided. They are listed here because the release documentation still has to
describe them.

### Timestamps

The database and external APIs accept the PostgreSQL timestamp representation.
A `timestamptz` value can contain an offset and up to six fractional-second digits.
For example, the value can be `2021-07-29 10:00:00.744751+00`.
PostgreSQL omits the fraction when its value is zero.

This format intentionally differs from the previous MySQL format.
The MySQL format contained no offset and no fractional seconds.

The resulting contract is:

- `TimeStamp::fromSQLFormat()` accepts `Y-m-d H:i:s.uP` and `Y-m-d H:i:sP`.
- The offset identifies the instant. Consumers must use the offset and must not reinterpret it in the configured display timezone.
- JSON API fields and CSV exports can expose DAO timestamp values without conversion.
  These values can include the PostgreSQL offset and optional fractional seconds.
- Call sites that promise an integer Unix timestamp must convert the value with `fromSQLFormat()`.
- Call sites that promise a readable display timestamp must convert the value with `sqlToDisplayFormat()`.

### Booleans in the API layer

The change from `tinyint(1)` to `boolean` in the database layer has no consequence for the API layer.
All affected values already pass through a transformation to a JSON boolean.

### Database environment-variable names

The public database configuration uses only the neutral `DB_*` names.
Compose maps these values to the standard PostgreSQL image variables at the database container
boundary. There is no fallback for the former `MYSQL_*` names and no public `POSTGRES_*` names.

This rename is a breaking deployment and configuration change.
The release notes contain the complete old-to-new mapping for Compose, Helm, and custom deployments.

## Decision still required

### Configurable display timezone

`SystemConfig::$system_timezone` has the fixed value `Europe/Berlin`.
Stored instants do not depend on it.
It controls display formats and the interpretation of wall-clock times from booklet XML.

Choose one approach:

1. Keep Europe/Berlin as the product-wide fixed timezone and document that limitation.
2. Add an environment variable and keep Europe/Berlin as the default.
   Document its effect on displayed timestamps and booklet time interpretation.

## Work remaining before release

### 1. Rename the database variables in an existing `.env.prod`

- [x] `scripts/migration/next.sh` renames `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, and a
  hand-added `MYSQL_HOST` or `MYSQL_PORT` to their `DB_*` names, removes `MYSQL_ROOT_PASSWORD` and
  `MYSQL_BINLOG_EXPIRE_LOGS_SECONDS`, and then verifies that `DB_DATABASE`, `DB_USER`, and
  `DB_PASSWORD` are present and not empty. It exits with status 1 if they are not, so
  `scripts/updater.sh` reports the failure. It is idempotent and does not source `.env.prod`.
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

- [x] Remove `testcenter-dump-all`, `testcenter-restore-all`, `testcenter-dump-db-data-only`, and
  `testcenter-restore-db-data-only` from `scripts/make/prod.mk` and the root `Makefile`.
  `testcenter-restore-all` was broken: its `awk` filter built `create_role` from the undefined
  `$${db_USER}` instead of `$${db_role}`, so the unfiltered `CREATE ROLE` statement reached `psql`
  and `ON_ERROR_STOP=on` aborted the restore on the existing bootstrap role.
  Instead of repairing the filter, the targets are gone: the container hosts only the one
  application database, and the only role is the bootstrap superuser that the image creates from
  `DB_USER`/`DB_PASSWORD`, so `pg_dumpall` dumps nothing that `.env.prod` and a fresh container do
  not already provide. Nothing in the repository called any of the four targets.
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
A conditional entry becomes required if the team selects its breaking option.

### Release notes in `docs/CHANGELOG.md`

The `Technisches` section already documents the switch to PostgreSQL, the volume behavior, the
environment-variable mapping, the Helm and image changes, and the new backup commands.
The following entries are still missing.

- [ ] **Required:** Document the PostgreSQL timestamp strings in APIs and CSV exports.
  These strings can include a UTC offset and optional fractional seconds.
- [ ] **Conditional:** If the team adds configurable timezone support, document the new environment
  variable. Include its default value and behavior.

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

### API and integration documentation

- [ ] Update the documentation for each external timestamp field that can expose a raw DAO value.
  Describe the accepted PostgreSQL format, offset, and optional microseconds.
- [ ] Update CSV/export documentation for the same timestamp representation.
- [ ] Make sure that the examples and generated API checks agree with the final timestamp contract.

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
- **No schema-drift guard exists.**
  Nothing verifies that `installPatches()` has no patches left to apply directly after an
  installation of `full.sql` and that the schema integrity check passes.

## Final release checklist

- [ ] Complete all release-blocking implementation items in this document.
- [ ] Make sure that all four test tiers pass after the final contract decisions.
- [ ] Test a Compose transition from the last MySQL release without a database migration.
      Make sure that the transition creates `postgres_vol` and leaves `db_vol` unchanged.
- [ ] Test an update of an existing `.env.prod` with the new migration script.
- [ ] Test the new PostgreSQL backup, restore, and rollback paths.
- [ ] Make sure that new Compose and Helm installations work.
- [ ] Make sure that no production path or dependency requires MySQL.
- [ ] Delete `scripts/database/mysql-legacy/`.
- [ ] Publish the required changelog, transition, installation, backup, Helm, API, and CSV documentation.
- [ ] Delete this working document.
