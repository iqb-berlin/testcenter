# PostgreSQL migration: status, open work, and release documentation

This is a working document for the `postgres-migration` branch. Delete it after the release.
Before you delete it, move all required information to the permanent documentation.

## Purpose and source of truth

This document answers three questions:

1. What has already been migrated and verified?
2. What still has to be implemented or decided before release?
3. Which compatibility changes must be documented for users and operators?

`scripts/database/full.sql` is the hand-maintained source of truth for the PostgreSQL schema.
The `MIGRATIONSHINWEISE` section records the schema conversion decisions.
These decisions cover enums, booleans, collations, identity sequences, and `REPLACE INTO`.
Read these notes before you change the schema.

## Status at a glance

| Area | Status | Release relevance |
| --- | --- | --- |
| PostgreSQL schema and basic backend operation | Done | Migration foundation |
| Backend unit tests | Done | 257 tests and 820 assertions pass |
| Backend initialization tests | Done | All four general suites pass |
| Dredd API tests | Done | API suite passes |
| Cypress end-to-end tests | Done | All eight suites pass |
| Upgrade from the last MySQL release | Open | Release blocker |
| Deployment and Helm conversion | Open | Release blocker |
| Backup and restore conversion | Open | Release blocker |
| Runtime identity-sequence repair | Open | Release blocker |
| Removal of MySQL runtime dependencies | Open | Release blocker |
| API boolean contract | Decision required | Possible breaking API change |
| User and operator documentation | Open | Release blocker |

## Completed work

### Database and application migration

- [x] The team converted the application schema in `scripts/database/full.sql` to PostgreSQL.
- [x] The team documented the important schema conversion decisions in the `MIGRATIONSHINWEISE` section of `full.sql`.
- [x] The MySQL-specific multi-table `DELETE` used by
  `AdminDAO::deleteResultDataByPersonAndBooklet()` now uses PostgreSQL syntax.
  The method still needs a transaction and simpler queries. See the remaining correctness work.
- [x] `TimeStamp::fromSQLFormat()` accepts PostgreSQL `timestamptz` values both with and without fractional
  seconds.
- [x] `testdata.sql` synchronizes the test-fixture identity sequences with `setval`.
- [x] The `no-db-but-files` initialization test covers the restore-from-files initialization path.
  It does not prove that the workspace identity sequence works after restoration.

### Decided compatibility contract: timestamps

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

### Completed tests

- [x] `make test-backend-unit` passes all 257 tests and 820 assertions on PostgreSQL.
- [x] `make test-backend-initialization-general` passes.
  All four suites in `backend/test/initialization/tests/general/` pass.
  The team removed the obsolete MySQL `db-versions.sh` test. The target runs `make stop` first.
- [x] `make test-backend-api` passes the Dredd API suite. See `docs/agent/api-testing-dredd.md`.
- [x] All eight Cypress suites configured in `scripts/ci/e2e.yml` pass.
- [ ] Run backend-api and e2e tests again after you decide and implement the boolean contract.

## Work remaining before release

### 1. Build the supported MySQL-to-PostgreSQL upgrade path

The project does not support a direct, in-place database upgrade.
An older installation can also require MySQL patches that the PostgreSQL release no longer includes.

- [ ] Create `scripts/migration/next.sh`.
  During release preparation, rename it to the release version, as you do for `patches.d/next.sql`.
- [ ] Refuse migration unless `meta.dbSchemaVersion` is at least the final MySQL release version.
- [ ] Dump the MySQL database.
  Then convert its data to the PostgreSQL schema and restore the data to PostgreSQL.
- [ ] Synchronize all identity sequences listed in `full.sql` migration note 4 after importing explicit
  IDs.
- [ ] Handle the existing `db_vol`.
  Before the upgrade, this volume contains a MySQL data directory. After the migration, it contains PostgreSQL data.
- [ ] Add automated coverage for a representative upgrade with real MySQL data.
- [ ] Automate the release-script rename, or add a check for it.
  If nobody renames `next.sh`, `update.sh` does not download it. The migration guard then does not run.

The integration hook already exists.
`update.sh` calls `run_complementary_migration_scripts()` after `create_data_backup` and before the image swap.
MySQL still operates at this point. Thus, the script can safely refuse the upgrade.

