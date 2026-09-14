<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class DB {
  private static PDO $pdo;

  static function connect(): void {
    self::$pdo = self::open(SystemConfig::$database_name);
  }

  static function connectToTestDB(): void {
    self::$pdo = self::open(self::testDatabaseName());
  }

  static function connectWithRetries(int $attempts = 5, int $delaySeconds = 20): void {
    self::$pdo = self::openWithRetries(SystemConfig::$database_name, $attempts, $delaySeconds);
  }

  static function connectToTestDBWithRetries(int $attempts = 5, int $delaySeconds = 20): void {
    self::$pdo = self::openWithRetries(self::testDatabaseName(), $attempts, $delaySeconds);
  }

  static function getConnection(): PDO {
    if (!isset(self::$pdo)) {
      throw new Exception("DB connection not set up yet.");
    }
    return self::$pdo;
  }

  private static function testDatabaseName(): string {
    return 'TEST_' . SystemConfig::$database_name;
  }

  /**
   * @throws DbConnectionException
   */
  private static function open(string $databaseName): PDO {
    $dsn = "pgsql:host=" . SystemConfig::$database_host
      . ";port=" . SystemConfig::$database_port
      . ";dbname=" . $databaseName;

    try {
      $pdo = new PDO($dsn, SystemConfig::$database_user, SystemConfig::$database_password);
    } catch (PDOException $exception) {
      throw new DbConnectionException($databaseName, $exception);
    }

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
  }

  /**
   * Every failure is retried: the reason is reported, never interpreted. A wrong password therefore costs the full
   * set of attempts, just as an unreachable host does.
   *
   * @throws DbConnectionException on the last failed attempt
   */
  private static function openWithRetries(string $databaseName, int $attempts, int $delaySeconds): PDO {
    for ($attempt = 1; ; $attempt++) {
      try {
        CLI::p("Database connection attempt $attempt of $attempts.");
        $pdo = self::open($databaseName);
        CLI::success("Database connection successful!");
        return $pdo;

      } catch (DbConnectionException $exception) {
        CLI::warning($exception->getMessage());

        if ($attempt >= $attempts) {
          throw $exception;
        }

        CLI::warning("Retrying in $delaySeconds seconds.");
        sleep($delaySeconds); // give database container time to come up
      }
    }
  }
}
