<?php
declare(strict_types=1);

readonly class FilesystemDriverConfig implements StorageDriverConfig {
  /** @param string $directory the directory on disk the storage root is kept in */
  function __construct(
    public string $directory
  ) {
  }

  public function createDriver(string $root): StorageDriver {
    return new FilesystemDriver($this->directory, $root);
  }
}
