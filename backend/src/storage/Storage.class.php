<?php
declare(strict_types=1);

/** Hands out the storage driver of this installation. Local temp files do not go through it. */
class Storage {
  private static ?StorageDriver $driver = null;

  static function getDriver(): StorageDriver {
    if (!self::$driver) {
      self::$driver = SystemConfig::$storage_driver->createDriver(SystemConfig::$storage_root);
    }
    return self::$driver;
  }

  /**
   * Writes and deletes a probe file, so that a storage the backend cannot reach or write to fails at startup and not
   * on the first upload. Listing would not catch keys that may read but not write.
   */
  static function checkWriteAccess(): void {
    // a name of its own per check, so that backends starting at the same time do not delete each other's probe
    $probe = StorageDirectory::root()->createFilePath('.write-check-' . bin2hex(random_bytes(8)));
    try {
      self::getDriver()->putContents($probe, '');
      self::getDriver()->delete($probe);
    } catch (Exception $exception) {
      $storage = SystemConfig::$storage_driver->describeLocation();
      throw new Exception("Storage ($storage) is not writable: {$exception->getMessage()}", 0, $exception);
    }
  }
}
