<?php

declare(strict_types=1);

/**
 * Carries why a database connection could not be established.
 *
 * PostgreSQL reports SQLSTATE 08006 for every connect failure - a rejected password, a missing database and an
 * unreachable host are indistinguishable by code. Only the driver's message tells them apart, so it is passed on
 * verbatim, together with the connection target it was tried against. The password is never part of the message:
 * it ends up in log files and in `backend/config/error.lock`.
 */
class DbConnectionException extends Exception {
  public function __construct(string $databaseName, PDOException $previous) {
    $target = SystemConfig::$database_user . '@' . SystemConfig::$database_host
      . ':' . SystemConfig::$database_port . '/' . $databaseName;

    // The code is not taken from the PDOException: for query errors it holds the SQLSTATE as a string, which does
    // not fit Exception::$code. It is part of the driver message anyway.
    parent::__construct("Database connection to `$target` failed: {$previous->getMessage()}", 0, $previous);
  }
}
