<?php
declare(strict_types=1);

/** The settings of one storage driver, without the storage root, which test mode switches. */
interface StorageDriverConfig {
  /** @param string $root the outermost segment of every stored file's location */
  public function createDriver(string $root): StorageDriver;
}