You must address two constraints:

- Migration scripts do not receive `SOURCE_VERSION`.
  `update.sh` calls them without arguments and does not export the variable.
  The migration script must read `meta.dbSchemaVersion` from the MySQL container.
  Alternatively, change the update infrastructure to pass the version.
- A nonzero migration-script exit does not stop the update.
  `update.sh` asks whether to continue and uses yes as the default answer.
  Decide whether to keep this behavior with a clear warning or require a stop. See “Decisions required.”

### 2. Convert deployment configuration and Helm

- [ ] Decide whether to rename the legacy `MYSQL_*` database connection variables.
  Choose neutral names or PostgreSQL-specific names. If you rename them, change all names in one update.
  Add an explicit mapping to the release notes.
- [ ] Update all consumers of the selected variable names.
  These consumers include `SystemConfig.class.php`, `docker-compose.yml`, `.env.dev-template`, and `.env.prod-template`.
  They also include `scripts/install.sh` and the Compose configuration for initialization tests.
- [ ] Remove the unused `MYSQL_ROOT_PASSWORD` and `MYSQL_BINLOG_EXPIRE_LOGS_SECONDS` configuration.
- [ ] Replace the MySQL Helm resources in `scripts/helm/testcenter/templates/db/` with PostgreSQL resources.
  Replace the Deployment, Service, and Secret.
- [ ] Update the backend Helm Deployment and Job, `values.yaml`, and their secrets to use the final
  database configuration.
- [ ] Update or replace `scripts/helm/helm-install-tc.sh`.
  It generates MySQL credentials and changes `mysqlUser`, `mysqlPassword`, and `mysqlRootPassword`.
- [ ] Make sure that a new Compose installation and a new Helm installation work.

The current Compose setup operates PostgreSQL.
It maps the existing `MYSQL_*` configuration to the PostgreSQL `POSTGRES_*` initialization configuration.
This compatibility bridge is temporary.

### 3. Convert operational database tooling

- [ ] Replace the pre-update `mysqldump` backup in `scripts/update.sh` with a PostgreSQL backup.
- [ ] Convert all `backup` and `restore` targets in `scripts/make/prod.mk`.
  Include the all-databases variants that authenticate as the MySQL root user.
- [ ] Replace the MySQL shell opened by `scripts/make/dev.mk` with `psql`.
- [ ] Replace the `mysql:8.4` image scan in `scripts/make/scan.mk` with the PostgreSQL image scan.
- [ ] Test backup and restore.
  Include error behavior and restoration to an empty deployment.

The backup artifact format and the operational commands will change.
This is a breaking change for operators. Document it before the release.

### 4. Fix runtime identity sequences after explicit-ID inserts

`InitDAO::createWorkspaceIfMissing()` inserts `workspaces.name` and a `workspaces.id` that the caller supplies.
`initialize.php` uses this method when a workspace exists on disk but has no database row.
MySQL moved `AUTO_INCREMENT` past an explicitly inserted ID. PostgreSQL does not move `GENERATED BY DEFAULT AS IDENTITY` in this case.
After a file restore, the next UI-created workspace can fail with a duplicate-key error.

- [ ] Synchronize the `workspaces.id` sequence after an explicit-ID insert.
  Use `setval(pg_get_serial_sequence('workspaces', 'id'), ...)` or a shared equivalent.
- [ ] Examine every other identity table in `full.sql` migration note 4.
  Find runtime paths that insert explicit IDs.
- [ ] Extend `backend/test/initialization/tests/general/no-db-but-files.sh`.
  Restore workspace folders, and then create another workspace. Make sure that no ID collision occurs.

### 5. Remove obsolete MySQL runtime dependencies

- [ ] Remove `pdo_mysql` from `backend/Dockerfile` once the migration tooling no longer needs it in that
  image.
- [ ] Remove `ext-pdo_mysql` from `backend/composer.json` and require `ext-pdo_pgsql` instead.
- [ ] Regenerate `backend/composer.lock` if necessary. Make sure that the new file is correct.

### 6. Resolve remaining initialization correctness issues

#### Give `meta.dbSchemaVersion` one meaning

