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

    self::connectWithRetries(10);
    TestEnvironment::buildTestDB(defined('REAL_ROOT_DIR') ? REAL_ROOT_DIR : ROOT_DIR);
  }


  private static function connectWithRetries(int $retries = 1): void {
    while ($retries--) {
      try {
        if ($config = self::readDBConfigFromEnvironment()) {
          DB::connect($config); // when unit tests run in uninitialized container (like in CI)
        } else {
          DB::connectToTestDB(defined('REAL_ROOT_DIR') ? REAL_ROOT_DIR : ROOT_DIR);
        }
        return;
      } catch (Throwable $t) {
        $msg = $t->getMessage();
        echo "\n Database Connection failed! \n Error: $msg \n Retry: $retries attempts left.";
        if ($retries) {
          usleep(50 * 100000); // give database container time to come up
        }
      }
    }
    echo ("DB-connection failed. \n Config:" . print_r($config, true));
    exit(1);
  }

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
      "salt" => getenv('MYSQL_SALT'),
      "staticTokens" => true,
      "insecurePasswords" => true
    ]);
  }
}

