<?php
declare(strict_types=1);

/**
 * The database schema this release expects to find.
 *
 * Changes only when the schema changes, named after the release introducing that change. Bump it
 * together with the version that `scripts/database/full.sql` stamps into `meta.dbSchemaVersion`.
 *
 * A fresh installation gets its stamp from `full.sql`, an existing one is raised patch by patch by
 * InitDAO::installPatches().
 */
class DBSchema {
  const REQUIRED_VERSION = '18.3.0';
}
