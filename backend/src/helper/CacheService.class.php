<?php /** @noinspection PhpUnhandledExceptionInspection */

class CacheService {
  private static Redis|null $redis = null;

  private static function connect(): void {
    if (!SystemConfig::$cacheService_host) {
      return;
    }
    if (!isset(self::$redis)) {
      try {
        self::$redis = new Redis();
        self::$redis->connect(SystemConfig::$cacheService_host);
      } catch (Exception $exception) {
        throw new Exception("Could not reach Cache-Service: " . $exception->getMessage());
      }
    }
  }

  static function storeAuthentication(PersonSession $personSession): void {
    self::connect();
    if (!self::$redis) {
      return;
    }
    self::$redis->set(
      'group-token:' . $personSession->getLoginSession()->getGroupToken(),
      $personSession->getLoginSession()->getLogin()->getWorkspaceId(),
      $personSession->getLoginSession()->getLogin()->getValidTo()
        ? $personSession->getLoginSession()->getLogin()->getValidTo() - time()
        : 24*60*60
    );
  }

  public static function removeAuthentication(PersonSession $personSession): void {
    self::connect();
    if (!self::$redis) {
      return;
    }
    self::$redis->del('group-token:' . $personSession->getPerson()->getToken());
  }
}