<?php
/** @noinspection PhpUnhandledExceptionInspection */

class DBConfig extends DataCollection {
  public ?string $host = "localhost";
  public ?string $port = "3306";
  public ?string $dbname = null;
  public ?string $user = null;
  public ?string $password = null;
  public ?string $salt = "t"; // for passwords
  public bool $staticTokens = false; // relevant for unit- and e2e-tests
  public bool $insecurePasswords = false; // relevant for unit- and e2e-tests
}
