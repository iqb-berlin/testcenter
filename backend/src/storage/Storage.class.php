<?php
declare(strict_types=1);

/**
 * Singleton factory selecting the active storage driver from SystemConfig.
 * `filesystem` (default) keeps today's behaviour; `s3` uses object storage.
 */
class Storage {
  private static ?StorageDriver $driver = null;

  public static function driver(): StorageDriver {
    if (self::$driver === null) {
      self::$driver = (SystemConfig::$storage_driver === 's3')
        ? new S3Driver()
        : new FilesystemDriver();
    }
    return self::$driver;
  }

  public static function isObjectStore(): bool {
    return SystemConfig::$storage_driver === 's3';
  }

  /**
   * Convert an absolute DATA_DIR path into the logical path used as the object
   * key (and file-server URI), e.g. /var/www/testcenter/data/ws_3/Resource/x
   * becomes ws_3/Resource/x. Returns null for paths outside DATA_DIR.
   */
  public static function toLogical(string $absPath): ?string {
    $root = rtrim(DATA_DIR, '/') . '/';
    if (str_starts_with($absPath, $root)) {
      return substr($absPath, strlen($root));
    }
    return null;
  }

  /** For tests: force a specific driver (or reset with null). */
  public static function setDriver(?StorageDriver $driver): void {
    self::$driver = $driver;
  }
}
