<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class DB {
  private const int connectionTimeout = 5; // seconds; keeps unreachable hosts from blocking a whole attempt
  private const int initialRetryDelay = 1; // seconds; doubles after every failed attempt
  private const int maxRetryDelay = 20; // seconds

  private static PDO $pdo;

  /**
   * @param int $attempts maximum number of connection attempts; > 1 waits for a database server still starting up.
   * @param callable|null $reportFailure called as ($exception, $attempt, $attempts) after every failed attempt.
   * @throws DBConnectionException
   */
  static function connect(int $attempts = 1, ?callable $reportFailure = null): void {
    self::$pdo = self::establish(SystemConfig::$database_name, $attempts, $reportFailure);
  }

  /**
   * @throws DBConnectionException
   * @see DB::connect()
   */
  static function connectToTestDB(int $attempts = 1, ?callable $reportFailure = null): void {
    self::$pdo = self::establish('TEST_' . SystemConfig::$database_name, $attempts, $reportFailure);
  }

  static function getConnection(): PDO {
    if (!isset(self::$pdo)) {
      throw new Exception("DB connection not set up yet.");
    }
    return self::$pdo;
  }

  /**
   * Retries as long as the error might be caused by a database server which is not up yet. Errors which will never
   * resolve by waiting - a wrong password, for example - abort the remaining attempts immediately.
   * @throws DBConnectionException
   */
  private static function establish(string $databaseName, int $attempts, ?callable $reportFailure): PDO {
    $attempts = max(1, $attempts);
    $delay = self::initialRetryDelay;

    for ($attempt = 1; ; $attempt++) {
      try {
        return self::createConnection($databaseName);

      } catch (PDOException $pdoException) {
        $exception = DBConnectionException::fromPDOException($pdoException);

        if ($reportFailure) {
          $reportFailure($exception, $attempt, $attempts);
        }

        if (!$exception->isRecoverable() or ($attempt >= $attempts)) {
          throw $exception;
        }

        sleep($delay);
        $delay = min($delay * 2, self::maxRetryDelay);
      }
    }
  }

  private static function createConnection(string $databaseName): PDO {
    return new PDO(
      "mysql:host=" . SystemConfig::$database_host . ";port=" . SystemConfig::$database_port . ";dbname=" . $databaseName,
      SystemConfig::$database_user,
      SystemConfig::$database_password,
      [PDO::ATTR_TIMEOUT => self::connectionTimeout]
    );
  }
}
