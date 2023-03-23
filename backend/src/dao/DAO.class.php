<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class DAO {
  const tables = [ // because we use different types of DB is difficult to get table list by command
    'admin_sessions',
    'test_commands',
    'test_logs',
    'test_reviews',
    'tests',
    'logins',
    'login_sessions',
    'person_sessions',
    'unit_logs',
    'unit_reviews',
    'units',
    'users',
    'workspace_users',
    'workspaces',
    'meta',
    'unit_data',
    'files',
    'unit_defs_attachments',
    'file_relations'
  ];

  protected bool|PDO $pdoDBhandle = false;
  protected int $timeUserIsAllowedInMinutes = 600;
  protected ?string $passwordSalt = 't';
  protected bool $insecurePasswords = false;

  protected int $lastAffectedRows = 0;

  public function __construct() {
    $this->pdoDBhandle = DB::getConnection();

    $this->pdoDBhandle->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $this->passwordSalt = DB::getConfig()->salt;
    $this->insecurePasswords = DB::getConfig()->insecurePasswords;
  }

  public function __destruct() {
    if ($this->pdoDBhandle !== false) {
      unset($this->pdoDBhandle);
      $this->pdoDBhandle = false;
    }
  }

  public function _(string $sql, array $replacements = [], $multiRow = false): ?array {
    $sqlStatement = $this->pdoDBhandle->prepare($sql);

    try {
      $sqlStatement->execute($replacements);
    } catch (Exception $exception) {
      $caller = debug_backtrace(!DEBUG_BACKTRACE_PROVIDE_OBJECT | DEBUG_BACKTRACE_IGNORE_ARGS, 2)[1]['function'];
      throw new Exception($exception->getMessage() . " ($caller)");
    }

    $this->lastAffectedRows = $sqlStatement->rowCount();

    if (!$sqlStatement->columnCount()) {
      return null;
    }

    if ($multiRow) {
      $result = $sqlStatement->fetchAll(PDO::FETCH_ASSOC);
      return is_bool($result) ? [] : $result;
    }

    $result = $sqlStatement->fetch(PDO::FETCH_ASSOC);
    return is_bool($result) ? null : $result;
  }

  protected function randomToken(string $type, string $name): string {
    if (DB::getConfig()->staticTokens) {
      return substr("static:$type:$name", 0, 50);
    }

    return uniqid('a', true);
  }

  /**
   * @codeCoverageIgnore
   */
  public function runFile(string $path): void {
    if (!file_exists($path)) {
      throw new HttpError("File does not exist: `$path`");
    }

    $this->pdoDBhandle->exec(file_get_contents($path));
  }

  /**
   * @codeCoverageIgnore
   */
  public function getDBType(): string {
    return $this->pdoDBhandle->getAttribute(PDO::ATTR_DRIVER_NAME);
  }

  public function getDBSchemaVersion(): string {
    try {
      $result = $this->_("select `value` from meta where metaKey = 'dbSchemaVersion'");
      return $result['value'] ?? '0.0.0-no-entry';

    } catch (Exception) {
      return '0.0.0-no-table';
    }
  }

  public function getMeta(array $categories): array {
    $categoriesString = implode(',', array_map([$this->pdoDBhandle, "quote"], $categories));
    $result = $this->_("SELECT * FROM meta where category in ($categoriesString)", [], true);
    $returner = [];
    foreach ($categories as $category) {
      $returner[$category] = [];
    }
    foreach ($result as $row) {
      $returner[$row['category']][$row['metaKey']] = $row['value'];
    }
    return $returner;
  }

  public function setMeta(string $category, string $key, ?string $value): void {
    $currentValue = $this->_("select `value` from meta where metaKey = :key", [':key' => $key]);

    if (!$currentValue) {
      $this->_(
        "insert into meta (category, metaKey, value) values (:category, :key, :value)",
        [
          ':key' => $key,
          ':category' => $category,
          ':value' => $value
        ]
      );
    } else {
      $this->_(
        "update meta set value=:value, category=:category where metaKey = :key",
        [
          ':key' => $key,
          ':category' => $category,
          ':value' => $value
        ]
      );
    }
  }

  public function getTestFullState(array $testSessionData): array {
    $testState = JSON::decode($testSessionData['testState'] ?? '', true);

    if ($testSessionData['locked']) {
      $testState['status'] = 'locked';
    } else if (!$testSessionData['running']) {
      $testState['status'] = 'pending';
    } else {
      $testState['status'] = 'running';
    }

    return $testState;
  }
}
