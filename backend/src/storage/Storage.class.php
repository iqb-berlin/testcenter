<?php
declare(strict_types=1);

/** Hands out the storage driver of this installation. Local temp files do not go through it. */
class Storage {
  private static ?StorageDriver $driver = null;

  static function getDriver(): StorageDriver {
    if (!self::$driver) {
      self::$driver = new FilesystemDriver(DATA_DIR);
    }
    return self::$driver;
  }
}
