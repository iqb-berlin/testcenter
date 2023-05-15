<?php

class TestDB {
  static function setUp(): void {
    require_once "src/dao/DAO.class.php";
    require_once "src/dao/SessionDAO.class.php";
    require_once "src/dao/InitDAO.class.php";
    require_once "src/data-collection/DataCollection.class.php";
    require_once "src/data-collection/DBConfig.class.php";
    require_once "src/helper/DB.class.php";
    require_once "src/helper/JSON.class.php";
    require_once "src/helper/Version.class.php";
    require_once "src/helper/Token.class.php";
    require_once "src/helper/Folder.class.php";
    require_once "src/helper/TestEnvironment.class.php";
    if (!defined('ROOT_DIR')) {
      define("ROOT_DIR", REAL_ROOT_DIR);
    }

    self::connectWithRetries();
    TestEnvironment::buildTestDB();
  }


  private static function connectWithRetries(int $retries = 1): void {
    while ($retries--) {
      try {
        $config = self::readDBConfigFromEnvironment();
        DB::connectToTestDB($config);
        return;
      } catch (Throwable $t) {
        echo "\n Database Connection failed! Retry: $retries attempts left.";
        usleep(50 * 1000000); // give database container time to come up
      }
    }
    throw new Exception('DB-connection failed: ' . print_r($config, true));
  }

  // when unit tests run in uninitialized container (like in CI)
  private static function readDBConfigFromEnvironment(): ?DBConfig {
    if (!getenv('MYSQL_PASSWORD')) {
      return null;
    }
    return new DBConfig([
      "dbname" => getenv('MYSQL_DATABASE'),
      "host" => getenv('MYSQL_HOST'),
      "port" => getenv('MYSQL_PORT'),
      "user" => getenv('MYSQL_USER'),
      "password" => getenv('MYSQL_PASSWORD'),
      "salt" => getenv('MYSQL_SALT')
    ]);
  }
}