This value must record the newest schema change in the database.
Currently, `initialize.php` always writes the application version after initialization.
In contrast, `installPatches()` writes the version of each applied patch.
The application-version comparison can also skip all files in `patches.d`.
An existing database then cannot find a patch that developers add later in the same development cycle.

- [ ] Remove the unconditional application-version stamp.
- [ ] Remove the gate that compares the database version with the application version.
  `installPatches()` already finds the missing schema patches.
- [ ] Replace the stale `18.2.0` value in `full.sql` with the correct baseline strategy.
- [ ] Make `setDBSchemaVersion()` report or reject the `0.0.0-no-table` case.
  Callers must be able to distinguish “stamped” from “skipped.”

#### Make initialization locking recoverable

`initialize.php` creates `backend/config/init.lock` and refuses to operate while the file exists.
If the process stops before cleanup, the file remains.
The next process catches the exception and exits with status 0.
As a result, Apache does not start under Compose.
The Helm initialization Job incorrectly reports success.

- [ ] Choose and implement either a stale-lock/PID strategy or a PostgreSQL advisory lock.
- [ ] Make sure that an initialization refusal or error returns a nonzero exit status.
- [ ] Add tests for interrupted initialization and a subsequent retry.

#### Separate admin bootstrapping from sample data

`--dont_create_sample_data` prevents creation of the sample workspace and the first system administrator.
As a result, a new production installation with `NO_SAMPLE_DATA=yes` can have no administrator.
No user can then log in as an administrator.

- [ ] Create the first administrator independently of the sample-data flag.
- [ ] Decide whether `InitDAO::createAdmin()` must still create an administrator token during installation.
  The current code contains an unresolved `TODO` about this behavior.
- [ ] Cover a fresh installation with sample data disabled.

### 7. Fix or record adjacent correctness and maintenance issues

- [ ] Refactor `AdminDAO::deleteResultDataByPersonAndBooklet()`.
  Select the affected test IDs one time. Delete by ID in one transaction.
  Remove duplicate group names with `array_unique`. If there are no IDs, return before the code creates `id in ()`.
- [ ] Add an explicit offset to the timestamp in `SessionDAOTest.php`.
  The test does not assert this value.
  PostgreSQL interprets it in the session timezone, not as the apparent Berlin wall time.
- [ ] Initialize `$unresolvedRelations` in `WorkspaceDAO::storeRelations()` as an integer.
  The code initializes it as an array and increments it with `++`.
  Thus, `relations_unresolved` is always zero. This problem existed before the PostgreSQL migration and is unrelated to it.
- [ ] Add a schema-drift guard.
  After installation of `full.sql`, `installPatches()` must have no patches to apply. The schema integrity check must pass.
- [ ] Document in `docs/agent/database.md` that `full.sql` is hand-maintained rather than generated.
- [ ] Document the `german2_ci` constraint in `docs/agent/database.md`.
  PostgreSQL rejects `LIKE`, `~`, and regular-expression operations on columns with this non-deterministic collation.
  No current DAO uses these operations. Future queries must obey this constraint.
- [ ] Delete `scripts/database/mysql-legacy/` after the migration converter and upgrade tests no longer
  need the original MySQL column definitions.

## Decisions required before implementation can be finalized

These choices affect public or operational contracts.
Do not make these decisions as part of another task.

### Boolean API values

PDO returns PostgreSQL booleans as `true` and `false` values.
The MySQL driver returned `"0"` and `"1"` strings. Thus, direct JSON encoding of DAO results changes the value type.

Choose one approach:

1. Preserve the external contract. Convert booleans to strings at the API boundary.
2. Adopt JSON booleans. Update all frontend consumers and API documentation. Announce the breaking API change.

After the decision, run Dredd and Cypress again. These tests cover the complete contract.

### Database environment-variable names

Choose one approach:

