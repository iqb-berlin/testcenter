<?php

class TestDB {
  static function setUp(): void {
    SystemConfig::$debug_useInsecurePasswords = false;
    SystemConfig::$debug_useStaticTokens = true;

    try {
      DB::connectToTestDB(10, TestDB::reportFailedConnection(...));
    } catch (DBConnectionException $exception) {
      if ($exception->getHint()) {
        echo "\n Hint: {$exception->getHint()}";
      }
      echo "\n Database configuration used: " . SystemConfig::dumpDbConfig();
      throw $exception;
    }

    TestEnvironment::buildTestDB();
  }

  private static function reportFailedConnection(DBConnectionException $exception, int $attempt, int $attempts): void {
    echo "\n Database Connection attempt $attempt of $attempts failed: {$exception->getMessage()}";
  }
}
