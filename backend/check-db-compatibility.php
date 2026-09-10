#!/usr/bin/env php
<?php
/**
 * Verifies that the database holds the schema this release expects.
 *
 * Runs on every backend start (see backend/entrypoint.sh) and never writes to the database.
 * Installing the schema and applying patches is a separate step: backend/initialize.php,
 * reachable as `make testcenter-init`.
 */

if (php_sapi_name() !== 'cli') {
  header('HTTP/1.0 403 Forbidden');
  echo "This is only for usage from command line.";
  exit(1);
}

define('ROOT_DIR', realpath(__DIR__ . '/..'));
const DATA_DIR = ROOT_DIR . '/data';

require_once __DIR__ . '/vendor/autoload.php';

const FIX_HINT = "Run `make testcenter-init` to bring the database up to date.";

try {
  SystemConfig::readEnvironment();
  CLI::connectDBWithRetries();

  $initDAO = new InitDAO();
  $dbSchemaVersion = $initDAO->getDBSchemaVersion();

  if ($dbSchemaVersion == '0.0.0-no-table') {
    CLI::error("The database holds no Testcenter schema.");
    CLI::p(FIX_HINT);
    exit(1);
  }

  if ($dbSchemaVersion == '0.0.0-no-entry') {
    CLI::error("The database schema carries no version. It is incomplete or was not created by this application.");
    CLI::p(FIX_HINT);
    exit(1);
  }

  if ($dbSchemaVersion !== DBSchema::REQUIRED_VERSION) {
    CLI::error("Database schema is $dbSchemaVersion, this release requires " . DBSchema::REQUIRED_VERSION . ".");
    CLI::p(FIX_HINT);
    exit(1);
  }

  $dbStatus = $initDAO->getDbStatus();
  if ($dbStatus['tables'] != 'complete') {
    CLI::error("Database schema is incomplete: {$dbStatus['message']}");
    CLI::p(FIX_HINT);
    exit(1);
  }

  CLI::success("Database schema $dbSchemaVersion matches this release.");
  exit(0);
} catch (Throwable $e) {
  CLI::error("Could not verify the database schema: {$e->getMessage()}");
  exit(1);
}