1. Keep `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, and `MYSQL_PORT` temporarily as
   compatibility names, despite the database now being PostgreSQL.
2. Rename them in one change to the agreed `DB_*` or `POSTGRES_*` names.
   Document a complete old-to-new mapping for Compose, `.env.prod`, Helm values, and custom deployments.

This rename is a breaking deployment and configuration change.

### Migration failure behavior

Choose one approach:

1. Keep the general “proceed after migration failure” prompt in `update.sh`.
   Make the PostgreSQL migration warning clear. Use no as the default answer for this case.
2. Stop the target release update when the MySQL prerequisite check or data migration fails.

A hard stop is safer for data integrity but changes the shared update infrastructure.

### Configurable display timezone

`SystemConfig::$system_timezone` has the fixed value `Europe/Berlin`.
Stored instants do not depend on it.
It controls display formats and the interpretation of wall-clock times from booklet XML.

Choose one approach:

1. Keep Europe/Berlin as the product-wide fixed timezone and document that limitation.
2. Add an environment variable and keep Europe/Berlin as the default.
   Document its effect on displayed timestamps and booklet time interpretation.

## Documentation required for users and operators

Document all confirmed compatibility changes before the release.
A conditional entry becomes required if the team selects its breaking option.

### Release notes in `docs/CHANGELOG.md`

Add the operator and integrator items under `Technisches`.
These items affect external deployments and meet the changelog rule for that section.

- [ ] **Required:** State that Testcenter uses PostgreSQL instead of MySQL.
  Include the supported PostgreSQL version. State that users cannot directly reuse an existing MySQL data directory.
- [ ] **Required:** Document the supported upgrade path and the minimum source release or schema version.
  Include automatic steps, manual steps, expected downtime, backup behavior, recovery, and rollback.
- [ ] **Required:** Document how the migration handles the existing `db_vol`.
  Include the free-space requirements while the dump and new PostgreSQL data both exist.
- [ ] **Required:** Document the new backup and restore commands and artifact format.
  State whether users can restore old MySQL dumps. Name the required release or tool.
- [ ] **Required:** Document the PostgreSQL timestamp strings in APIs and CSV exports.
  These strings can include a UTC offset and optional fractional seconds.
- [ ] **Required:** Document changes to Docker and Compose images, Helm values, and secrets.
  Include database ports, health checks, and the required PHP extension.
- [ ] **Conditional:** Document the old-to-new environment-variable mapping if the team renames the `MYSQL_*` variables.
- [ ] **Conditional:** If the team adopts the new boolean contract, document the changed JSON boolean fields.
  They change from `"0"` and `"1"` strings to `false` and `true` values.
- [ ] **Conditional:** If the team adds configurable timezone support, document the new environment variable.
  Include its default value and behavior.

### Permanent operator documentation

- [ ] Update the installation documentation.
  Cover PostgreSQL prerequisites, configuration, credentials, port, storage, health checks, and initial database creation.
- [ ] Add a migration guide.
  Cover prerequisite checks, backup checks, migration steps, expected duration, downtime, validation, rollback, and troubleshooting.
- [ ] Update backup and disaster-recovery documentation with PostgreSQL commands and restore tests.
- [ ] Update Helm documentation and example values, including the secret-key migration.
- [ ] Document how custom deployments must provide `pdo_pgsql`. Remove assumptions about `pdo_mysql`.
- [ ] Add the schema-maintenance and collation constraints to `docs/agent/database.md`.

### API and integration documentation

- [ ] Update the documentation for each external timestamp field that can expose a raw DAO value.
  Describe the accepted PostgreSQL format, offset, and optional microseconds.
- [ ] Update CSV/export documentation for the same timestamp representation.
- [ ] After the boolean decision, document the selected contract.
  Document the preserved string contract, or update schemas and examples to use JSON booleans.
- [ ] Make sure that the examples and generated API checks agree with the final timestamp and boolean contracts.

## Final release checklist

- [ ] Complete all release-blocking implementation items in this document.
- [ ] Make sure that all four test tiers pass after the final contract decisions.
- [ ] Successfully migrate a MySQL installation from the minimum supported source version.
- [ ] Test the backup, migration error, retry, restore, and rollback paths.
- [ ] Make sure that new Compose and Helm installations work.
- [ ] Make sure that no production path or dependency requires MySQL.
- [ ] Delete `scripts/database/mysql-legacy/`.
- [ ] Publish the required changelog, migration, installation, backup, Helm, API, and CSV documentation.
- [ ] Delete this working document.
