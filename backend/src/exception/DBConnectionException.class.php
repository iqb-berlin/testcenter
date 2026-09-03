<?php
declare(strict_types=1);

/**
 * A failed attempt to establish a database connection.
 *
 * Carries the MySQL error code (https://dev.mysql.com/doc/mysql-errors/) to tell conditions
 * that might resolve themselves - typically a database server which is not up yet - apart from
 * misconfigurations, which will never resolve by waiting.
 */
class DBConnectionException extends RuntimeException {
  // Errors which will not go away by retrying, each with a hint about what to check.
  private const array fatalErrors = [
    1044 => "The user exists, but has no access to the database. Check `MYSQL_DATABASE` or grant the missing privileges.",
    1045 => "The database server rejected user or password. Note that `MYSQL_USER` and `MYSQL_PASSWORD` only take "
      . "effect while the data volume of the database is created: an existing volume keeps the credentials it was "
      . "initialized with. Either put those original credentials into the environment, or delete the data volume of "
      . "the database to start over - which deletes all data.",
    1049 => "The database does not exist on the server. Note that `MYSQL_DATABASE` only takes effect while the data "
      . "volume of the database is created: an existing volume keeps the database it was initialized with.",
    1130 => "The database server does not allow connections from this host. Check the host-part of the user's account.",
    1698 => "The database server rejected the login, because the user's account expects another authentication method.",
    2005 => "The host name of the database server can not be resolved. Check `MYSQL_HOST`.",
    2059 => "The authentication method the user's account requires is not supported by this client.",
  ];

  private int $dbErrorCode;

  private function __construct(string $message, int $dbErrorCode, Throwable $previous) {
    $this->dbErrorCode = $dbErrorCode;
    parent::__construct($message, 0, $previous);
  }

  static function fromPDOException(PDOException $pdoException): DBConnectionException {
    return new DBConnectionException(
      $pdoException->getMessage(),
      DBConnectionException::readDbErrorCode($pdoException),
      $pdoException
    );
  }

  // PDO leaves `errorInfo` empty when the connection itself failed, so the code has to be read from the message.
  private static function readDbErrorCode(PDOException $pdoException): int {
    if (isset($pdoException->errorInfo[1])) {
      return (int) $pdoException->errorInfo[1];
    }

    if (preg_match('/^SQLSTATE\[\w+] \[(\d+)]/', $pdoException->getMessage(), $matches)) {
      return (int) $matches[1];
    }

    return 0;
  }

  // Unknown errors count as recoverable: better to wait in vain than to refuse to start for no good reason.
  function isRecoverable(): bool {
    return !isset(DBConnectionException::fatalErrors[$this->dbErrorCode]);
  }

  function getHint(): string {
    return DBConnectionException::fatalErrors[$this->dbErrorCode] ?? '';
  }
}
