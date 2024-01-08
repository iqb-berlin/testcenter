<?php

class TestDB {
  static function setUp(): void {
    SystemConfig::$debug_useInsecurePasswords = false;
    SystemConfig::$debug_useStaticTokens = true;
    self::connectWithRetries(10);
    TestEnvironment::buildTestDB();
  }

  private static function connectWithRetries(int $retries = 1): void {
    while ($retries--) {
      try {
        DB::connectToTestDB();
        return;
      } catch (Throwable $t) {
        $msg = $t->getMessage();
        echo "\n Database Connection failed! \n Error: $msg \n Retry: $retries attempts left.";
        if ($retries) {
          usleep(50 * 100000); // give database container time to come up
        }
      }
    }
    throw new RuntimeException("DB-connection failed. \n Config:" . SystemConfig::dumpDbConfig());
  }
}

