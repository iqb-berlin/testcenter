<?php

class TestDB {
  static function setUp(): void {
    require_once "src/dao/DAO.class.php";
    require_once "src/dao/SessionDAO.class.php";
    require_once "src/dao/InitDAO.class.php";
    require_once "src/helper/JSON.class.php";
    require_once "src/helper/Token.class.php";
    require_once "src/helper/Folder.class.php";
    require_once "src/helper/Version.class.php";
    require_once "src/helper/TestEnvironment.class.php";
    if (!defined('ROOT_DIR')) {
      define("ROOT_DIR", REAL_ROOT_DIR);
    }
    DB::connectToTestDB(self::readDBConfigFromEnvironment());
    $initDao = new InitDAO();

    $nextPatchPath = REAL_ROOT_DIR . '/scripts/database/mysql.patches.d/next.sql';
    $fullSchemePath = REAL_ROOT_DIR . '/scripts/database/database.sql';
    if (file_exists($nextPatchPath) and (filemtime($nextPatchPath) > filemtime($fullSchemePath))) {
      TestEnvironment::updateDataBaseScheme();
      return;
    }
    $initDao->clearDB();
    $initDao->runFile(ROOT_DIR . '/scripts/database/database.sql');
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

