<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class DB {
  private static PDO $pdo;
  private static DBConfig $config;

  static function connect(): void {
    self::$config = DBConfig::fromFile(ROOT_DIR . '/backend/config/DBConnectionData.json');
    self::setUpConnection();
  }

  static function connectToTestDB(): string {
    self::$config = DBConfig::fromFile(ROOT_DIR . '/backend/config/DBConnectionData.json');
    $prodDbName = self::$config->dbname;
    self::$config->dbname = 'TMP_' . self::$config->dbname;
    self::$config->staticTokens = true;
    self::$config->insecurePasswords = true;
    self::setUpConnection();
    return $prodDbName;
  }

  private static function setUpConnection(): void {
    self::$pdo = new PDO(
      "mysql:host=" . self::$config->host . ";port=" . self::$config->port . ";dbname=" . self::$config->dbname,
      self::$config->user,
      self::$config->password
    );
  }

  static function getConnection(): PDO {
    if (!isset(self::$pdo)) {
      throw new Exception("DB connection not set up yet");
    }

    return self::$pdo;
  }

  static function getConfig(): DBConfig {
    if (!isset(self::$config)) {
      throw new Exception("DB connection not set up yet");
    }

    return self::$config;
  }
}
