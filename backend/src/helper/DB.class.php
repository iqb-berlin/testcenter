<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class DB {
  private static PDO $pdo;

  static function connect(): void {
    self::$pdo = new PDO(
      "mysql:host=" . SystemConfig::$database_host . ";port=" . SystemConfig::$database_port . ";dbname=" . SystemConfig::$database_name,
      SystemConfig::$database_user,
      SystemConfig::$database_password
    );
  }

  static function connectToTestDB(): void {
    self::$pdo = new PDO(
      "mysql:host=" . SystemConfig::$database_host . ";port=" . SystemConfig::$database_port . ";dbname=TEST_" . SystemConfig::$database_name,
      SystemConfig::$database_user,
      SystemConfig::$database_password
    );
  }

  static function getConnection(): PDO {
    if (!isset(self::$pdo)) {
      throw new Exception("DB connection not set up yet.");
    }
    return self::$pdo;
  }
}
