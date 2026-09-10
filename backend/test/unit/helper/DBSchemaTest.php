<?php

/** @noinspection PhpIllegalPsrClassPathInspection */

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class DBSchemaTest extends TestCase {
  /**
   * A fresh installation gets its schema version from full.sql and never runs the patches folded
   * into it. If that stamp and DBSchema::REQUIRED_VERSION disagree, such an installation either
   * fails the check in check-db-compatibility.php or replays patches it already contains.
   */
  function test_fullSqlStampsTheRequiredVersion(): void {
    $fullSql = file_get_contents(ROOT_DIR . '/scripts/database/full.sql');

    $matches = [];
    $found = preg_match(
      "/insert\s+into\s+meta\s*\([^)]*\)\s*values\s*\(\s*'dbSchemaVersion'\s*,\s*'([^']+)'/i",
      $fullSql,
      $matches
    );

    $this->assertSame(1, $found, 'full.sql does not stamp meta.dbSchemaVersion.');
    $this->assertSame(
      DBSchema::REQUIRED_VERSION,
      $matches[1],
      'full.sql stamps a different schema version than DBSchema::REQUIRED_VERSION.'
    );
  }
}
