<?php

class TestDB {
  static function setUp(): void {
    SystemConfig::$debug_useInsecurePasswords = false;
    SystemConfig::$debug_useStaticTokens = true;
    DB::connectToTestDBWithRetries(10, 5);
    TestEnvironment::buildTestDB();
  }
}

