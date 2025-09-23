<?php
/** @noinspection PhpUnhandledExceptionInspection */

class CacheService {
  private static Redis|null $redis = null;

  private static function connect(): bool {
    if (
      !SystemConfig::$cacheServer_host or
      !SystemConfig::$cacheServer_port or
      !SystemConfig::$cacheServer_password
    ) {
      return false;
    }
    if (!isset(self::$redis)) {
      try {
        self::$redis = new Redis([
          'host' => SystemConfig::$cacheServer_host,
          'port' => SystemConfig::$cacheServer_port,
          'auth' => SystemConfig::$cacheServer_password
        ]);
      } catch (RedisException $exception) {
        throw new Exception("Could not reach Cache-Service: " . $exception->getMessage());
      }
    }
    return true;
  }

  static function storeAuthentication(PersonSession $personSession): void {
    if (!self::connect()) {
      return;
    }
    self::$redis->set(
      'group-token:' . $personSession->getLoginSession()->getGroupToken(),
      $personSession->getLoginSession()->getLogin()->getWorkspaceId(),
      $personSession->getLoginSession()->getLogin()->getValidTo()
        ? $personSession->getLoginSession()->getLogin()->getValidTo() - TimeStamp::now()
        : 24 * 60 * 60
    );
  }

  public static function removeAuthentication(PersonSession $personSession): void {
    if (!self::connect()) {
      return;
    }
    self::$redis->del('group-token:' . $personSession->getPerson()->getToken());
  }

  public static function storeFile(string $filePath): void {
    if (!SystemConfig::$cacheServer_includeFiles) {
      return;
    }
    if (!self::connect()) {
      return;
    }
    if (self::$redis->exists("file:$filePath")) {
      self::$redis->expire("file:$filePath", 24 * 60 * 60);
    } else {
      try {
        self::$redis->set("file:$filePath", file_get_contents(DATA_DIR . $filePath), 24 * 60 * 60);
      } catch (RedisException $e) {
        error_log('Cache exhausted: ' . $filePath);
      }
    }
  }

  static function getStatusFilesCache(): string {
    if (
      !SystemConfig::$cacheServer_host or
      !SystemConfig::$cacheServer_port or
      !SystemConfig::$cacheServer_password or
      !SystemConfig::$cacheServer_includeFiles
    ) {
      return 'off';
    }
    try {
      self::connect();
    } catch (RedisException $exception) {
      return 'unreachable';
    }
    return 'on';
  }

  public static function getFailedLogins(string $name): int {
    if (!self::connect()) return 0;
    $loginsFailed = self::$redis->get("login-failed:$name:");
    return (int) $loginsFailed;
  }

  public static function addFailedLogin(string $name): void {
    if (!self::connect()) return;
    $loginsFailed = self::getFailedLogins($name);
    $loginsFailed++;
    $expiration = SystemConfig::$debug_fastLoginReuse ? 5 : 30 * 60;
    self::$redis->set("login-failed:$name:", $loginsFailed, $expiration);
  }
}
